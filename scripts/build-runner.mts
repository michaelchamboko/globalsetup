#!/usr/bin/env node
/** Model-agnostic execution-state runner for GlobalSetup projects. */

import {
  closeSync,
  copyFileSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  NodePackageCommandError,
  resolveNodePackageArgv,
} from "./node-package-command.mts";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type Obj = Record<string, any>;
type RunResult = {
  status: number;
  stdout: string;
  stderr: string;
  stdoutBytes: Buffer;
  stderrBytes: Buffer;
};

const VALID_STATUSES = new Set([
  "blocked",
  "ready",
  "in_progress",
  "verified",
  "done",
]);
const REQUIRED_TIERS: Record<string, Set<string>> = {
  low: new Set(["task"]),
  medium: new Set(["task", "affected"]),
  high: new Set(["task", "affected", "full"]),
};
const GITNEXUS_STATUS_ARGV = ["node", ".gitnexus/run.cjs", "status"];
const GITNEXUS_SYNC_ARGV = [
  "node",
  ".gitnexus/run.cjs",
  "analyze",
  "--skip-agents-md",
  "--skip-skills",
];
const GITNEXUS_VERSION = "1.6.10";
const JOURNAL_NAME = "execution-journal.jsonl";

class ContractError extends Error {}
class VerificationFailed extends ContractError {
  result: Obj;
  constructor(message: string, result: Obj) {
    super(message);
    this.result = result;
  }
}

function nowUtc(): string {
  return new Date(Math.floor(Date.now() / 1000) * 1000)
    .toISOString()
    .replace(".000Z", "+00:00");
}
function asciiStringify(value: unknown, indent?: number): string {
  return JSON.stringify(value, null, indent).replace(
    /[\u007f-\uffff]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}
function emitResult(command: string, result: unknown): void {
  process.stdout.write(asciiStringify({ ok: true, command, result }, 2) + "\n");
}
function emitError(command: string, error: string, result?: unknown): void {
  const payload: Obj = { ok: false, command, error };
  if (result !== undefined) payload.result = result;
  process.stderr.write(asciiStringify(payload, 2) + "\n");
}

// JSON.parse silently accepts duplicate keys. This small strict parser rejects them at every depth.
class StrictJsonParser {
  private i = 0;
  private readonly text: string;
  private readonly source: string;
  constructor(text: string, source: string) {
    this.text = text;
    this.source = source;
  }
  parse(): Json {
    const value = this.value();
    this.ws();
    if (this.i !== this.text.length) this.fail("unexpected trailing data");
    return value;
  }
  private fail(message: string): never {
    throw new ContractError(
      `invalid JSON in ${this.source}: ${message} at offset ${this.i}`,
    );
  }
  private ws(): void {
    while (/[\u0009\u000a\u000d\u0020]/.test(this.text[this.i] ?? "")) this.i++;
  }
  private value(): Json {
    this.ws();
    const c = this.text[this.i];
    if (c === "{") return this.object();
    if (c === "[") return this.array();
    if (c === '"') return this.string();
    if (this.text.startsWith("true", this.i)) {
      this.i += 4;
      return true;
    }
    if (this.text.startsWith("false", this.i)) {
      this.i += 5;
      return false;
    }
    if (this.text.startsWith("null", this.i)) {
      this.i += 4;
      return null;
    }
    const match = this.text
      .slice(this.i)
      .match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (match) {
      this.i += match[0].length;
      const n = Number(match[0]);
      if (!Number.isFinite(n)) this.fail("non-finite number");
      return n;
    }
    return this.fail("expected a JSON value");
  }
  private string(): string {
    const start = this.i++;
    let escaped = false;
    while (this.i < this.text.length) {
      const c = this.text[this.i++];
      if (c === '"' && !escaped) {
        try {
          return JSON.parse(this.text.slice(start, this.i));
        } catch {
          return this.fail("invalid string");
        }
      }
      if (c.charCodeAt(0) < 0x20) this.fail("control character in string");
      escaped = c === "\\" ? !escaped : false;
    }
    return this.fail("unterminated string");
  }
  private object(): Obj {
    this.i++;
    const out: Obj = Object.create(null);
    const keys = new Set<string>();
    this.ws();
    if (this.text[this.i] === "}") {
      this.i++;
      return out;
    }
    while (true) {
      this.ws();
      if (this.text[this.i] !== '"') this.fail("expected object key");
      const key = this.string();
      if (keys.has(key))
        throw new ContractError(
          `duplicate JSON key '${key}' in ${this.source}`,
        );
      keys.add(key);
      this.ws();
      if (this.text[this.i++] !== ":") this.fail("expected ':'");
      out[key] = this.value();
      this.ws();
      const c = this.text[this.i++];
      if (c === "}") return out;
      if (c !== ",") this.fail("expected ',' or '}'");
    }
  }
  private array(): Json[] {
    this.i++;
    const out: Json[] = [];
    this.ws();
    if (this.text[this.i] === "]") {
      this.i++;
      return out;
    }
    while (true) {
      out.push(this.value());
      this.ws();
      const c = this.text[this.i++];
      if (c === "]") return out;
      if (c !== ",") this.fail("expected ',' or ']'");
    }
  }
}

function decodeUtf8(bytes: Buffer, source: string): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ContractError(`invalid UTF-8 in ${source}`);
  }
}
function readJson(path: string): Obj {
  let text: string;
  try {
    text = decodeUtf8(readFileSync(path), path);
  } catch (error: any) {
    if (error instanceof ContractError) throw error;
    if (error?.code === "ENOENT")
      throw new ContractError(`missing required file: ${path}`);
    throw new ContractError(`could not read ${path}: ${error.message}`);
  }
  const value = new StrictJsonParser(text, path).parse();
  if (value === null || Array.isArray(value) || typeof value !== "object")
    throw new ContractError(`JSON document must be an object: ${path}`);
  return value as Obj;
}

function writeJsonAtomic(path: string, payload: Obj): void {
  mkdirSync(dirname(path), { recursive: true });
  const temp = join(
    dirname(path),
    `.${basename(path)}.${process.pid}.${randomBytes(8).toString("hex")}`,
  );
  let fd: number | undefined;
  try {
    fd = openSync(temp, "wx", 0o600);
    writeFileSync(fd, JSON.stringify(payload, null, 2) + "\n", "utf8");
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    readJson(temp);
    renameSync(temp, path);
    try {
      const dfd = openSync(dirname(path), "r");
      try {
        fsyncSync(dfd);
      } finally {
        closeSync(dfd);
      }
    } catch {}
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (existsSync(temp)) unlinkSync(temp);
  }
}

class StateLock {
  readonly path: string;
  private fd?: number;
  constructor(statePath: string) {
    this.path = `${statePath}.lock`;
  }
  enter(): void {
    try {
      this.fd = openSync(this.path, "wx", 0o600);
    } catch (error: any) {
      if (error?.code !== "EEXIST") throw error;
      let age = 0;
      try {
        age =
          (Date.now() -
            Date.parse(String(readJson(this.path).started_at ?? ""))) /
          1000;
      } catch {}
      if (age > 3600)
        throw new ContractError(
          `execution state has a stale lock requiring recover: ${this.path}`,
        );
      throw new ContractError(`execution state is locked: ${this.path}`);
    }
    const payload = {
      pid: process.pid,
      nonce: randomBytes(16).toString("hex"),
      started_at: nowUtc(),
      heartbeat_at: nowUtc(),
    };
    writeSync(this.fd, asciiStringify(payload));
    fsyncSync(this.fd);
  }
  exit(): void {
    if (this.fd !== undefined) closeSync(this.fd);
    this.fd = undefined;
    try {
      unlinkSync(this.path);
    } catch (e: any) {
      if (e?.code !== "ENOENT") throw e;
    }
  }
}

function ensureArgv(value: unknown, field: string): string[] {
  if (
    !Array.isArray(value) ||
    !value.length ||
    !value.every((x) => typeof x === "string" && x.length)
  )
    throw new ContractError(
      `${field} must be a non-empty array of command arguments`,
    );
  return value as string[];
}
function runArgv(argv: string[], cwd: string, timeout = 900): RunResult {
  let executableArgv: string[];
  try {
    executableArgv = resolveNodePackageArgv(argv);
  } catch (error) {
    if (error instanceof NodePackageCommandError)
      throw new ContractError(error.message);
    throw error;
  }
  const result = spawnSync(executableArgv[0], executableArgv.slice(1), {
    cwd,
    encoding: null,
    timeout: timeout * 1000,
    shell: false,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error)
    throw new ContractError(
      `could not run command ${JSON.stringify(argv)}: ${result.error.message}`,
    );
  const stdoutBytes = (result.stdout ?? Buffer.alloc(0)) as Buffer,
    stderrBytes = (result.stderr ?? Buffer.alloc(0)) as Buffer;
  return {
    status: result.status ?? 1,
    stdout: stdoutBytes.toString("utf8"),
    stderr: stderrBytes.toString("utf8"),
    stdoutBytes,
    stderrBytes,
  };
}
function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}
function isInside(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return (
    rel === "" ||
    (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
  );
}
function resolvedPath(candidate: string): string {
  let current = resolve(candidate),
    suffix: string[] = [];
  while (!existsSync(current)) {
    const parent = dirname(current);
    if (parent === current) break;
    suffix.unshift(basename(current));
    current = parent;
  }
  const base = existsSync(current) ? realpathSync.native(current) : current;
  return resolve(base, ...suffix);
}
function requireInside(
  root: string,
  candidate: string,
  message: string,
): string {
  const actual = resolvedPath(candidate);
  if (!isInside(root, actual)) throw new ContractError(message);
  return actual;
}

function sourceFingerprint(root: string): string {
  const top = runArgv(["git", "rev-parse", "--show-toplevel"], root, 60);
  if (top.status)
    throw new ContractError(
      "BuildRunner requires the target root to be a Git repository",
    );
  if (realpathSync.native(top.stdout.trim()) !== root)
    throw new ContractError(
      "BuildRunner --root must be the Git repository root",
    );
  const hash = createHash("sha256"),
    head = runArgv(["git", "rev-parse", "--verify", "HEAD"], root, 60);
  let listed: RunResult;
  if (!head.status) {
    hash.update(Buffer.from("HEAD\0"));
    hash.update(Buffer.from(head.stdout.trim()));
    hash.update(Buffer.from("\0"));
    const diff = runArgv(
      [
        "git",
        "diff",
        "--binary",
        "--no-ext-diff",
        "--full-index",
        "HEAD",
        "--",
        ".",
        ":(exclude)build-pack/execution-state.json",
        ":(exclude)build-pack/execution-state.json.lock",
      ],
      root,
      60,
    );
    if (diff.status)
      throw new ContractError(
        `could not fingerprint tracked changes: ${diff.stderr}`,
      );
    hash.update(diff.stdoutBytes);
    listed = runArgv(
      ["git", "ls-files", "--others", "--exclude-standard", "-z"],
      root,
      60,
    );
  } else {
    hash.update(Buffer.from("UNBORN\0"));
    listed = runArgv(
      ["git", "ls-files", "-co", "--exclude-standard", "-z"],
      root,
      60,
    );
  }
  if (listed.status)
    throw new ContractError(
      `could not fingerprint repository files: ${listed.stderr}`,
    );
  const excluded = new Set([
    "build-pack/execution-state.json",
    "build-pack/execution-state.json.lock",
  ]);
  const paths: Buffer[] = [];
  let pathStart = 0;
  for (let index = 0; index < listed.stdoutBytes.length; index++) {
    if (listed.stdoutBytes[index] !== 0) continue;
    if (index > pathStart)
      paths.push(Buffer.from(listed.stdoutBytes.subarray(pathStart, index)));
    pathStart = index + 1;
  }
  paths.sort(Buffer.compare);
  for (const rawPath of paths) {
    let rel: string;
    try {
      rel = new TextDecoder("utf-8", { fatal: true }).decode(rawPath);
    } catch {
      throw new ContractError(
        `Git reported a non-UTF-8 path that BuildRunner cannot safely address: ${rawPath.toString("hex")}`,
      );
    }
    const normalized = rel.replace(/\\/g, "/");
    if (excluded.has(normalized)) continue;
    const candidate = resolvedPath(join(root, rel));
    if (!isInside(root, candidate))
      throw new ContractError(
        `Git reported a path outside the repository: ${normalized}`,
      );
    let content: Buffer;
    try {
      content = readFileSync(candidate);
    } catch (e: any) {
      throw new ContractError(
        `could not fingerprint ${normalized}: ${e.message}`,
      );
    }
    hash.update(Buffer.from(normalized, "utf8"));
    hash.update(Buffer.from("\0"));
    hash.update(createHash("sha256").update(content).digest());
  }
  return hash.digest("hex");
}

function taskMap(state: Obj): Record<string, Obj> {
  return Object.fromEntries(
    (state.tasks ?? []).map((task: Obj) => [task.id, task]),
  );
}
function getTask(state: Obj, id: string): Obj {
  const task = taskMap(state)[id];
  if (!task) throw new ContractError(`unknown task: ${id}`);
  return task;
}
function outputTail(value: string, limit = 2000): string {
  return value.slice(-limit);
}
function setEqualArray(a: unknown, b: string[]): boolean {
  return (
    Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i])
  );
}

function validateContract(
  state: Obj,
  capabilities: Obj,
  root: string,
): string[] {
  const errors: string[] = [];
  if (state.schema_version !== 1)
    errors.push("execution-state schema_version must be 1");
  if (capabilities.schema_version !== 1)
    errors.push("capabilities schema_version must be 1");
  if (!["mvp", "standard", "high_assurance"].includes(state.mode))
    errors.push("mode must be mvp, standard, or high_assurance");
  const approved = new Set<string>(),
    authority = state.source_authority;
  if (!authority || typeof authority !== "object" || Array.isArray(authority))
    errors.push(
      "source_authority must declare approved sources and contradictions",
    );
  else {
    if (
      typeof authority.build_intent_summary !== "string" ||
      !authority.build_intent_summary.trim()
    )
      errors.push(
        "source_authority.build_intent_summary must state what GlobalSetup will build",
      );
    if (
      !authority.grommet_review ||
      authority.grommet_review.status !== "approved"
    )
      errors.push(
        "source_authority.grommet_review must approve the source-to-build mapping",
      );
    if (
      !Array.isArray(authority.approved_sources) ||
      !authority.approved_sources.length
    )
      errors.push(
        "source_authority.approved_sources must be a non-empty array",
      );
    else
      authority.approved_sources.forEach((rel: unknown, i: number) => {
        const field = `source_authority.approved_sources[${i}]`;
        if (typeof rel !== "string" || !rel.trim())
          return errors.push(
            `${field} must be a non-empty repository-relative path`,
          );
        const normalized = rel.replace(/\\/g, "/");
        if (normalized === ".gitnexus" || normalized.startsWith(".gitnexus/"))
          return errors.push(
            `${field} cannot use derived GitNexus data as product authority`,
          );
        let candidate: string;
        try {
          candidate = requireInside(
            root,
            resolve(root, rel),
            `${field} must resolve inside the repository`,
          );
        } catch (e: any) {
          return errors.push(e.message);
        }
        try {
          if (!statSync(candidate).isFile())
            return errors.push(`${field} does not exist: ${rel}`);
        } catch {
          return errors.push(`${field} does not exist: ${rel}`);
        }
        approved.add(rel);
      });
    if (!Array.isArray(authority.contradictions))
      errors.push("source_authority.contradictions must be an array");
    else
      authority.contradictions.forEach((c: unknown, i: number) => {
        if (!c || typeof c !== "object" || Array.isArray(c))
          errors.push(
            `source_authority.contradictions[${i}] must be an object`,
          );
        else if ((c as Obj).status !== "resolved")
          errors.push(
            `source contradiction ${(c as Obj).id ?? i} must be resolved before execution`,
          );
      });
  }
  const automation = state.automation_authority;
  let publicationAuthority: Obj = {};
  if (
    !automation ||
    typeof automation !== "object" ||
    Array.isArray(automation)
  )
    errors.push(
      "automation_authority must explicitly declare publication authority",
    );
  else {
    publicationAuthority = automation.publication;
    if (
      !publicationAuthority ||
      typeof publicationAuthority !== "object" ||
      Array.isArray(publicationAuthority)
    ) {
      errors.push("automation_authority.publication must be an object");
      publicationAuthority = {};
    } else if (typeof publicationAuthority.enabled !== "boolean")
      errors.push(
        "automation_authority.publication.enabled must be true or false",
      );
    if (!Array.isArray(publicationAuthority.destinations))
      errors.push(
        "automation_authority.publication.destinations must be an array",
      );
  }
  const graph = capabilities.graph ?? {};
  if (graph.required !== true) errors.push("graph.required must be true");
  if (graph.provider !== "gitnexus")
    errors.push("graph.provider must be gitnexus");
  if (graph.license?.spdx !== "PolyForm-Noncommercial-1.0.0")
    errors.push("graph.license.spdx must record the GitNexus license");
  if (
    graph.license?.usage !== "noncommercial" ||
    graph.license?.acknowledged !== true
  )
    errors.push(
      "GitNexus use must be declared and acknowledged as noncommercial",
    );
  for (const field of ["status_argv", "sync_argv"])
    try {
      ensureArgv(graph[field], `graph.${field}`);
    } catch (e: any) {
      errors.push(e.message);
    }
  if (!setEqualArray(graph.status_argv, GITNEXUS_STATUS_ARGV))
    errors.push(
      "graph.status_argv must use the repository-local GitNexus runner",
    );
  if (!setEqualArray(graph.sync_argv, GITNEXUS_SYNC_ARGV))
    errors.push(
      "graph.sync_argv must use the repository-local GitNexus runner",
    );
  const tasks = state.tasks;
  if (!Array.isArray(tasks) || !tasks.length) {
    errors.push("tasks must contain at least one approved task");
    return errors;
  }
  const ids = tasks.map((t: Obj) => t?.id);
  if (
    new Set(ids).size !== ids.length ||
    ids.some((id: unknown) => typeof id !== "string" || !id)
  )
    errors.push("task ids must be unique non-empty strings");
  const known = new Set(ids),
    mapping = taskMap(state);
  let active = 0;
  for (const task of tasks) {
    const id = task.id ?? "<unknown>",
      status = task.status;
    if (!VALID_STATUSES.has(status))
      errors.push(`${id}: invalid status ${JSON.stringify(status)}`);
    if (["in_progress", "verified"].includes(status)) active++;
    if (typeof task.source_changes !== "boolean")
      errors.push(`${id}: source_changes must be true or false`);
    if (!Array.isArray(task.context_files) || !task.context_files.length)
      errors.push(`${id}: context_files must be a non-empty array`);
    else
      task.context_files.forEach((rel: unknown, i: number) => {
        const field = `${id}.context_files[${i}]`;
        if (typeof rel !== "string" || !rel.trim())
          return errors.push(
            `${field} must be a non-empty repository-relative path`,
          );
        let candidate: string;
        try {
          candidate = requireInside(
            root,
            resolve(root, rel),
            `${field} must resolve inside the repository`,
          );
        } catch (e: any) {
          return errors.push(e.message);
        }
        try {
          if (!statSync(candidate).isFile())
            errors.push(`${field} does not exist: ${rel}`);
        } catch {
          errors.push(`${field} does not exist: ${rel}`);
        }
      });
    if (
      !Array.isArray(task.requirement_sources) ||
      !task.requirement_sources.length
    )
      errors.push(`${id}: requirement_sources must be a non-empty array`);
    else
      for (const rel of task.requirement_sources) {
        if (!approved.has(rel))
          errors.push(`${id}: requirement source is not approved: ${rel}`);
        if (
          Array.isArray(task.context_files) &&
          !task.context_files.includes(rel)
        )
          errors.push(
            `${id}: requirement source must also be in context_files: ${rel}`,
          );
      }
    if (task.publication != null) {
      if (
        !task.publication ||
        typeof task.publication !== "object" ||
        typeof task.publication.destination !== "string"
      )
        errors.push(`${id}: publication must declare a destination`);
      else if (publicationAuthority.enabled !== true)
        errors.push(`${id}: automated publication is not enabled`);
      else if (
        !(publicationAuthority.destinations ?? []).includes(
          task.publication.destination,
        )
      )
        errors.push(
          `${id}: publication destination is not authorized: ${task.publication.destination}`,
        );
    }
    if (task.blocker && status !== "blocked")
      errors.push(`${id}: a task with an active blocker must be blocked`);
    if (!(task.risk in REQUIRED_TIERS)) {
      errors.push(`${id}: risk must be low, medium, or high`);
      continue;
    }
    if (!Array.isArray(task.dependencies))
      errors.push(`${id}: dependencies must be an array`);
    else {
      const missing = task.dependencies.filter((x: string) => !known.has(x));
      if (missing.length)
        errors.push(`${id}: unknown dependencies ${JSON.stringify(missing)}`);
      if (task.dependencies.includes(id))
        errors.push(`${id}: task cannot depend on itself`);
    }
    if (!Array.isArray(task.validation)) {
      errors.push(`${id}: validation must be an array`);
      continue;
    }
    const names = task.validation
      .filter((x: unknown) => x && typeof x === "object" && !Array.isArray(x))
      .map((x: Obj) => x.name);
    if (
      new Set(names).size !== names.length ||
      names.some((x: unknown) => typeof x !== "string" || !x)
    )
      errors.push(`${id}: validation names must be unique non-empty strings`);
    const tiers = new Set(
      task.validation
        .filter((x: unknown) => x && typeof x === "object")
        .map((x: Obj) => x.tier),
    );
    const missingTiers = [...REQUIRED_TIERS[task.risk]].filter(
      (x) => !tiers.has(x),
    );
    if (missingTiers.length)
      errors.push(
        `${id}: ${task.risk} risk requires validation tiers ${JSON.stringify(missingTiers.sort())}`,
      );
    task.validation.forEach((check: unknown, i: number) => {
      if (!check || typeof check !== "object" || Array.isArray(check))
        return errors.push(`${id}: validation[${i}] must be an object`);
      const c = check as Obj;
      if (!["command", "receipt"].includes(c.kind))
        errors.push(`${id}.validation[${i}].kind must be command or receipt`);
      if (typeof c.location !== "string" || !c.location)
        errors.push(
          `${id}.validation[${i}].location must be a non-empty string`,
        );
      if (c.kind === "command") {
        if (c.location !== "local")
          errors.push(`${id}.validation[${i}] command location must be local`);
        try {
          ensureArgv(c.argv, `${id}.validation[${i}].argv`);
        } catch (e: any) {
          errors.push(e.message);
        }
      } else if (c.kind === "receipt" && "argv" in c)
        errors.push(`${id}.validation[${i}] receipt must not declare argv`);
    });
  }
  if (active > 1) errors.push("only one task may be active");
  const visiting = new Set<string>(),
    visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) {
      errors.push(`task graph contains a cycle at ${id}`);
      return;
    }
    if (visited.has(id) || !mapping[id]) return;
    visiting.add(id);
    for (const dep of mapping[id].dependencies ?? []) visit(dep);
    visiting.delete(id);
    visited.add(id);
  };
  Object.keys(mapping).forEach(visit);
  return errors;
}

function reconcile(state: Obj): boolean {
  let changed = false;
  const mapping = taskMap(state);
  for (const task of state.tasks) {
    if (["done", "in_progress", "verified"].includes(task.status)) continue;
    if (task.blocker) {
      if (task.status !== "blocked") {
        task.status = "blocked";
        changed = true;
      }
      continue;
    }
    const desired = (task.dependencies ?? []).every(
      (id: string) => mapping[id].status === "done",
    )
      ? "ready"
      : "blocked";
    if (task.status !== desired) {
      task.status = desired;
      changed = true;
    }
  }
  return changed;
}
function graphConfig(capabilities: Obj): Obj {
  const graph = capabilities.graph;
  if (!graph || typeof graph !== "object" || graph.required !== true)
    throw new ContractError("required graph provider is not configured");
  return graph;
}
function graphStatus(root: string, capabilities: Obj): RunResult {
  const graph = graphConfig(capabilities);
  if (!setEqualArray(graph.status_argv, GITNEXUS_STATUS_ARGV))
    throw new ContractError(
      "required graph provider gitnexus has an invalid status command",
    );
  const result = runArgv(
    GITNEXUS_STATUS_ARGV,
    root,
    Number(graph.timeout_seconds ?? 900),
  );
  if (
    result.status ||
    !/^\s*Status:\s*(?:✅\s*)?up[- ]to[- ]date\s*$/im.test(result.stdout)
  )
    throw new ContractError(
      `required graph provider ${graph.provider} is unavailable or stale: ${outputTail(result.stderr || result.stdout)}`,
    );
  return result;
}

function commandNext(state: Obj, statePath: string): Obj {
  if (reconcile(state)) writeJsonAtomic(statePath, state);
  const task =
    state.tasks.find((x: Obj) =>
      ["in_progress", "verified"].includes(x.status),
    ) ?? state.tasks.find((x: Obj) => x.status === "ready");
  if (!task)
    throw new ContractError(
      "no ready task; resolve blockers or complete active work",
    );
  return task;
}
function commandStart(
  state: Obj,
  caps: Obj,
  statePath: string,
  root: string,
  id: string,
): Obj {
  const active = state.tasks.find((x: Obj) =>
    ["in_progress", "verified"].includes(x.status),
  );
  if (active) throw new ContractError(`task ${active.id} is already active`);
  reconcile(state);
  const task = getTask(state, id);
  if (task.status !== "ready")
    throw new ContractError(`task ${id} is not ready`);
  graphStatus(root, caps);
  task.status = "in_progress";
  task.started_at = nowUtc();
  writeJsonAtomic(statePath, state);
  return task;
}

function commandVerify(
  state: Obj,
  statePath: string,
  root: string,
  id: string,
): Obj[] {
  const task = getTask(state, id);
  if (task.status !== "in_progress")
    throw new ContractError(
      `task ${id} must be in_progress before verification`,
    );
  const required = REQUIRED_TIERS[task.risk],
    evidence: Obj[] = [];
  const current = sourceFingerprint(root);
  for (const check of task.validation) {
    if (!required.has(check.tier)) continue;
    if (check.kind === "receipt") {
      const receipt = (task.external_evidence ?? []).find(
        (x: Obj) => x.name === check.name && x.location === check.location,
      );
      if (!receipt)
        throw new ContractError(
          `${id}: receipt validation '${check.name}' is missing; use record-evidence before verify`,
        );
      if (receipt.source_fingerprint !== current)
        throw new ContractError(
          `${id}: receipt validation '${check.name}' is stale; record it again`,
        );
      evidence.push({ ...receipt });
      continue;
    }
    const argv = ensureArgv(
        check.argv,
        `${id}.${check.name ?? "validation"}.argv`,
      ),
      result = runArgv(argv, root, Number(check.timeout_seconds ?? 900)),
      resulting = sourceFingerprint(root);
    const receipt = {
      name: check.name,
      tier: check.tier,
      kind: "command",
      location: "local",
      argv,
      exit_code: result.status,
      verified_at: nowUtc(),
      source_fingerprint: resulting,
      stdout: outputTail(result.stdout),
      stderr: outputTail(result.stderr),
    };
    evidence.push(receipt);
    if (result.status) {
      task.evidence = evidence;
      task.status = "blocked";
      task.blocker = {
        reason: `validation failed: ${receipt.name}`,
        recorded_at: nowUtc(),
      };
      writeJsonAtomic(statePath, state);
      throw new VerificationFailed(
        `validation failed: ${receipt.name}`,
        receipt,
      );
    }
    if (resulting !== current) {
      (task.verification_history ??= []).push({
        status: "source_changed_during_validation",
        recorded_at: nowUtc(),
        check: receipt.name,
        before_source_fingerprint: current,
        after_source_fingerprint: resulting,
        evidence,
      });
      task.evidence = [];
      writeJsonAtomic(statePath, state);
      throw new ContractError(
        `task ${id} validation command '${receipt.name}' changed source; run verify again`,
      );
    }
  }
  task.evidence = evidence;
  task.status = "verified";
  task.verified_at = nowUtc();
  task.verified_source_fingerprint = current;
  delete task.review;
  writeJsonAtomic(statePath, state);
  return evidence;
}
function commandRecordEvidence(
  state: Obj,
  statePath: string,
  root: string,
  id: string,
  checkName: string,
  location: string,
  source: string,
  summary: string,
): Obj {
  const task = getTask(state, id);
  if (task.status !== "in_progress")
    throw new ContractError(
      `task ${id} must be in_progress before recording evidence`,
    );
  const check = task.validation.find(
    (x: Obj) => x.name === checkName && x.kind === "receipt",
  );
  if (!check)
    throw new ContractError(
      `task ${id} has no receipt validation named '${checkName}'`,
    );
  if (check.location !== location)
    throw new ContractError(
      `task ${id} receipt '${checkName}' requires location '${check.location}'`,
    );
  const receipt = {
    name: checkName,
    tier: check.tier,
    kind: "receipt",
    location,
    source,
    summary,
    recorded_at: nowUtc(),
    source_fingerprint: sourceFingerprint(root),
  };
  task.external_evidence = (task.external_evidence ?? []).filter(
    (x: Obj) => x.name !== checkName,
  );
  task.external_evidence.push(receipt);
  writeJsonAtomic(statePath, state);
  return receipt;
}
function commandGraphSync(
  state: Obj,
  caps: Obj,
  statePath: string,
  root: string,
  id: string,
): Obj {
  const task = getTask(state, id);
  if (task.status !== "verified")
    throw new ContractError(`task ${id} must be verified before graph-sync`);
  const verified = task.verified_source_fingerprint;
  if (typeof verified !== "string" || !verified)
    throw new ContractError(
      `task ${id} has no verified source fingerprint; verify it again`,
    );
  if (sourceFingerprint(root) !== verified)
    throw new ContractError(
      `task ${id} source changed after verification; verify it again before graph-sync`,
    );
  const graph = graphConfig(caps);
  if (!setEqualArray(graph.sync_argv, GITNEXUS_SYNC_ARGV))
    throw new ContractError(
      "required graph provider gitnexus has an invalid sync command",
    );
  const result = runArgv(
    GITNEXUS_SYNC_ARGV,
    root,
    Number(graph.timeout_seconds ?? 900),
  );
  if (result.status)
    throw new ContractError(
      `required graph provider ${graph.provider} failed to sync: ${outputTail(result.stderr || result.stdout)}`,
    );
  const status = graphStatus(root, caps);
  const evidence = {
    provider: graph.provider,
    status: "fresh",
    synced_at: nowUtc(),
    source_fingerprint: verified,
    sync_output: outputTail(result.stdout),
    status_output: outputTail(status.stdout),
  };
  task.graph_evidence = evidence;
  writeJsonAtomic(statePath, state);
  return evidence;
}
function commandComplete(
  state: Obj,
  caps: Obj,
  statePath: string,
  root: string,
  id: string,
): Obj {
  const task = getTask(state, id);
  if (task.status !== "verified")
    throw new ContractError(`task ${id} must be verified before completion`);
  if (task.risk === "high") {
    const review = task.review ?? {};
    if (review.status !== "passed" || !review.receipt)
      throw new ContractError(
        `task ${id} is high risk and requires a passed independent review receipt`,
      );
    if (review.source_fingerprint !== task.verified_source_fingerprint)
      throw new ContractError(
        `task ${id} independent review is not bound to the verified source`,
      );
  }
  const current = sourceFingerprint(root);
  if (task.verified_source_fingerprint !== current) {
    (task.verification_history ??= []).push({
      status: "invalidated",
      invalidated_at: nowUtc(),
      verified_source_fingerprint: task.verified_source_fingerprint,
      current_source_fingerprint: current,
      evidence: task.evidence ?? [],
    });
    task.status = "in_progress";
    task.evidence = [];
    delete task.verified_at;
    delete task.verified_source_fingerprint;
    writeJsonAtomic(statePath, state);
    throw new ContractError(
      `task ${id} source changed after verification; verify it again`,
    );
  }
  commandGraphSync(state, caps, statePath, root, id);
  task.status = "done";
  task.completed_at = nowUtc();
  reconcile(state);
  writeJsonAtomic(statePath, state);
  return task;
}
function commandReview(
  state: Obj,
  statePath: string,
  root: string,
  id: string,
  reviewer: string,
  status: string,
  summary: string,
  receipt: string,
): Obj {
  const task = getTask(state, id);
  if (task.status !== "verified")
    throw new ContractError(`task ${id} must be verified before review`);
  const fingerprint = sourceFingerprint(root);
  if (fingerprint !== task.verified_source_fingerprint)
    throw new ContractError(
      `task ${id} source changed after verification; verify it again before review`,
    );
  task.review = {
    status,
    reviewer,
    summary,
    receipt,
    source_fingerprint: fingerprint,
    reviewed_at: nowUtc(),
  };
  writeJsonAtomic(statePath, state);
  return task.review;
}
function commandBlock(
  state: Obj,
  statePath: string,
  id: string,
  reason: string,
): Obj {
  const task = getTask(state, id);
  if (task.status === "done")
    throw new ContractError(`task ${id} is done and cannot be blocked`);
  task.status = "blocked";
  task.blocker = { reason, recorded_at: nowUtc() };
  writeJsonAtomic(statePath, state);
  return task;
}
function commandUnblock(
  state: Obj,
  statePath: string,
  id: string,
  resolution: string,
): Obj {
  const task = getTask(state, id),
    blocker = task.blocker;
  if (task.status !== "blocked" || !blocker)
    throw new ContractError(
      `task ${id} does not have an active explicit blocker`,
    );
  (task.blocker_history ??= []).push({
    ...blocker,
    resolution,
    resolved_at: nowUtc(),
  });
  delete task.blocker;
  reconcile(state);
  writeJsonAtomic(statePath, state);
  return task;
}

const V2_STATUSES = new Set([
  "blocked",
  "ready",
  "in_progress",
  "verified",
  "integrated",
  "published",
  "done",
]);
const V2_ROOT_KEYS = new Set([
  "schema_version",
  "mode",
  "capabilities_file",
  "source_manifest_file",
  "requirements_file",
  "grommet_file",
  "automation_authority",
  "tasks",
  "extensions",
]);
const V2_TASK_KEYS = new Set([
  "id",
  "title",
  "status",
  "dependencies",
  "risk",
  "risk_assessment",
  "source_changes",
  "requirement_ids",
  "context_files",
  "validation",
  "evidence",
  "model_route",
  "context_packet",
  "baseline_commit",
  "workspace",
  "operation_phase",
  "evidence_refs",
  "publication",
  "review",
  "blocker",
  "external_evidence",
  "verification_history",
  "started_at",
  "verified_at",
  "integrated_at",
  "published_at",
  "completed_at",
  "verified_commit",
  "integration_commit",
  "extensions",
]);

function stableJson(value: any): string {
  if (value === null || typeof value === "boolean") return String(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new ContractError(
        "canonical JSON cannot encode a non-finite number",
      );
    return JSON.stringify(value);
  }
  if (typeof value === "string") return asciiStringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (typeof value === "object") {
    return `{${Object.keys(value)
      .sort(compareUnicodeCodePoints)
      .map((key) => `${asciiStringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  throw new ContractError(`canonical JSON cannot encode ${typeof value}`);
}
function compareUnicodeCodePoints(left: string, right: string): number {
  const a = Array.from(left, (char) => char.codePointAt(0)!);
  const b = Array.from(right, (char) => char.codePointAt(0)!);
  for (let index = 0; index < Math.min(a.length, b.length); index++) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return a.length - b.length;
}
function digestValue(value: any): string {
  return sha256(stableJson(value));
}
function normalizedSection(path: string, locator: Obj): string {
  const start = locator.start_line,
    end = locator.end_line;
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 1 ||
    end < start
  )
    throw new ContractError(`invalid source section locator for ${path}`);
  const lines = decodeUtf8(readFileSync(path), path).split(/\r\n|[\n\r]/);
  if (lines.at(-1) === "") lines.pop();
  if (end > lines.length)
    throw new ContractError(
      `source section locator exceeds file length: ${path}`,
    );
  return (
    lines
      .slice(start - 1, end)
      .map((line) => line.replace(/\s+$/u, ""))
      .join("\n")
      .trim() + "\n"
  );
}
function v2ContractPaths(root: string, state: Obj): Record<string, string> {
  const defaults: Record<string, string> = {
    source_manifest_file: "build-pack/source-manifest.json",
    requirements_file: "build-pack/requirements.json",
    grommet_file: "build-pack/grommet-approval.json",
  };
  const paths: Record<string, string> = {};
  for (const [field, fallback] of Object.entries(defaults)) {
    const raw = state[field] ?? fallback;
    if (typeof raw !== "string" || !raw)
      throw new ContractError(`${field} must be a repository-relative path`);
    paths[field] = requireInside(
      root,
      resolve(root, raw),
      `${field} must resolve inside the repository`,
    );
  }
  return paths;
}
function v2RawContracts(root: string, state: Obj): [Obj, Obj, Obj] {
  const paths = v2ContractPaths(root, state);
  return [
    readJson(paths.source_manifest_file),
    readJson(paths.requirements_file),
    readJson(paths.grommet_file),
  ];
}
function v2Digest(
  root: string,
  state: Obj,
  manifest: Obj,
  requirements: Obj,
): string {
  const taskPlan = (state.tasks ?? [])
    .filter(
      (task: unknown) =>
        task && typeof task === "object" && !Array.isArray(task),
    )
    .map((task: Obj) =>
      Object.fromEntries(
        [
          "id",
          "title",
          "dependencies",
          "requirement_ids",
          "risk",
          "publication",
        ].map((key) => [key, task[key] ?? null]),
      ),
    );
  return digestValue({ manifest, requirements, task_plan: taskPlan });
}
function appendJournal(
  root: string,
  operation: string,
  phase: string,
  details: Obj,
): void {
  const journal = join(root, "build-pack", JOURNAL_NAME);
  mkdirSync(dirname(journal), { recursive: true });
  const entry = { operation, phase, recorded_at: nowUtc(), details };
  const fd = openSync(journal, "a");
  try {
    writeSync(fd, stableJson(entry) + "\n");
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}
function writeReceipt(
  root: string,
  taskId: string,
  operation: string,
  payload: Obj,
): string {
  const path = join(
    root,
    "build-pack",
    "evidence",
    taskId,
    `${operation}.json`,
  );
  if (existsSync(path))
    throw new ContractError(
      `immutable evidence receipt already exists: ${path}`,
    );
  writeJsonAtomic(path, payload);
  return relative(root, path).replace(/\\/g, "/");
}

function ensureV2Fields(
  state: Obj,
  capabilities: Obj,
  root: string,
): [Obj, Obj, Obj] {
  if (state.schema_version !== 2 || capabilities.schema_version !== 2)
    throw new ContractError(
      "v2 commands require schema_version 2 state and capabilities",
    );
  const unknown = Object.keys(state).filter((key) => !V2_ROOT_KEYS.has(key));
  if (unknown.length)
    throw new ContractError(
      `execution-state has unknown core fields: ${JSON.stringify(unknown.sort())}`,
    );
  if (
    "extensions" in state &&
    (!state.extensions ||
      typeof state.extensions !== "object" ||
      Array.isArray(state.extensions))
  )
    throw new ContractError("execution-state.extensions must be an object");
  const [manifest, requirements, grommet] = v2RawContracts(root, state);
  if (
    manifest.schema_version !== 1 ||
    requirements.schema_version !== 1 ||
    grommet.schema_version !== 1
  )
    throw new ContractError(
      "source manifest, requirements map, and Grommet approval must use schema_version 1",
    );
  if (grommet.status !== "approved")
    throw new ContractError("Grommet approval is required before execution");
  if (
    grommet.candidate_digest !== v2Digest(root, state, manifest, requirements)
  )
    throw new ContractError(
      "Grommet approval digest does not match the current build pack; reseal and reapprove it",
    );
  const sources = new Map<string, string>();
  for (const source of manifest.sources ?? []) {
    if (
      !source ||
      typeof source !== "object" ||
      Array.isArray(source) ||
      source.authority !== "approved"
    )
      throw new ContractError(
        "each source manifest entry must be an approved object",
      );
    const sourceId = source.id,
      rel = source.path;
    if (typeof sourceId !== "string" || typeof rel !== "string")
      throw new ContractError("source manifest entries require id and path");
    const path = requireInside(
      root,
      resolve(root, rel),
      "source manifest path must stay inside the repository",
    );
    if (
      !existsSync(path) ||
      !statSync(path).isFile() ||
      path.split(/[\\/]/).includes(".gitnexus")
    )
      throw new ContractError(`invalid product authority source: ${rel}`);
    for (const section of source.sections ?? []) {
      if (
        !section ||
        typeof section !== "object" ||
        typeof section.id !== "string"
      )
        throw new ContractError("source sections require an id");
      const actual = sha256(normalizedSection(path, section.locator ?? {}));
      if (section.hash !== actual)
        throw new ContractError(
          `source section changed: ${sourceId}/${section.id}`,
        );
      sources.set(`${sourceId}\0${section.id}`, actual);
    }
  }
  const requirementIds = new Set<string>();
  for (const requirement of requirements.requirements ?? []) {
    if (
      !requirement ||
      typeof requirement !== "object" ||
      typeof requirement.id !== "string"
    )
      throw new ContractError("requirements must have permanent ids");
    requirementIds.add(requirement.id);
    const refs = requirement.sources;
    if (!Array.isArray(refs) || !refs.length)
      throw new ContractError(
        `requirement ${requirement.id} has no source references`,
      );
    for (const ref of refs)
      if (
        !ref ||
        typeof ref !== "object" ||
        !sources.has(`${ref.source_id}\0${ref.section_id}`)
      )
        throw new ContractError(
          `requirement ${requirement.id} has an unknown source section`,
        );
  }
  const graph = capabilities.graph ?? {};
  if (graph.provider !== "gitnexus" || graph.version !== GITNEXUS_VERSION)
    throw new ContractError(
      `GitNexus version must be pinned to ${GITNEXUS_VERSION}`,
    );
  if (graph.license?.eligible !== true)
    throw new ContractError(
      "GitNexus license eligibility must be explicitly confirmed",
    );
  for (const task of state.tasks ?? []) {
    if (!task || typeof task !== "object" || Array.isArray(task))
      throw new ContractError("tasks must be objects");
    const unknownTask = Object.keys(task).filter(
      (key) => !V2_TASK_KEYS.has(key),
    );
    if (unknownTask.length)
      throw new ContractError(
        `task ${task.id ?? "<unknown>"} has unknown core fields: ${JSON.stringify(unknownTask.sort())}`,
      );
    if (!V2_STATUSES.has(task.status))
      throw new ContractError(
        `task ${task.id ?? "<unknown>"} has invalid status`,
      );
    const refs = task.requirement_ids;
    if (
      !Array.isArray(refs) ||
      !refs.length ||
      refs.some((x: unknown) => !requirementIds.has(x as string))
    )
      throw new ContractError(
        `task ${task.id ?? "<unknown>"} must reference mapped requirements`,
      );
    const score = task.risk_assessment ?? {},
      factors = [
        "blast_radius",
        "reversibility",
        "authority",
        "sensitive_data",
        "external_impact",
      ];
    if (
      factors.some(
        (name) =>
          !Number.isInteger(score[name]) || ![0, 1, 2].includes(score[name]),
      )
    )
      throw new ContractError(
        `task ${task.id ?? "<unknown>"} has invalid measured-risk factors`,
      );
    const total = factors.reduce((sum, name) => sum + score[name], 0);
    let expected = total <= 2 ? "low" : total <= 5 ? "medium" : "high";
    const publication = task.publication;
    if (publication || score.authority === 2 || score.sensitive_data === 2)
      expected = "high";
    if (task.risk !== expected)
      throw new ContractError(
        `task ${task.id ?? "<unknown>"} risk does not match its measured assessment`,
      );
    const checks = task.validation;
    if (!Array.isArray(checks) || !checks.length)
      throw new ContractError(
        `task ${task.id ?? "<unknown>"} must declare validation`,
      );
    const tiers = new Set(
      checks.filter((x) => x && typeof x === "object").map((x) => x.tier),
    );
    if ([...REQUIRED_TIERS[task.risk]].some((t) => !tiers.has(t)))
      throw new ContractError(
        `task ${task.id ?? "<unknown>"} lacks validation for its risk tier`,
      );
    const packet = task.context_packet ?? {};
    if (
      !packet ||
      typeof packet !== "object" ||
      !Number.isInteger(packet.window_tokens) ||
      !Number.isInteger(packet.initial_tokens)
    )
      throw new ContractError(
        `task ${task.id ?? "<unknown>"} must declare its context packet`,
      );
    if (packet.initial_tokens > packet.window_tokens * 0.4)
      throw new ContractError(
        `task ${task.id ?? "<unknown>"} initial context exceeds 40 percent of its model window`,
      );
    if (publication) {
      const authority = state.automation_authority?.publication ?? {},
        required = [
          "destination",
          "artifact",
          "idempotency_key",
          "credential_refs",
          "attempts",
        ];
      if (
        !publication ||
        typeof publication !== "object" ||
        required.some((key) => !(key in publication))
      )
        throw new ContractError(
          `task ${task.id ?? "<unknown>"} publication contract is incomplete`,
        );
      if (
        authority.enabled !== true ||
        !(authority.destinations ?? []).includes(publication.destination)
      )
        throw new ContractError(
          `task ${task.id ?? "<unknown>"} publication destination is not authorized`,
        );
      const prefixes = authority.command_prefixes;
      if (!Array.isArray(prefixes) || !prefixes.length)
        throw new ContractError(
          "publication authority must declare allowed command prefixes",
        );
      for (const attempt of publication.attempts) {
        const argv =
          attempt && typeof attempt === "object"
            ? attempt.publish_argv
            : undefined;
        if (
          !Array.isArray(argv) ||
          !prefixes.some(
            (prefix: unknown) =>
              Array.isArray(prefix) && prefix.every((x, i) => argv[i] === x),
          )
        )
          throw new ContractError(
            `task ${task.id ?? "<unknown>"} publication command is outside approved prefixes`,
          );
      }
    }
  }
  return [manifest, requirements, grommet];
}

function v2WorkspaceRoot(root: string): string {
  return join(dirname(root), ".globalsetup-worktrees", basename(root));
}
function runGit(argv: string[], cwd: string): string {
  const result = runArgv(["git", ...argv], cwd, 120);
  if (result.status)
    throw new ContractError(outputTail(result.stderr || result.stdout));
  return result.stdout.trim();
}
function v2EnsureIntegration(root: string, capabilities: Obj): string {
  const workspaceRoot = v2WorkspaceRoot(root),
    integration = join(workspaceRoot, "integration");
  if (existsSync(integration)) return integration;
  mkdirSync(workspaceRoot, { recursive: true });
  const base = runGit(["rev-parse", "HEAD"], root),
    branch =
      capabilities.workspace?.integration_branch ?? "globalsetup/integration";
  runGit(["worktree", "add", "-b", branch, integration, base], root);
  return integration;
}
function v2Start(
  state: Obj,
  caps: Obj,
  root: string,
  statePath: string,
  id: string,
): Obj {
  const active = state.tasks.find((x: Obj) =>
    ["in_progress", "verified", "integrated"].includes(x.status),
  );
  if (active) throw new ContractError(`task ${active.id} is already active`);
  const task = getTask(state, id);
  if (task.status !== "ready")
    throw new ContractError(`task ${id} is not ready`);
  graphStatus(root, caps);
  const integration = v2EnsureIntegration(root, caps),
    base = runGit(["rev-parse", "HEAD"], integration),
    path = join(v2WorkspaceRoot(root), id);
  if (existsSync(path))
    throw new ContractError(`managed task worktree already exists: ${path}`);
  const branch = `globalsetup/task-${id.toLowerCase()}`;
  runGit(["worktree", "add", "-b", branch, path, base], root);
  const operation = randomBytes(12).toString("hex");
  appendJournal(root, operation, "prepared", {
    command: "start",
    task_id: id,
    baseline: base,
  });
  Object.assign(task, {
    status: "in_progress",
    started_at: nowUtc(),
    baseline_commit: base,
    workspace: { path, branch },
    operation_phase: "executed",
  });
  appendJournal(root, operation, "executed", { workspace: path });
  writeJsonAtomic(statePath, state);
  appendJournal(root, operation, "committed", { state: "in_progress" });
  return task;
}
function v2Verify(
  state: Obj,
  root: string,
  statePath: string,
  id: string,
): Obj[] {
  const task = getTask(state, id);
  if (task.status !== "in_progress")
    throw new ContractError(
      `task ${id} must be in_progress before verification`,
    );
  const workspace = String(task.workspace?.path ?? root);
  if (!existsSync(workspace) || !statSync(workspace).isDirectory())
    throw new ContractError(`task ${id} worktree is unavailable`);
  const evidence: Obj[] = [],
    operation = randomBytes(12).toString("hex");
  appendJournal(root, operation, "prepared", {
    command: "verify",
    task_id: id,
  });
  for (const check of task.validation ?? []) {
    if (check.kind !== "command") continue;
    const argv = ensureArgv(check.argv, `${id} validation`),
      result = runArgv(argv, workspace, Number(check.timeout_seconds ?? 900));
    const receipt = {
      name: check.name,
      kind: "command",
      exit_code: result.status,
      verified_at: nowUtc(),
      stdout: outputTail(result.stdout),
      stderr: outputTail(result.stderr),
    };
    evidence.push(receipt);
    if (result.status) {
      Object.assign(task, {
        status: "blocked",
        blocker: {
          reason: `validation failed: ${check.name}`,
          recorded_at: nowUtc(),
        },
        evidence,
        operation_phase: "verified",
      });
      writeJsonAtomic(statePath, state);
      appendJournal(root, operation, "verified", {
        result: "failed",
        check: check.name,
      });
      throw new VerificationFailed(`validation failed: ${check.name}`, receipt);
    }
  }
  const head = runGit(["rev-parse", "HEAD"], workspace);
  if (head === task.baseline_commit && task.source_changes)
    throw new ContractError(
      `task ${id} has no committed change in its worktree`,
    );
  if (runGit(["status", "--porcelain"], workspace))
    throw new ContractError(
      `task ${id} worktree is dirty; commit or discard task-owned changes before verification`,
    );
  const ref = writeReceipt(root, id, operation, {
    task_id: id,
    commit: head,
    evidence,
  });
  Object.assign(task, {
    status: "verified",
    verified_at: nowUtc(),
    evidence,
    evidence_refs: [ref],
    operation_phase: "verified",
    verified_commit: head,
  });
  writeJsonAtomic(statePath, state);
  appendJournal(root, operation, "committed", { receipt: ref });
  return evidence;
}
function v2Integrate(
  state: Obj,
  caps: Obj,
  root: string,
  statePath: string,
  id: string,
): Obj {
  const task = getTask(state, id);
  if (task.status !== "verified")
    throw new ContractError(`task ${id} must be verified before integration`);
  if (task.risk === "high" && task.review?.status !== "passed")
    throw new ContractError(
      `task ${id} is high risk and requires a passed independent review before integration`,
    );
  const integration = v2EnsureIntegration(root, caps);
  if (runGit(["status", "--porcelain"], integration))
    throw new ContractError("managed integration worktree is dirty");
  const operation = randomBytes(12).toString("hex");
  appendJournal(root, operation, "prepared", {
    command: "integrate",
    task_id: id,
  });
  runGit(["merge", "--no-ff", "--no-edit", task.workspace.branch], integration);
  const graph = caps.graph,
    result = runArgv(
      ensureArgv(graph.sync_argv, "graph.sync_argv"),
      integration,
      Number(graph.timeout_seconds ?? 900),
    );
  if (result.status)
    throw new ContractError(
      `GitNexus sync failed after integration: ${outputTail(result.stderr || result.stdout)}`,
    );
  Object.assign(task, {
    status: "integrated",
    integrated_at: nowUtc(),
    integration_commit: runGit(["rev-parse", "HEAD"], integration),
    operation_phase: "verified",
  });
  writeJsonAtomic(statePath, state);
  appendJournal(root, operation, "committed", {
    integration_commit: task.integration_commit,
  });
  return task;
}
function v2Publish(
  state: Obj,
  root: string,
  statePath: string,
  id: string,
): Obj {
  const task = getTask(state, id);
  if (
    task.status !== "integrated" ||
    !task.publication ||
    typeof task.publication !== "object"
  )
    throw new ContractError(
      `task ${id} must be an integrated publication task`,
    );
  const publication = task.publication,
    attempts = publication.attempts;
  if (
    !Array.isArray(attempts) ||
    attempts.length < 1 ||
    attempts.length > 3 ||
    new Set(
      attempts.filter((x) => x && typeof x === "object").map((x) => x.strategy),
    ).size !== attempts.length
  )
    throw new ContractError(
      "publication must declare one to three materially distinct attempts",
    );
  const workspace = v2EnsureIntegration(root, { workspace: {} }),
    operation = randomBytes(12).toString("hex"),
    records: Obj[] = [];
  appendJournal(root, operation, "prepared", {
    command: "publish",
    task_id: id,
    idempotency_key: publication.idempotency_key,
  });
  for (const attempt of attempts) {
    const publish = runArgv(
        ensureArgv(attempt.publish_argv, "publication publish_argv"),
        workspace,
      ),
      health = runArgv(
        ensureArgv(attempt.health_argv, "publication health_argv"),
        workspace,
      ),
      record = {
        strategy: attempt.strategy,
        publish_exit_code: publish.status,
        health_exit_code: health.status,
      };
    records.push(record);
    if (!publish.status && !health.status) {
      const ref = writeReceipt(root, id, operation, {
        publication,
        attempts: records,
        status: "published",
      });
      Object.assign(task, {
        status: "published",
        published_at: nowUtc(),
        evidence_refs: [...(task.evidence_refs ?? []), ref],
        operation_phase: "verified",
      });
      writeJsonAtomic(statePath, state);
      appendJournal(root, operation, "committed", { receipt: ref });
      return { status: "published", attempts: records };
    }
    if (attempt.rollback_argv)
      runArgv(
        ensureArgv(attempt.rollback_argv, "publication rollback_argv"),
        workspace,
      );
  }
  if (publication.preview_argv)
    runArgv(
      ensureArgv(publication.preview_argv, "publication preview_argv"),
      workspace,
    );
  Object.assign(task, {
    status: "blocked",
    blocker: {
      reason: "three publication attempts did not pass health checks",
      recorded_at: nowUtc(),
    },
    operation_phase: "verified",
  });
  writeJsonAtomic(statePath, state);
  appendJournal(root, operation, "verified", {
    status: "preview_or_blocked",
    attempts: records,
  });
  throw new ContractError(
    "publication did not produce a healthy production release",
  );
}
function v2Review(
  state: Obj,
  root: string,
  statePath: string,
  id: string,
  reviewer: string,
  status: string,
  summary: string,
  receipt: string,
): Obj {
  const task = getTask(state, id);
  if (task.status !== "verified")
    throw new ContractError(`task ${id} must be verified before review`);
  const review = {
    reviewer,
    status,
    summary,
    receipt,
    commit: task.verified_commit,
    reviewed_at: nowUtc(),
  };
  task.review = review;
  writeJsonAtomic(statePath, state);
  appendJournal(root, randomBytes(12).toString("hex"), "committed", {
    command: "review",
    task_id: id,
    status,
  });
  return review;
}
function v2Reconcile(state: Obj): void {
  const mapping = taskMap(state);
  for (const task of state.tasks) {
    if (
      ["done", "in_progress", "verified", "integrated", "published"].includes(
        task.status,
      ) ||
      task.blocker
    )
      continue;
    task.status = (task.dependencies ?? []).every(
      (id: string) => mapping[id].status === "done",
    )
      ? "ready"
      : "blocked";
  }
}
function v2Impact(state: Obj, root: string, statePath: string): Obj {
  const [manifest, requirements] = v2RawContracts(root, state),
    changedSections = new Set<string>();
  for (const source of manifest.sources ?? []) {
    if (!source || typeof source !== "object") continue;
    const path = join(root, String(source.path ?? ""));
    for (const section of source.sections ?? []) {
      if (
        !section ||
        typeof section !== "object" ||
        !existsSync(path) ||
        !statSync(path).isFile()
      )
        continue;
      if (
        sha256(normalizedSection(path, section.locator ?? {})) !== section.hash
      )
        changedSections.add(`${source.id}\0${section.id}`);
    }
  }
  const changedRequirements = new Set<string>(
    (requirements.requirements ?? [])
      .filter(
        (item: Obj) =>
          item &&
          typeof item === "object" &&
          (item.sources ?? []).some(
            (ref: Obj) =>
              ref &&
              typeof ref === "object" &&
              changedSections.has(`${ref.source_id}\0${ref.section_id}`),
          ),
      )
      .map((item: Obj) => item.id),
  );
  const reqDeps = new Map<string, Set<string>>(
    (requirements.requirements ?? [])
      .filter((x: Obj) => x && typeof x.id === "string")
      .map((x: Obj) => [x.id, new Set(x.dependencies ?? [])]),
  );
  let changed = true;
  while (changed) {
    changed = false;
    for (const [id, deps] of reqDeps)
      if (
        !changedRequirements.has(id) &&
        [...deps].some((x) => changedRequirements.has(x))
      ) {
        changedRequirements.add(id);
        changed = true;
      }
  }
  const changedTasks = new Set<string>(
      (state.tasks ?? [])
        .filter(
          (task: Obj) =>
            task &&
            typeof task === "object" &&
            (task.requirement_ids ?? []).some((id: string) =>
              changedRequirements.has(id),
            ),
        )
        .map((task: Obj) => task.id),
    ),
    taskDeps = new Map<string, Set<string>>(
      (state.tasks ?? [])
        .filter((x: Obj) => x && typeof x.id === "string")
        .map((x: Obj) => [x.id, new Set(x.dependencies ?? [])]),
    );
  changed = true;
  while (changed) {
    changed = false;
    for (const [id, deps] of taskDeps)
      if (!changedTasks.has(id) && [...deps].some((x) => changedTasks.has(x))) {
        changedTasks.add(id);
        changed = true;
      }
  }
  for (const task of state.tasks ?? [])
    if (changedTasks.has(task.id) && task.status !== "done") {
      task.status = "blocked";
      task.blocker = {
        reason:
          "approved source section changed; reseal and reapprove the affected plan",
        recorded_at: nowUtc(),
      };
    }
  if (changedTasks.size) writeJsonAtomic(statePath, state);
  const result = {
    changed_requirements: [...changedRequirements].sort(),
    changed_tasks: [...changedTasks].sort(),
    source_manifest_digest: digestValue(manifest),
    requirements_digest: digestValue(requirements),
  };
  appendJournal(root, randomBytes(12).toString("hex"), "committed", {
    command: "impact",
    ...result,
  });
  return result;
}

function commandMigrate(root: string, statePath: string, apply: boolean): Obj {
  const state = readJson(statePath);
  if (state.schema_version === 2) return { status: "already_v2" };
  if (state.schema_version !== 1)
    throw new ContractError(
      "only schema_version 1 execution state can be migrated",
    );
  const capabilitiesPath = join(
    root,
    state.capabilities_file ?? "build-pack/capabilities.json",
  );
  const capabilities = readJson(capabilitiesPath);
  const sources = state.source_authority.approved_sources.map(
    (rel: string, index: number) => {
      const path = resolve(root, rel);
      const lines = readFileSync(path, "utf8").split(/\r?\n/);
      if (lines.at(-1) === "") lines.pop();
      const end = Math.max(1, lines.length);
      const locator = { start_line: 1, end_line: end };
      return {
        id: `SRC-${String(index + 1).padStart(3, "0")}`,
        path: rel,
        authority: "approved",
        currentness: "current",
        sections: [
          {
            id: "whole-document",
            locator,
            hash: sha256(normalizedSection(path, locator)),
          },
        ],
      };
    },
  );
  const manifest = { schema_version: 1, sources };
  const requirements = {
    schema_version: 1,
    requirements: state.tasks.map((task: Obj) => ({
      id: `R-${task.id}`,
      summary: task.title,
      sources: sources.map((source: Obj) => ({
        source_id: source.id,
        section_id: "whole-document",
      })),
      acceptance_criteria: task.validation.map((check: Obj) => check.name),
      tests: task.validation.map((check: Obj) => check.name),
      tasks: [task.id],
      dependencies: [],
    })),
  };
  const migrated: Obj = Object.fromEntries(
    Object.entries(state).filter(([key]) =>
      ["mode", "capabilities_file", "automation_authority", "tasks"].includes(
        key,
      ),
    ),
  );
  Object.assign(migrated, {
    schema_version: 2,
    source_manifest_file: "build-pack/source-manifest.json",
    requirements_file: "build-pack/requirements.json",
    grommet_file: "build-pack/grommet-approval.json",
  });
  for (const task of migrated.tasks) {
    const legacyRisk = task.risk;
    task.requirement_ids = [`R-${task.id}`];
    delete task.requirement_sources;
    const scores: Record<string, Obj> = {
      low: {
        blast_radius: 0,
        reversibility: 0,
        authority: 0,
        sensitive_data: 0,
        external_impact: 0,
      },
      medium: {
        blast_radius: 1,
        reversibility: 1,
        authority: 1,
        sensitive_data: 0,
        external_impact: 0,
      },
      high: {
        blast_radius: 2,
        reversibility: 1,
        authority: 1,
        sensitive_data: 0,
        external_impact: 2,
      },
    };
    task.risk_assessment = { ...(scores[legacyRisk] ?? scores.high) };
    if (task.publication) {
      task.risk_assessment.authority = 2;
      task.risk_assessment.external_impact = 2;
    }
    task.risk = task.publication ? "high" : legacyRisk;
    task.model_route = {
      worker: "standard",
      verifier: "premium",
      escalation: "operator",
    };
    task.context_packet = {
      window_tokens: 32000,
      initial_tokens: 12000,
      retrieval: "targeted",
    };
    task.evidence_refs = [];
    task.operation_phase = "prepared";
  }
  const migratedCaps: Obj = { ...capabilities, schema_version: 2 },
    graph = {
      ...(migratedCaps.graph ?? {}),
      version: GITNEXUS_VERSION,
      repository_alias: basename(root),
      branch: "globalsetup/integration",
      license: { spdx: "PolyForm-Noncommercial-1.0.0", eligible: true },
      sync_argv: [
        "gitnexus",
        "analyze",
        "--index-only",
        "--skip-agents-md",
        "--skip-skills",
        "--name",
        basename(root),
        "--branch",
        "globalsetup/integration",
      ],
    };
  delete migratedCaps.python;
  migratedCaps.node ??= { required: true, minimum_version: "22.20" };
  migratedCaps.graph = graph;
  migratedCaps.workspace = {
    integration_branch: "globalsetup/integration",
    serial: true,
  };
  const grommet = {
    schema_version: 1,
    status: "pending",
    operator: "",
    approved_at: "",
    contradictions: state.source_authority.contradictions ?? [],
    candidate_digest: v2Digest(root, migrated, manifest, requirements),
  };
  const result: Obj = {
    status: "dry_run",
    candidate_digest: grommet.candidate_digest,
    files: [
      statePath,
      capabilitiesPath,
      "build-pack/source-manifest.json",
      "build-pack/requirements.json",
      "build-pack/grommet-approval.json",
    ],
  };
  if (!apply) return result;
  const backup = statePath.replace(/\.json$/, ".json.v1.bak");
  if (existsSync(backup))
    throw new ContractError(`migration backup already exists: ${backup}`);
  copyFileSync(statePath, backup);
  writeJsonAtomic(join(root, "build-pack", "source-manifest.json"), manifest);
  writeJsonAtomic(join(root, "build-pack", "requirements.json"), requirements);
  writeJsonAtomic(join(root, "build-pack", "grommet-approval.json"), grommet);
  writeJsonAtomic(capabilitiesPath, migratedCaps);
  writeJsonAtomic(statePath, migrated);
  appendJournal(root, randomBytes(12).toString("hex"), "committed", {
    command: "migrate",
    backup,
  });
  result.status = "migrated_pending_grommet_approval";
  return result;
}

type ParsedArgs = {
  root: string;
  command: string;
  task_id?: string;
  apply?: boolean;
  [key: string]: unknown;
};
const COMMANDS = new Set([
  "validate",
  "next",
  "status",
  "start",
  "verify",
  "complete",
  "graph-sync",
  "block",
  "unblock",
  "record-evidence",
  "review",
  "migrate",
  "seal-plan",
  "impact",
  "recover",
  "integrate",
  "publish",
  "release-check",
]);
const TASK_COMMANDS = new Set([
  "start",
  "verify",
  "complete",
  "graph-sync",
  "block",
  "unblock",
  "record-evidence",
  "review",
  "integrate",
  "publish",
]);
function usage(): string {
  return "usage: build-runner.mts [--root PATH] {validate,next,status,start,verify,complete,graph-sync,block,unblock,record-evidence,review,migrate,seal-plan,impact,recover,integrate,publish,release-check} ...";
}
const COMMAND_HELP: Record<string, string> = {
  validate: "Validate task state, context paths, tools, and evidence contracts",
  next: "Return the active or next dependency-ready task and its context files",
  status: "Return the complete durable execution state",
  start: "Claim one ready task after the GitNexus preflight",
  verify: "Run required local commands and consume recorded external receipts",
  complete: "Refresh GitNexus and complete a verified task",
  "graph-sync": "Refresh GitNexus for a verified task without completing it",
  block: "Record a genuine task blocker",
  unblock: "Resolve a recorded task blocker",
  "record-evidence":
    "Record a hosted or external verification receipt before verify",
  review: "Record source-bound independent review evidence",
  migrate: "Create a reversible schema v2 build-pack migration",
  "seal-plan": "Return the current source-to-build digest for Grommet approval",
  impact: "Record source-contract impact for the current build pack",
  recover: "Inspect durable journal state and report incomplete operations",
  integrate:
    "Merge a verified task worktree into the managed integration worktree",
  publish: "Run the approved autonomous publication contract",
  "release-check":
    "Confirm every approved task has integrated, reviewed release evidence",
};
const COMMAND_OPTIONS: Record<string, Record<string, string>> = {
  block: { reason: "Precise blocking condition" },
  unblock: { resolution: "Evidence that resolved the blocker" },
  "record-evidence": {
    check: "Receipt validation name from execution state",
    location: "Declared runtime or hosted location",
    source: "Durable URL or external receipt identifier",
    summary: "Observed result",
  },
  review: {
    reviewer: "Independent reviewer identity",
    status: "Review outcome: passed or failed",
    summary: "Findings or no-blocker conclusion",
    receipt: "Durable review task, thread, or artifact identifier",
  },
  migrate: { apply: "Write the migration after reviewing the dry-run result" },
};
function helpFor(command?: string): string {
  if (!command) return usage();
  const positional = TASK_COMMANDS.has(command) ? " TASK_ID" : "";
  const options = Object.entries(COMMAND_OPTIONS[command] ?? {}).map(
    ([name, description]) =>
      `  --${name.replace(/_/g, "-")}${name === "apply" ? "" : " VALUE"}\t${description}`,
  );
  return [
    `usage: build-runner.mts ${command}${positional}${options.length ? " [options]" : ""}`,
    "",
    COMMAND_HELP[command],
    ...(options.length ? ["", "options:", ...options] : []),
  ].join("\n");
}
function parseArgs(argv: string[]): ParsedArgs {
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(
      helpFor(argv.find((item) => COMMANDS.has(item))) + "\n",
    );
    process.exit(0);
  }
  let root = ".",
    index = 0;
  if (argv[index] === "--root" || argv[index]?.startsWith("--root=")) {
    const inline = argv[index].slice("--root=".length);
    if (argv[index] === "--root") {
      if (!argv[index + 1]) throw new ContractError("--root requires a value");
      root = argv[index + 1];
      index += 2;
    } else {
      if (!inline) throw new ContractError("--root requires a value");
      root = inline;
      index++;
    }
  }
  const command = argv[index++];
  if (!command || !COMMANDS.has(command)) throw new ContractError(usage());
  const args: ParsedArgs = { root, command };
  if (TASK_COMMANDS.has(command)) {
    if (!argv[index] || argv[index].startsWith("-"))
      throw new ContractError(`${command} requires task_id`);
    args.task_id = argv[index++];
  }
  const required: Record<string, string[]> = {
    block: ["reason"],
    unblock: ["resolution"],
    "record-evidence": ["check", "location", "source", "summary"],
    review: ["reviewer", "status", "summary", "receipt"],
  };
  while (index < argv.length) {
    const option = argv[index++];
    if (command === "migrate" && option === "--apply") {
      args.apply = true;
      continue;
    }
    if (!option.startsWith("--"))
      throw new ContractError(`unexpected argument: ${option}`);
    const equals = option.indexOf("=");
    const optionName = (
      equals === -1 ? option.slice(2) : option.slice(2, equals)
    ).replace(/-/g, "_");
    if (
      !(optionName in (COMMAND_OPTIONS[command] ?? {})) ||
      optionName === "apply"
    )
      throw new ContractError(
        `unrecognized argument: --${optionName.replace(/_/g, "-")}`,
      );
    const value = equals === -1 ? argv[index++] : option.slice(equals + 1);
    if (value === undefined || value === "")
      throw new ContractError(
        `--${optionName.replace(/_/g, "-")} requires a value`,
      );
    args[optionName] = value;
  }
  for (const key of required[command] ?? [])
    if (typeof args[key] !== "string" || !args[key])
      throw new ContractError(
        `${command} requires --${key.replace(/_/g, "-")}`,
      );
  if (
    command === "review" &&
    !["passed", "failed"].includes(args.status as string)
  )
    throw new ContractError("review --status must be passed or failed");
  return args;
}

function main(): number {
  let args: ParsedArgs;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error: any) {
    emitError("argument-parsing", error.message);
    return 2;
  }
  const rootCandidate = resolve(args.root);
  let root: string;
  try {
    root = realpathSync.native(rootCandidate);
  } catch {
    root = rootCandidate;
  }
  const statePath = join(root, "build-pack", "execution-state.json"),
    lock = new StateLock(statePath);
  let locked = false;
  try {
    lock.enter();
    locked = true;
    const state = readJson(statePath);
    if (args.command === "migrate") {
      emitResult(
        args.command,
        commandMigrate(root, statePath, Boolean(args.apply)),
      );
      return 0;
    }
    const capabilitiesRel =
      state.capabilities_file ?? "build-pack/capabilities.json";
    if (typeof capabilitiesRel !== "string")
      throw new ContractError(
        "capabilities_file must resolve inside the repository root",
      );
    const capabilitiesPath = requireInside(
        root,
        resolve(root, capabilitiesRel),
        "capabilities_file must resolve inside the repository root",
      ),
      capabilities = readJson(capabilitiesPath);
    let result: unknown;
    if (state.schema_version === 2) {
      if (args.command === "seal-plan") {
        const [manifest, requirements, grommet] = v2RawContracts(root, state);
        emitResult(args.command, {
          candidate_digest: v2Digest(root, state, manifest, requirements),
          grommet_status: grommet.status,
        });
        return 0;
      }
      if (args.command === "impact") {
        emitResult(args.command, v2Impact(state, root, statePath));
        return 0;
      }
      const [manifest, requirements, grommet] = ensureV2Fields(
        state,
        capabilities,
        root,
      );
      switch (args.command) {
        case "validate":
          result = {
            status: "valid",
            schema_version: 2,
            candidate_digest: v2Digest(root, state, manifest, requirements),
          };
          break;
        case "status":
          v2Reconcile(state);
          writeJsonAtomic(statePath, state);
          result = state;
          break;
        case "next":
          v2Reconcile(state);
          result =
            state.tasks.find((task: Obj) =>
              ["in_progress", "verified", "integrated", "published"].includes(
                task.status,
              ),
            ) ?? state.tasks.find((task: Obj) => task.status === "ready");
          if (!result)
            throw new ContractError(
              "no ready task; resolve blockers or complete active work",
            );
          break;
        case "recover": {
          const journal = join(root, "build-pack", JOURNAL_NAME),
            entries = existsSync(journal)
              ? readFileSync(journal, "utf8")
                  .split(/\r?\n/)
                  .filter(Boolean)
                  .map(
                    (line, i) =>
                      new StrictJsonParser(
                        line,
                        `${journal}:${i + 1}`,
                      ).parse() as Obj,
                  )
              : [],
            phases = new Map(
              entries.map((entry) => [entry.operation, entry.phase]),
            );
          result = {
            journal_entries: entries.length,
            incomplete_operations: [...phases]
              .filter(([, phase]) => phase !== "committed")
              .map(([operation]) => operation),
            status:
              "no automatic replay; inspect incomplete operations before retrying",
          };
          break;
        }
        case "start":
          result = v2Start(state, capabilities, root, statePath, args.task_id!);
          break;
        case "verify":
          result = v2Verify(state, root, statePath, args.task_id!);
          break;
        case "integrate":
          result = v2Integrate(
            state,
            capabilities,
            root,
            statePath,
            args.task_id!,
          );
          break;
        case "publish":
          result = v2Publish(state, root, statePath, args.task_id!);
          break;
        case "review":
          result = v2Review(
            state,
            root,
            statePath,
            args.task_id!,
            args.reviewer as string,
            args.status as string,
            args.summary as string,
            args.receipt as string,
          );
          break;
        case "release-check": {
          const incomplete = state.tasks
            .filter((task: Obj) => task.status !== "done")
            .map((task: Obj) => task.id);
          if (incomplete.length)
            throw new ContractError(
              `release is incomplete; unfinished tasks: ${JSON.stringify(incomplete)}`,
            );
          const missing = state.tasks
            .filter(
              (task: Obj) =>
                task.risk === "high" && task.review?.status !== "passed",
            )
            .map((task: Obj) => task.id);
          if (missing.length)
            throw new ContractError(
              `release lacks independent review for high-risk tasks: ${JSON.stringify(missing)}`,
            );
          result = {
            status: "release_ready",
            tasks: state.tasks.length,
            grommet_digest: grommet.candidate_digest,
          };
          break;
        }
        case "complete": {
          const task = getTask(state, args.task_id!);
          const allowed = task.publication
            ? new Set(["published"])
            : new Set(["integrated"]);
          if (!allowed.has(task.status))
            throw new ContractError(
              `task ${args.task_id} must be integrated and published when required before completion`,
            );
          Object.assign(task, {
            status: "done",
            completed_at: nowUtc(),
            operation_phase: "committed",
          });
          v2Reconcile(state);
          writeJsonAtomic(statePath, state);
          result = task;
          break;
        }
        default:
          throw new ContractError(
            `command ${args.command} is not available for schema_version 2`,
          );
      }
    } else {
      const errors = validateContract(state, capabilities, root);
      if (errors.length)
        throw new ContractError(
          `invalid execution contract: ${errors.join("; ")}`,
        );
      switch (args.command) {
        case "validate":
          result = { status: "valid" };
          break;
        case "next":
          result = commandNext(state, statePath);
          break;
        case "status":
          if (reconcile(state)) writeJsonAtomic(statePath, state);
          result = state;
          break;
        case "start":
          result = commandStart(
            state,
            capabilities,
            statePath,
            root,
            args.task_id!,
          );
          break;
        case "verify":
          result = commandVerify(state, statePath, root, args.task_id!);
          break;
        case "graph-sync":
          result = commandGraphSync(
            state,
            capabilities,
            statePath,
            root,
            args.task_id!,
          );
          break;
        case "complete":
          result = commandComplete(
            state,
            capabilities,
            statePath,
            root,
            args.task_id!,
          );
          break;
        case "record-evidence":
          result = commandRecordEvidence(
            state,
            statePath,
            root,
            args.task_id!,
            args.check as string,
            args.location as string,
            args.source as string,
            args.summary as string,
          );
          break;
        case "review":
          result = commandReview(
            state,
            statePath,
            root,
            args.task_id!,
            args.reviewer as string,
            args.status as string,
            args.summary as string,
            args.receipt as string,
          );
          break;
        case "block":
          result = commandBlock(
            state,
            statePath,
            args.task_id!,
            args.reason as string,
          );
          break;
        case "unblock":
          result = commandUnblock(
            state,
            statePath,
            args.task_id!,
            args.resolution as string,
          );
          break;
        default:
          throw new ContractError(
            `command ${args.command} is not available for schema_version 1`,
          );
      }
    }
    emitResult(args.command, result);
    return 0;
  } catch (error: any) {
    if (error instanceof VerificationFailed) {
      emitError(args.command, error.message, error.result);
      return 1;
    }
    emitError(
      args.command,
      error instanceof Error ? error.message : String(error),
    );
    return 2;
  } finally {
    if (locked) lock.exit();
  }
}

process.exitCode = main();
