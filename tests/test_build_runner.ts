import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { afterEach, test } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const RUNNER = path.join(REPO_ROOT, "scripts", "build-runner.mts");
const js = (source: string) => [process.execPath, "-e", source];
const json = (value: unknown) => JSON.stringify(value, null, 2);

let projects: string[] = [];
afterEach(() => {
  for (const project of projects.splice(0))
    rmSync(project, { recursive: true, force: true });
});

function fixture() {
  const project = mkdtempSync(path.join(tmpdir(), "globalsetup-test-"));
  projects.push(project);
  execFileSync("git", ["init", "-q", project]);
  writeFileSync(path.join(project, ".gitignore"), ".gitnexus/\n");
  mkdirSync(path.join(project, ".gitnexus"));
  writeFileSync(
    path.join(project, ".gitnexus", "run.cjs"),
    `const fs = require('fs');
const command = process.argv[2];
if (command === 'status') { if (fs.existsSync('.gitnexus/not-ready')) console.log('Repository not indexed.'); else console.log('Status: ✅ up-to-date'); process.exit(0); }
if (command === 'analyze') { console.log('Indexed'); process.exit(0); } process.exit(2);\n`,
  );
  mkdirSync(path.join(project, "build-pack", "tasks"), { recursive: true });
  writeFileSync(
    path.join(project, "build-pack", "tasks", "T-001.md"),
    "# T-001\n",
  );
  writeFileSync(
    path.join(project, "build-pack", "tasks", "T-002.md"),
    "# T-002\n",
  );
  mkdirSync(path.join(project, "docs"));
  writeFileSync(
    path.join(project, "docs", "approved-prd.md"),
    "# Approved PRD\n",
  );
  mkdirSync(
    path.join(project, ".agents", "skills", "fresh-context-execution"),
    { recursive: true },
  );
  writeFileSync(
    path.join(
      project,
      ".agents",
      "skills",
      "fresh-context-execution",
      "SKILL.md",
    ),
    "---\nname: fresh-context-execution\ndescription: Use when executing one task.\n---\n",
  );
  const capabilities = {
    schema_version: 1,
    node: { required: true },
    graph: {
      required: true,
      provider: "gitnexus",
      license: {
        spdx: "PolyForm-Noncommercial-1.0.0",
        usage: "noncommercial",
        acknowledged: true,
      },
      status_argv: ["node", ".gitnexus/run.cjs", "status"],
      sync_argv: [
        "node",
        ".gitnexus/run.cjs",
        "analyze",
        "--skip-agents-md",
        "--skip-skills",
      ],
    },
  };
  writeFileSync(
    path.join(project, "build-pack", "capabilities.json"),
    json(capabilities),
  );
  const check = (message: string) =>
    js(`console.log(${JSON.stringify(message)})`);
  const state = {
    schema_version: 1,
    mode: "mvp",
    capabilities_file: "build-pack/capabilities.json",
    source_authority: {
      build_intent_summary: "Build the approved foundation and use it.",
      approved_sources: ["docs/approved-prd.md"],
      contradictions: [],
      grommet_review: {
        status: "approved",
        summary: "Tasks match the approved PRD.",
      },
    },
    automation_authority: {
      publication: { enabled: true, destinations: ["production-site"] },
    },
    tasks: [
      {
        id: "T-001",
        title: "Create the foundation",
        status: "ready",
        dependencies: [],
        risk: "low",
        source_changes: false,
        requirement_sources: ["docs/approved-prd.md"],
        context_files: [
          "docs/approved-prd.md",
          "build-pack/tasks/T-001.md",
          ".agents/skills/fresh-context-execution/SKILL.md",
        ],
        validation: [
          {
            name: "focused check",
            tier: "task",
            kind: "command",
            location: "local",
            argv: check("focused-pass"),
          },
        ],
        evidence: [],
      },
      {
        id: "T-002",
        title: "Use the foundation",
        status: "blocked",
        dependencies: ["T-001"],
        risk: "medium",
        source_changes: true,
        requirement_sources: ["docs/approved-prd.md"],
        context_files: [
          "docs/approved-prd.md",
          "build-pack/tasks/T-002.md",
          ".agents/skills/fresh-context-execution/SKILL.md",
        ],
        validation: [
          {
            name: "focused check",
            tier: "task",
            kind: "command",
            location: "local",
            argv: check("focused-pass"),
          },
          {
            name: "affected check",
            tier: "affected",
            kind: "command",
            location: "local",
            argv: check("affected-pass"),
          },
        ],
        evidence: [],
      },
    ],
  };
  const statePath = path.join(project, "build-pack", "execution-state.json");
  writeFileSync(statePath, json(state));
  return { project, statePath };
}
function runRunner(project: string, ...args: string[]) {
  return spawnSync(process.execPath, [RUNNER, "--root", project, ...args], {
    encoding: "utf8",
  });
}
function expectRun(project: string, args: string[], expected = 0) {
  const result = runRunner(project, ...args);
  assert.equal(result.status, expected, `${result.stdout}\n${result.stderr}`);
  return result;
}
function readState(statePath: string): any {
  return JSON.parse(readFileSync(statePath, "utf8"));
}
function writeState(statePath: string, state: any) {
  writeFileSync(statePath, json(state));
}
function resultPayload(result: ReturnType<typeof runRunner>) {
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  return payload.result;
}

test("validate accepts a complete execution contract", () => {
  const f = fixture();
  const payload = JSON.parse(expectRun(f.project, ["validate"]).stdout);
  assert.deepEqual(payload, {
    ok: true,
    command: "validate",
    result: { status: "valid" },
  });
});
test("next start verify complete unlocks the dependency", () => {
  const f = fixture();
  assert.equal(resultPayload(expectRun(f.project, ["next"])).id, "T-001");
  expectRun(f.project, ["start", "T-001"]);
  expectRun(f.project, ["verify", "T-001"]);
  assert.equal(
    resultPayload(expectRun(f.project, ["complete", "T-001"])).id,
    "T-001",
  );
  const tasks = Object.fromEntries(
    readState(f.statePath).tasks.map((task: any) => [task.id, task]),
  );
  assert.equal(tasks["T-001"].status, "done");
  assert.equal(tasks["T-002"].status, "ready");
  assert.deepEqual(
    tasks["T-001"].evidence.map((r: any) => r.tier),
    ["task"],
  );
  assert.equal(tasks["T-001"].graph_evidence.status, "fresh");
  assert.equal(
    tasks["T-001"].verified_source_fingerprint,
    tasks["T-001"].graph_evidence.source_fingerprint,
  );
});
test("only one task can be in progress", () => {
  const f = fixture();
  expectRun(f.project, ["start", "T-001"]);
  const r = expectRun(f.project, ["start", "T-002"], 2);
  assert.match(r.stderr, /already active/);
});
test("next resumes the in-progress task before selecting new work", () => {
  const f = fixture();
  expectRun(f.project, ["start", "T-001"]);
  const task = resultPayload(expectRun(f.project, ["next"]));
  assert.equal(task.id, "T-001");
  assert.equal(task.status, "in_progress");
});
test("next resumes a verified task pending completion", () => {
  const f = fixture();
  expectRun(f.project, ["start", "T-001"]);
  expectRun(f.project, ["verify", "T-001"]);
  assert.equal(resultPayload(expectRun(f.project, ["next"])).id, "T-001");
  assert.equal(
    resultPayload(expectRun(f.project, ["next"])).status,
    "verified",
  );
  const r = expectRun(f.project, ["start", "T-002"], 2);
  assert.match(r.stderr, /already active/);
});
test("explicit blocker persists until resolved", () => {
  const f = fixture();
  expectRun(f.project, ["block", "T-001", "--reason", "missing fixture"]);
  assert.match(expectRun(f.project, ["next"], 2).stderr, /no ready task/);
  expectRun(f.project, [
    "unblock",
    "T-001",
    "--resolution",
    "fixture supplied",
  ]);
  assert.equal(resultPayload(expectRun(f.project, ["next"])).id, "T-001");
  const task = readState(f.statePath).tasks[0];
  assert.equal(task.blocker_history[0].resolution, "fixture supplied");
  assert.equal("blocker" in task, false);
});
test("medium risk runs focused and affected checks", () => {
  const f = fixture();
  const state = readState(f.statePath);
  state.tasks[0].status = "done";
  state.tasks[1].status = "ready";
  writeState(f.statePath, state);
  expectRun(f.project, ["start", "T-002"]);
  expectRun(f.project, ["verify", "T-002"]);
  assert.deepEqual(
    readState(f.statePath).tasks[1].evidence.map((r: any) => r.tier),
    ["task", "affected"],
  );
});
test("high risk requires full validation", () => {
  const f = fixture();
  const state = readState(f.statePath);
  state.tasks[0].risk = "high";
  writeState(f.statePath, state);
  assert.match(expectRun(f.project, ["validate"], 2).stderr, /full/);
});
test("graph sync records the required provider", () => {
  const f = fixture();
  const state = readState(f.statePath);
  state.tasks[0].status = "done";
  state.tasks[1].status = "ready";
  writeState(f.statePath, state);
  expectRun(f.project, ["start", "T-002"]);
  expectRun(f.project, ["verify", "T-002"]);
  const payload = resultPayload(expectRun(f.project, ["graph-sync", "T-002"]));
  assert.equal(payload.provider, "gitnexus");
  assert.equal(payload.status, "fresh");
  assert.equal(
    payload.source_fingerprint,
    readState(f.statePath).tasks[1].verified_source_fingerprint,
  );
});
test("required graph provider fails closed when it cannot run", () => {
  const f = fixture();
  const state = readState(f.statePath);
  state.tasks[0].status = "done";
  state.tasks[1].status = "ready";
  writeState(f.statePath, state);
  expectRun(f.project, ["start", "T-002"]);
  expectRun(f.project, ["verify", "T-002"]);
  const cp = path.join(f.project, "build-pack", "capabilities.json");
  const capabilities = JSON.parse(readFileSync(cp, "utf8"));
  delete capabilities.graph.sync_argv;
  writeFileSync(cp, json(capabilities));
  assert.match(
    expectRun(f.project, ["graph-sync", "T-002"], 2).stderr,
    /graph\.sync_argv/,
  );
});
test("graph status requires an explicit up-to-date result", () => {
  const f = fixture();
  writeFileSync(path.join(f.project, ".gitnexus", "not-ready"), "");
  assert.match(
    expectRun(f.project, ["start", "T-001"], 2).stderr,
    /unavailable or stale/,
  );
});
test("completion updates gitnexus even without source changes", () => {
  const f = fixture();
  expectRun(f.project, ["start", "T-001"]);
  expectRun(f.project, ["verify", "T-001"]);
  expectRun(f.project, ["complete", "T-001"]);
  const task = readState(f.statePath).tasks[0];
  assert.equal(task.source_changes, false);
  assert.equal(task.graph_evidence.status, "fresh");
});
test("failed verification records a durable blocker", () => {
  const f = fixture();
  const state = readState(f.statePath);
  state.tasks[0].validation[0].argv = js("process.exit(1)");
  writeState(f.statePath, state);
  expectRun(f.project, ["start", "T-001"]);
  expectRun(f.project, ["verify", "T-001"], 1);
  const task = readState(f.statePath).tasks[0];
  assert.equal(task.status, "blocked");
  assert.match(task.blocker.reason, /validation failed/);
});
test("source drift invalidates verification before completion", () => {
  const f = fixture();
  expectRun(f.project, ["start", "T-001"]);
  expectRun(f.project, ["verify", "T-001"]);
  writeFileSync(
    path.join(f.project, "changed-after-verification.txt"),
    "drift\n",
  );
  assert.match(
    expectRun(f.project, ["complete", "T-001"], 2).stderr,
    /source changed after verification/,
  );
  const task = readState(f.statePath).tasks[0];
  assert.equal(task.status, "in_progress");
  assert.equal(task.verification_history[0].status, "invalidated");
});
test("verification rejects commands that change source state", () => {
  const f = fixture();
  const state = readState(f.statePath);
  state.tasks[0].validation[0].argv = js(
    "require('fs').writeFileSync('generated.txt', 'changed')",
  );
  writeState(f.statePath, state);
  expectRun(f.project, ["start", "T-001"]);
  assert.match(
    expectRun(f.project, ["verify", "T-001"], 2).stderr,
    /changed source/,
  );
  const task = readState(f.statePath).tasks[0];
  assert.equal(task.status, "in_progress");
  assert.equal("verified_source_fingerprint" in task, false);
});
test("high risk completion requires recorded review", () => {
  const f = fixture();
  const state = readState(f.statePath);
  const task = state.tasks[0];
  task.risk = "high";
  task.source_changes = true;
  task.validation.push(
    {
      name: "affected check",
      tier: "affected",
      kind: "command",
      location: "local",
      argv: js("console.log('affected-pass')"),
    },
    {
      name: "full check",
      tier: "full",
      kind: "command",
      location: "local",
      argv: js("console.log('full-pass')"),
    },
  );
  writeState(f.statePath, state);
  expectRun(f.project, ["start", "T-001"]);
  expectRun(f.project, ["verify", "T-001"]);
  assert.match(
    expectRun(f.project, ["complete", "T-001"], 2).stderr,
    /independent review/,
  );
  const review = resultPayload(
    expectRun(f.project, [
      "review",
      "T-001",
      "--reviewer",
      "independent-reviewer",
      "--status",
      "passed",
      "--summary",
      "No blocking findings",
      "--receipt",
      "task://independent-review/123",
    ]),
  );
  assert.equal(review.receipt, "task://independent-review/123");
  assert.equal(
    review.source_fingerprint,
    readState(f.statePath).tasks[0].verified_source_fingerprint,
  );
  expectRun(f.project, ["complete", "T-001"]);
});
test("context files must be repo relative and exist", () => {
  const f = fixture();
  const state = readState(f.statePath);
  state.tasks[0].context_files = ["../outside.md"];
  writeState(f.statePath, state);
  let r = expectRun(f.project, ["validate"], 2);
  assert.match(r.stderr, /context_files/);
  assert.match(r.stderr, /inside the repository/);
  r = expectRun(f.project, ["start", "T-001"], 2);
  assert.match(r.stderr, /context_files/);
});
test("unresolved source contradiction blocks execution", () => {
  const f = fixture();
  const state = readState(f.statePath);
  state.source_authority.contradictions = [
    {
      id: "C-001",
      summary: "Conflicting publication rules",
      sources: ["docs/approved-prd.md", "docs/approved-prd.md"],
      status: "unresolved",
    },
  ];
  writeState(f.statePath, state);
  assert.match(
    expectRun(f.project, ["validate"], 2).stderr,
    /source contradiction C-001 must be resolved/,
  );
});
test("gitnexus output cannot be product authority", () => {
  const f = fixture();
  writeFileSync(
    path.join(f.project, ".gitnexus", "derived.md"),
    "# Derived graph\n",
  );
  const state = readState(f.statePath);
  state.source_authority.approved_sources = [".gitnexus/derived.md"];
  state.tasks[0].requirement_sources = [".gitnexus/derived.md"];
  state.tasks[0].context_files.push(".gitnexus/derived.md");
  writeState(f.statePath, state);
  assert.match(
    expectRun(f.project, ["validate"], 2).stderr,
    /cannot use derived GitNexus data as product authority/,
  );
});
test("authorized publication does not require another confirmation", () => {
  const f = fixture();
  const state = readState(f.statePath);
  state.tasks[0].publication = { destination: "production-site" };
  writeState(f.statePath, state);
  assert.ok(expectRun(f.project, ["validate"]).stdout);
});
test("undeclared publication destination is rejected", () => {
  const f = fixture();
  const state = readState(f.statePath);
  state.tasks[0].publication = { destination: "package-registry" };
  writeState(f.statePath, state);
  assert.match(
    expectRun(f.project, ["validate"], 2).stderr,
    /publication destination is not authorized/,
  );
});
test("hosted receipt is required and bound to source", () => {
  const f = fixture();
  const state = readState(f.statePath);
  state.tasks[0].validation = [
    {
      name: "production smoke",
      tier: "task",
      kind: "receipt",
      location: "production",
    },
  ];
  writeState(f.statePath, state);
  expectRun(f.project, ["start", "T-001"]);
  assert.match(
    expectRun(f.project, ["verify", "T-001"], 2).stderr,
    /record-evidence/,
  );
  const receipt = resultPayload(
    expectRun(f.project, [
      "record-evidence",
      "T-001",
      "--check",
      "production smoke",
      "--location",
      "production",
      "--source",
      "https://example.test/deployments/123",
      "--summary",
      "HTTP 200 and expected release marker",
    ]),
  );
  assert.equal(receipt.kind, "receipt");
  const evidence = resultPayload(expectRun(f.project, ["verify", "T-001"]));
  assert.equal(evidence[0].source, "https://example.test/deployments/123");
  assert.equal(evidence[0].source_fingerprint, receipt.source_fingerprint);
});
test("subcommands publish actionable help", () => {
  const result = spawnSync(
    process.execPath,
    [RUNNER, "record-evidence", "--help"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /hosted or external verification receipt/);
  assert.match(result.stdout, /--source/);
});
