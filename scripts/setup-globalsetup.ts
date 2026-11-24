#!/usr/bin/env node
/** Install GlobalSetup into one target repository after a fail-fast preflight. */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  accessSync,
  constants,
  existsSync,
  promises as fs,
  realpathSync,
} from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";

const AGENT_FOLDERS = [
  "rules",
  "skills",
  "templates",
  "reviewers",
  "safeguards",
] as const;
const SCRIPT_NAMES = [
  "generate-build-pack.sh",
  "generate-build-pack.ps1",
  "validate-build-pack.sh",
  "validate-build-pack.ps1",
  "build-runner.ts",
  "build-runner.ps1",
  "build-runner.sh",
  "node-package-command.ts",
  "pre-tool-hook.ps1",
  "repository-guard.ts",
  "repository-text.ts",
] as const;
const MATT_POCOCK_SKILLS = [
  "setup-matt-pocock-skills",
  "grill-with-docs",
  "grilling",
  "domain-modeling",
  "to-spec",
  "to-tickets",
  "implement",
  "tdd",
  "code-review",
  "retro",
  "writing-for-agents",
] as const;
const LEGACY_TDD = `---
name: tdd
description: Use when the active task calls for test-driven implementation of a bounded behavior.
argument-hint: [feature description]
---

Execute strict Test-Driven Development (TDD) for the given feature:

1. **Red**: Write one failing test for the next smallest behavior. Assert specific values and run it to confirm the expected failure.
2. **Green**: Write the minimum code that makes the test pass.
3. **Refactor**: Remove relevant duplication without changing behavior. Write code that reads like the surrounding code: match its comment density, naming, structure, and idiom. Re-run the focused checks.
4. Repeat only while the active task has unproved acceptance criteria.
`;
const BUILD_PACK_FILES: ReadonlyArray<readonly [string, string]> = [
  ["prd/confirmed-prd-template.md", "00-confirmed-prd-summary.md"],
  ["prd/prd-review-checklist.md", "01-prd-review-checklist.md"],
  ["build-requirements/build-brief-template.md", "02-build-brief.md"],
  [
    "build-requirements/implementation-contract-template.md",
    "03-implementation-contract.md",
  ],
  [
    "architecture/architecture-discovery-template.md",
    "04-existing-codebase-discovery.md",
  ],
  ["architecture/architecture-map-template.md", "05-architecture-map.md"],
  ["contracts/database-contract-template.md", "06-database-contract.md"],
  ["contracts/api-contract-template.md", "07-api-contract.md"],
  ["contracts/ui-contract-template.md", "08-ui-contract.md"],
  ["contracts/permissions-contract-template.md", "09-permissions-contract.md"],
  ["tasks/implementation-plan-template.md", "10-implementation-plan.md"],
  ["tasks/task-graph-template.md", "11-task-graph.md"],
  ["qa/test-plan-template.md", "12-test-plan.md"],
  ["qa/review-gate-template.md", "13-review-gate.md"],
  ["qa/rollback-plan-template.md", "14-rollback-plan.md"],
  ["qa/definition-of-done-template.md", "16-definition-of-done.md"],
  [
    "build-plans/build-plan-index-template.md",
    "build-plans/01-build-plan-index.md",
  ],
  [
    "build-plans/ui-ux-build-plan-template.md",
    "build-plans/02-ui-ux-build-plan.md",
  ],
  [
    "tasks/module-plan-template.md",
    "module-plans/M-000-module-plan-template.md",
  ],
  [
    "tasks/ui-ux-module-plan-template.md",
    "module-plans/M-000-ui-ux-module-plan-template.md",
  ],
  ["governance/capabilities-template.json", "capabilities.json"],
  ["governance/execution-state-template.json", "execution-state.json"],
  ["governance/source-manifest-template.json", "source-manifest.json"],
  ["governance/requirements-template.json", "requirements.json"],
  ["governance/grommet-approval-template.json", "grommet-approval.json"],
  ["governance/capabilities.schema.json", "capabilities.schema.json"],
  ["governance/execution-state.schema.json", "execution-state.schema.json"],
  ["governance/source-manifest.schema.json", "source-manifest.schema.json"],
  ["governance/requirements.schema.json", "requirements.schema.json"],
  ["governance/grommet-approval.schema.json", "grommet-approval.schema.json"],
];
class SetupError extends Error {}
type Command = readonly [string, ...string[]];
type Tools = { git: string; gitnexus: Command; node: string; npx: Command };
type JournalEntry = { backup?: string; destination: string };

function run(argv: readonly string[], cwd?: string): string {
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error || result.status !== 0) {
    const detail = (
      result.stderr ||
      result.stdout ||
      result.error?.message ||
      ""
    ).trim();
    throw new SetupError(`command failed (${argv.join(" ")}): ${detail}`);
  }
  return result.stdout || "";
}

function findCommand(name: string): string | undefined {
  const extensions =
    process.platform === "win32"
      ? (process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";")
      : [""];
  const names =
    process.platform === "win32" && !path.extname(name)
      ? extensions.map((extension) => `${name}${extension.toLowerCase()}`)
      : [name];
  for (const directory of (process.env.PATH ?? "").split(path.delimiter)) {
    if (!directory) continue;
    for (const candidateName of names) {
      const candidate = path.join(
        directory.replace(/^"|"$/g, ""),
        candidateName,
      );
      try {
        accessSync(candidate, constants.X_OK);
        return candidate;
      } catch {
        /* keep searching PATH */
      }
    }
  }
  return undefined;
}
function requireCommand(name: string): string {
  const command = findCommand(name);
  if (!command) throw new SetupError(`missing required command: ${name}`);
  return command;
}
function nodePackageCommand(
  node: string,
  shim: string,
  packageName: "npm" | "npx",
): Command {
  const resolved = realpathSync(shim);
  if (resolved.endsWith(".js")) return [node, resolved];
  if (process.platform !== "win32") return [shim];
  const cli = path.join(
    path.dirname(shim),
    "node_modules",
    "npm",
    "bin",
    `${packageName}-cli.js`,
  );
  if (!existsSync(cli))
    throw new SetupError(`could not resolve ${packageName} CLI from ${shim}`);
  return [node, cli];
}
async function copy(source: string, destination: string): Promise<void> {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(source, destination, {
    recursive: true,
    preserveTimestamps: true,
  });
}
async function sameTree(left: string, right: string): Promise<boolean> {
  if (!existsSync(left) || !existsSync(right)) return false;
  const [a, b] = await Promise.all([fs.lstat(left), fs.lstat(right)]);
  if (a.isDirectory() !== b.isDirectory() || a.isFile() !== b.isFile())
    return false;
  if (a.isFile())
    return (await fs.readFile(left)).equals(await fs.readFile(right));
  const [leftNames, rightNames] = await Promise.all([
    fs.readdir(left),
    fs.readdir(right),
  ]);
  leftNames.sort();
  rightNames.sort();
  if (leftNames.join("\0") !== rightNames.join("\0")) return false;
  for (const name of leftNames)
    if (!(await sameTree(path.join(left, name), path.join(right, name))))
      return false;
  return true;
}
async function skillHash(root: string): Promise<string> {
  const files: string[] = [];
  async function visit(directory: string): Promise<void> {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (
        [".git", "__pycache__", "__pypackages__"].includes(entry.name) ||
        entry.name === "metadata.json"
      )
        continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (entry.isFile())
        files.push(path.relative(root, full).replaceAll("\\", "/"));
    }
  }
  await visit(root);
  files.sort((left, right) => Buffer.from(left).compare(Buffer.from(right)));
  const hash = createHash("sha256");
  for (const relative of files) {
    let content = await fs.readFile(path.join(root, relative));
    if (!content.includes(0))
      content = Buffer.from(content.toString("utf8").replaceAll("\r\n", "\n"));
    hash.update(relative);
    hash.update("\0");
    hash.update(String(content.length));
    hash.update("\0");
    hash.update(content);
  }
  return hash.digest("hex");
}
async function isUnmodifiedOfficialSkill(
  target: string,
  skill: string,
  existing: string,
): Promise<boolean> {
  const lockPath = path.join(target, "skills-lock.json");
  if (!existsSync(lockPath)) return false;
  try {
    const lock = JSON.parse(await fs.readFile(lockPath, "utf8")) as {
      skills?: Record<string, { computedHash?: string; source?: string }>;
    };
    const record = lock.skills?.[skill];
    return (
      record?.source === "mattpocock/skills" &&
      typeof record.computedHash === "string" &&
      record.computedHash === (await skillHash(existing))
    );
  } catch {
    return false;
  }
}

class Journal {
  private readonly entries: JournalEntry[] = [];
  private readonly target: string;
  private readonly backupRoot: string;
  constructor(target: string, backupRoot: string) {
    this.target = target;
    this.backupRoot = backupRoot;
  }
  async replace(source: string, destination: string): Promise<void> {
    let backup: string | undefined;
    if (existsSync(destination)) {
      backup = path.join(
        this.backupRoot,
        path.relative(this.target, destination),
      );
      await fs.mkdir(path.dirname(backup), { recursive: true });
      await fs.rename(destination, backup);
    }
    this.entries.push({ destination, backup });
    await copy(source, destination);
  }
  async snapshot(destination: string): Promise<void> {
    if (this.entries.some((entry) => entry.destination === destination)) return;
    let backup: string | undefined;
    if (existsSync(destination)) {
      backup = path.join(
        this.backupRoot,
        path.relative(this.target, destination),
      );
      await copy(destination, backup);
    }
    this.entries.push({ destination, backup });
  }
  recordCreated(destination: string): void {
    this.entries.push({ destination });
  }
  async rollback(): Promise<void> {
    for (const entry of [...this.entries].reverse()) {
      await fs.rm(entry.destination, { recursive: true, force: true });
      if (entry.backup && existsSync(entry.backup)) {
        await fs.mkdir(path.dirname(entry.destination), { recursive: true });
        await fs.rename(entry.backup, entry.destination);
      }
    }
    const parents = [
      ...new Set(this.entries.map((entry) => path.dirname(entry.destination))),
    ].sort((a, b) => b.length - a.length);
    for (const initial of parents) {
      let parent = initial;
      while (
        parent !== this.target &&
        parent.startsWith(`${this.target}${path.sep}`) &&
        existsSync(parent)
      ) {
        if ((await fs.readdir(parent)).length) break;
        await fs.rmdir(parent);
        parent = path.dirname(parent);
      }
    }
  }
}

async function preflight(
  source: string,
  target: string,
  installDependencies: boolean,
  licenseEligible: boolean,
): Promise<Tools> {
  const git = requireCommand("git"),
    node = requireCommand("node");
  const npx = nodePackageCommand(node, requireCommand("npx"), "npx");
  run([
    node,
    path.join(source, "scripts", "repository-text.ts"),
    "--root",
    source,
  ]);
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (!(
    (major === 22 && minor >= 20) ||
    (major === 24 && minor >= 11) ||
    major > 24
  ))
    throw new SetupError("Node.js 22.20+ or 24.11+ is required");
  if (existsSync(target) && !(await fs.stat(target)).isDirectory())
    throw new SetupError(`target is not a directory: ${target}`);
  const configPath = path.join(target, ".gitnexusrc");
  if (existsSync(configPath)) {
    try {
      const config: unknown = JSON.parse(await fs.readFile(configPath, "utf8"));
      if (!config || Array.isArray(config) || typeof config !== "object")
        throw new Error("expected a JSON object");
    } catch (error) {
      throw new SetupError(
        `existing .gitnexusrc is not valid UTF-8 JSON: ${error}`,
      );
    }
  }
  if (existsSync(path.join(target, ".git"))) {
    const hooks = spawnSync(
      git,
      ["-C", target, "config", "--local", "--get", "core.hooksPath"],
      { encoding: "utf8" },
    );
    const hooksPath = hooks.status === 0 ? (hooks.stdout || "").trim() : "";
    if (hooksPath && ![".githooks", "./.githooks"].includes(hooksPath))
      throw new SetupError(
        `existing core.hooksPath ${JSON.stringify(hooksPath)} requires manual integration`,
      );
  }
  if (!licenseEligible)
    throw new SetupError(
      "GitNexus is PolyForm-Noncommercial; pass --acknowledge-gitnexus-license only when this target is eligible",
    );
  let gitnexusShim = findCommand("gitnexus");
  const npm = nodePackageCommand(node, requireCommand("npm"), "npm");
  if (!gitnexusShim) {
    if (installDependencies) {
      run([...npm, "install", "--global", "gitnexus@1.6.10"]);
      gitnexusShim = requireCommand("gitnexus");
    } else gitnexusShim = "gitnexus";
  }
  let gitnexus: Command = [gitnexusShim];
  if (process.platform === "win32" && /\.(cmd|bat)$/i.test(gitnexusShim)) {
    const globalRoot = run([...npm, "root", "--global"]).trim();
    const manifest = JSON.parse(
      await fs.readFile(
        path.join(globalRoot, "gitnexus", "package.json"),
        "utf8",
      ),
    ) as { bin?: string | Record<string, string> };
    const relative =
      typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.gitnexus;
    if (!relative)
      throw new SetupError(
        "installed gitnexus package does not declare a gitnexus executable",
      );
    gitnexus = [node, path.join(globalRoot, "gitnexus", relative)];
  }
  return { git, gitnexus, node, npx };
}

async function stageBuildPack(
  stageAgents: string,
  buildPack: string,
): Promise<void> {
  for (const [sourceRelative, targetRelative] of BUILD_PACK_FILES)
    await copy(
      path.join(stageAgents, "templates", sourceRelative),
      path.join(buildPack, targetRelative),
    );
  await copy(
    path.join(stageAgents, "safeguards", "pre-ship-checklist.md"),
    path.join(buildPack, "15-pre-ship-checklist.md"),
  );
  await fs.mkdir(path.join(buildPack, "tasks"), { recursive: true });
}
async function mergeSkillsLock(stage: string, target: string): Promise<void> {
  const stagePath = path.join(stage, "skills-lock.json"),
    targetPath = path.join(target, "skills-lock.json");
  if (!existsSync(targetPath)) return;
  if (!existsSync(stagePath)) {
    await copy(targetPath, stagePath);
    return;
  }
  const targetLock = JSON.parse(
    await fs.readFile(targetPath, "utf8"),
  ) as Record<string, unknown>;
  const stageLock = JSON.parse(await fs.readFile(stagePath, "utf8")) as Record<
    string,
    unknown
  >;
  const targetSkills =
    targetLock.skills && typeof targetLock.skills === "object"
      ? targetLock.skills
      : {};
  const stageSkills =
    stageLock.skills && typeof stageLock.skills === "object"
      ? stageLock.skills
      : {};
  await fs.writeFile(
    stagePath,
    `${JSON.stringify({ ...targetLock, ...stageLock, skills: { ...targetSkills, ...stageSkills } }, null, 2)}\n`,
  );
}
async function installOfficialSkills(
  stage: string,
  target: string,
  npx: Command,
): Promise<void> {
  run(
    [
      ...npx,
      "--yes",
      "skills@latest",
      "add",
      "mattpocock/skills",
      ...MATT_POCOCK_SKILLS.flatMap((skill) => ["--skill", skill]),
      "--agent",
      "universal",
      "--copy",
      "--yes",
    ],
    stage,
  );
  if (!existsSync(path.join(stage, "skills-lock.json")))
    throw new SetupError(
      "official skill installer did not create skills-lock.json",
    );
  for (const skill of MATT_POCOCK_SKILLS) {
    const installed = path.join(stage, ".agents", "skills", skill);
    if (!existsSync(path.join(installed, "SKILL.md")))
      throw new SetupError(`official skill installer did not install ${skill}`);
    const existing = path.join(target, ".agents", "skills", skill);
    if (existsSync(existing) && !(await sameTree(existing, installed))) {
      const legacyTdd =
        skill === "tdd" &&
        existsSync(path.join(existing, "SKILL.md")) &&
        (await fs.readFile(path.join(existing, "SKILL.md"), "utf8")).replaceAll(
          "\r\n",
          "\n",
        ) === LEGACY_TDD;
      if (
        !legacyTdd &&
        !(await isUnmodifiedOfficialSkill(target, skill, existing))
      )
        throw new SetupError(
          `refusing to overwrite existing custom skill: ${skill}`,
        );
    }
  }
  const targetSkills = path.join(target, ".agents", "skills");
  if (existsSync(targetSkills))
    for (const name of await fs.readdir(targetSkills)) {
      const destination = path.join(stage, ".agents", "skills", name);
      if (!existsSync(destination))
        await copy(path.join(targetSkills, name), destination);
    }
  await mergeSkillsLock(stage, target);
}
async function stagePayload(
  source: string,
  target: string,
  stage: string,
  includeBuildPack: boolean,
  npx: Command,
): Promise<void> {
  await copy(path.join(source, "AGENTS.md"), path.join(stage, "AGENTS.md"));
  for (const folder of AGENT_FOLDERS)
    await copy(path.join(source, folder), path.join(stage, ".agents", folder));
  for (const name of SCRIPT_NAMES)
    await copy(
      path.join(source, "scripts", name),
      path.join(stage, "scripts", name),
    );
  await copy(path.join(source, ".gitnexusrc"), path.join(stage, ".gitnexusrc"));
  await copy(
    path.join(source, "scripts", "pre-commit"),
    path.join(stage, ".githooks", "pre-commit"),
  );
  await installOfficialSkills(stage, target, npx);
  if (includeBuildPack)
    await stageBuildPack(
      path.join(stage, ".agents"),
      path.join(stage, "build-pack"),
    );
}
async function appendGitignore(
  target: string,
  journal: Journal,
): Promise<void> {
  const file = path.join(target, ".gitignore");
  await journal.snapshot(file);
  const lines = existsSync(file)
    ? (await fs.readFile(file, "utf8")).split(/\r?\n/).filter(Boolean)
    : [];
  for (const entry of [
    ".gitnexus/",
    ".globalsetup-backups/",
    "build-pack/runtime/",
  ])
    if (!lines.includes(entry)) lines.push(entry);
  await fs.writeFile(file, `${lines.join("\n")}\n`);
}
async function enforceGitnexusConfig(
  target: string,
  journal: Journal,
): Promise<void> {
  const file = path.join(target, ".gitnexusrc");
  await journal.snapshot(file);
  const config = existsSync(file)
    ? JSON.parse(await fs.readFile(file, "utf8"))
    : {};
  config.indexOnly = true;
  await fs.writeFile(file, `${JSON.stringify(config, null, 2)}\n`);
}
async function persistBackups(
  target: string,
  backupRoot: string,
  journal: Journal,
): Promise<void> {
  if (!existsSync(backupRoot) || !(await fs.readdir(backupRoot)).length) return;
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const destination = path.join(target, ".globalsetup-backups", timestamp);
  journal.recordCreated(destination);
  await copy(backupRoot, destination);
}

async function install(
  source: string,
  target: string,
  tools: Tools,
  dryRun: boolean,
): Promise<Record<string, unknown>> {
  const plan = {
    target,
    agent_folders: [...AGENT_FOLDERS],
    scripts: [...SCRIPT_NAMES],
    matt_pocock_skills: [...MATT_POCOCK_SKILLS],
    gitnexus: "required",
    dry_run: dryRun,
  };
  if (dryRun) return plan;
  const targetCreated = !existsSync(target),
    tempRoot = await fs.mkdtemp(path.join(tmpdir(), "globalsetup-")),
    stage = path.join(tempRoot, "stage");
  await fs.mkdir(stage);
  const includeBuildPack = !existsSync(
    path.join(target, "build-pack", "execution-state.json"),
  );
  try {
    await stagePayload(source, target, stage, includeBuildPack, tools.npx);
    await fs.mkdir(target, { recursive: true });
    const backupRoot = path.join(tempRoot, "backup"),
      journal = new Journal(target, backupRoot),
      hadGit = existsSync(path.join(target, ".git"));
    const hooksResult = hadGit
      ? spawnSync(
          tools.git,
          ["-C", target, "config", "--local", "--get", "core.hooksPath"],
          { encoding: "utf8" },
        )
      : undefined;
    const hadHooksSetting = hooksResult?.status === 0,
      oldHooks = hadHooksSetting ? (hooksResult?.stdout || "").trim() : "";
    try {
      await journal.replace(
        path.join(stage, "AGENTS.md"),
        path.join(target, "AGENTS.md"),
      );
      await journal.replace(
        path.join(stage, ".agents"),
        path.join(target, ".agents"),
      );
      for (const name of SCRIPT_NAMES)
        await journal.replace(
          path.join(stage, "scripts", name),
          path.join(target, "scripts", name),
        );
      await journal.replace(
        path.join(stage, "skills-lock.json"),
        path.join(target, "skills-lock.json"),
      );
      await enforceGitnexusConfig(target, journal);
      await appendGitignore(target, journal);
      if (!hadGit) run([tools.git, "-C", target, "init", "--quiet"]);
      const hook = path.join(target, ".githooks", "pre-commit"),
        stagedHook = path.join(stage, ".githooks", "pre-commit");
      if (existsSync(hook) && !(await sameTree(hook, stagedHook)))
        await journal.replace(
          hook,
          path.join(target, ".githooks", "pre-commit.user"),
        );
      await journal.replace(stagedHook, hook);
      if (process.platform !== "win32") {
        await fs.chmod(hook, 0o755);
        for (const name of [
          "generate-build-pack.sh",
          "validate-build-pack.sh",
          "build-runner.sh",
        ])
          await fs.chmod(path.join(target, "scripts", name), 0o755);
      }
      run([
        tools.git,
        "-C",
        target,
        "config",
        "--local",
        "core.hooksPath",
        ".githooks",
      ]);
      await journal.snapshot(path.join(target, ".gitnexus"));
      run(
        [
          ...tools.gitnexus,
          "analyze",
          "--index-only",
          "--skip-agents-md",
          "--skip-skills",
          "--name",
          path.basename(target),
          "--branch",
          "globalsetup/integration",
        ],
        target,
      );
      const localRunner = path.join(target, ".gitnexus", "run.cjs");
      if (!existsSync(localRunner))
        throw new SetupError(
          "GitNexus did not create its repository-local runner",
        );
      const status = run(
        [tools.node, localRunner, "status"],
        target,
      ).toLowerCase();
      if (!status.includes("up-to-date") && !status.includes("up to date"))
        throw new SetupError("GitNexus did not report an up-to-date index");
      if (includeBuildPack)
        await journal.replace(
          path.join(stage, "build-pack"),
          path.join(target, "build-pack"),
        );
      await persistBackups(target, backupRoot, journal);
    } catch (error) {
      await journal.rollback();
      if (hadGit) {
        if (hadHooksSetting)
          run([
            tools.git,
            "-C",
            target,
            "config",
            "--local",
            "core.hooksPath",
            oldHooks,
          ]);
        else
          spawnSync(tools.git, [
            "-C",
            target,
            "config",
            "--local",
            "--unset",
            "core.hooksPath",
          ]);
      } else
        await fs.rm(path.join(target, ".git"), {
          recursive: true,
          force: true,
        });
      if (targetCreated) await fs.rm(target, { recursive: true, force: true });
      throw error;
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
  return plan;
}

function parseArguments(argv: string[]): {
  acknowledge: boolean;
  dryRun: boolean;
  target: string;
} {
  let target = ".",
    dryRun = false,
    acknowledge = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--target") {
      if (!argv[index + 1])
        throw new SetupError("--target requires a directory");
      target = argv[++index];
    } else if (argument === "--dry-run") dryRun = true;
    else if (argument === "--acknowledge-gitnexus-license") acknowledge = true;
    else if (!argument.startsWith("-") && target === ".") target = argument;
    else throw new SetupError(`unknown argument: ${argument}`);
  }
  return { acknowledge, dryRun, target: path.resolve(target) };
}
async function main(): Promise<void> {
  let parsed: ReturnType<typeof parseArguments>;
  try {
    parsed = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(
      `setup preflight failed: ${error instanceof Error ? error.message : error}`,
    );
    process.exitCode = 2;
    return;
  }
  const source = path.resolve(import.meta.dirname, "..");
  let tools: Tools;
  try {
    tools = await preflight(
      source,
      parsed.target,
      !parsed.dryRun,
      parsed.acknowledge,
    );
  } catch (error) {
    console.error(
      `setup preflight failed: ${error instanceof Error ? error.message : error}`,
    );
    process.exitCode = 2;
    return;
  }
  try {
    console.log(
      JSON.stringify(
        {
          ok: true,
          result: await install(source, parsed.target, tools, parsed.dryRun),
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(
      `setup failed and target changes were rolled back: ${error instanceof Error ? error.message : error}`,
    );
    process.exitCode = 2;
  }
}
await main();
