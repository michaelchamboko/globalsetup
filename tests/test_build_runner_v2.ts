import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { afterEach, test } from "node:test";

const RUNNER = path.resolve(
  import.meta.dirname,
  "..",
  "scripts",
  "build-runner.ts",
);
const json = (value: unknown) => JSON.stringify(value, null, 2);
const js = (source: string) => [process.execPath, "-e", source];
let roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) {
    const managed = path.join(
      path.dirname(root),
      ".globalsetup-worktrees",
      path.basename(root),
    );
    if (existsSync(managed)) {
      for (const child of readDir(managed))
        spawnSync(
          "git",
          [
            "-C",
            root,
            "worktree",
            "remove",
            "--force",
            path.join(managed, child),
          ],
          { encoding: "utf8" },
        );
      rmSync(managed, {
        recursive: true,
        force: true,
      });
    }
    rmSync(root, { recursive: true, force: true });
  }
});
function readDir(dir: string) {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), "globalsetup-v2-"));
  roots.push(root);
  execFileSync("git", ["init", "-q", root]);
  mkdirSync(path.join(root, ".gitnexus"));
  writeFileSync(
    path.join(root, ".gitnexus", "run.cjs"),
    "if (process.argv[2] === 'status') console.log('Status: up-to-date'); else console.log('Indexed');",
  );
  mkdirSync(path.join(root, "docs"));
  writeFileSync(
    path.join(root, "docs", "prd.md"),
    "# Approved\nBuild the tested thing.\n",
  );
  mkdirSync(path.join(root, "build-pack"));
  const statePath = path.join(root, "build-pack", "execution-state.json");
  writeFileSync(
    statePath,
    json({
      schema_version: 1,
      mode: "mvp",
      capabilities_file: "build-pack/capabilities.json",
      source_authority: {
        build_intent_summary: "Build the tested thing.",
        approved_sources: ["docs/prd.md"],
        contradictions: [],
        grommet_review: { status: "approved", summary: "mapped" },
      },
      automation_authority: {
        publication: { enabled: false, destinations: [] },
      },
      tasks: [
        {
          id: "T-001",
          title: "Test outcome",
          status: "ready",
          dependencies: [],
          risk: "low",
          source_changes: false,
          requirement_sources: ["docs/prd.md"],
          context_files: ["docs/prd.md"],
          validation: [
            {
              name: "test",
              tier: "task",
              kind: "command",
              location: "local",
              argv: js("console.log('ok')"),
            },
          ],
          evidence: [],
        },
      ],
    }),
  );
  writeFileSync(
    path.join(root, "build-pack", "capabilities.json"),
    json({
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
    }),
  );
  execFileSync("git", ["-C", root, "add", "."]);
  execFileSync("git", [
    "-C",
    root,
    "-c",
    "user.name=Test",
    "-c",
    "user.email=test@example.invalid",
    "commit",
    "-qm",
    "fixture",
  ]);
  return { root, statePath };
}
function run(root: string, ...args: string[]) {
  return spawnSync(process.execPath, [RUNNER, "--root", root, ...args], {
    encoding: "utf8",
  });
}
function expectRun(root: string, args: string[], expected = 0) {
  const result = run(root, ...args);
  assert.equal(result.status, expected, result.stdout + result.stderr);
  return result;
}
function result(root: string, args: string[]) {
  const payload = JSON.parse(expectRun(root, args).stdout);
  assert.equal(payload.ok, true);
  return payload.result;
}
function approve(f: ReturnType<typeof fixture>) {
  expectRun(f.root, ["migrate", "--apply"]);
  const sealed = result(f.root, ["seal-plan"]);
  const approvalPath = path.join(f.root, "build-pack", "grommet-approval.json");
  const approval = JSON.parse(readFileSync(approvalPath, "utf8"));
  Object.assign(approval, {
    status: "approved",
    operator: "test",
    approved_at: "2026-08-31T00:00:00+00:00",
    candidate_digest: sealed.candidate_digest,
  });
  writeFileSync(approvalPath, json(approval));
}

test("migration is reversible and requires Grommet approval", () => {
  const f = fixture();
  const dryRun = result(f.root, ["migrate"]);
  assert.equal(dryRun.status, "dry_run");
  assert.equal(JSON.parse(readFileSync(f.statePath, "utf8")).schema_version, 1);
  expectRun(f.root, ["migrate", "--apply"]);
  assert.equal(existsSync(`${f.statePath}.v1.bak`), true);
  assert.match(expectRun(f.root, ["validate"], 2).stderr, /Grommet approval/);
  approve(f);
  expectRun(f.root, ["validate"]);
});
test("v2 rejects context over 40 percent", () => {
  const f = fixture();
  approve(f);
  const state = JSON.parse(readFileSync(f.statePath, "utf8"));
  state.tasks[0].context_packet.initial_tokens = 13000;
  state.tasks[0].context_packet.window_tokens = 32000;
  writeFileSync(f.statePath, json(state));
  assert.match(expectRun(f.root, ["validate"], 2).stderr, /40 percent/);
});
test("duplicate JSON keys are rejected", () => {
  const f = fixture();
  writeFileSync(f.statePath, '{"schema_version": 1, "schema_version": 1}');
  assert.match(expectRun(f.root, ["validate"], 2).stderr, /duplicate JSON key/);
});
test("impact invalidates only tasks connected to changed source sections", () => {
  const f = fixture();
  approve(f);
  writeFileSync(
    path.join(f.root, "docs", "prd.md"),
    "# Approved\nChanged scope.\n",
  );
  const impact = result(f.root, ["impact"]);
  assert.deepEqual(impact.changed_requirements, ["R-T-001"]);
  assert.deepEqual(impact.changed_tasks, ["T-001"]);
  assert.equal(
    JSON.parse(readFileSync(f.statePath, "utf8")).tasks[0].status,
    "blocked",
  );
});
test("serial worktree lifecycle keeps operator checkout out of scope", () => {
  const f = fixture();
  approve(f);
  const capabilitiesPath = path.join(f.root, "build-pack", "capabilities.json");
  const capabilities = JSON.parse(readFileSync(capabilitiesPath, "utf8"));
  capabilities.graph.sync_argv = ["node", ".gitnexus/run.cjs", "analyze"];
  writeFileSync(capabilitiesPath, json(capabilities));
  const started = result(f.root, ["start", "T-001"]);
  const workspace = started.workspace.path;
  assert.equal(existsSync(workspace), true);
  assert.notEqual(f.root, workspace);
  expectRun(f.root, ["verify", "T-001"]);
  expectRun(f.root, ["integrate", "T-001"]);
  const complete = result(f.root, ["complete", "T-001"]);
  assert.equal(complete.status, "done");
});
