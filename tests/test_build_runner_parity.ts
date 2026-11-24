import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test, { afterEach } from "node:test";

const RUNNER = path.resolve(
  import.meta.dirname,
  "..",
  "scripts",
  "build-runner.ts",
);
const temporaryProjects = new Set<string>();

function project(): string {
  const root = mkdtempSync(path.join(tmpdir(), "build-runner-parity-"));
  temporaryProjects.add(root);
  mkdirSync(path.join(root, "build-pack"), { recursive: true });
  return root;
}

afterEach(() => {
  for (const root of temporaryProjects)
    rmSync(root, { recursive: true, force: true });
  temporaryProjects.clear();
});

function run(root: string, args: string[]) {
  return spawnSync(process.execPath, [RUNNER, `--root=${root}`, ...args], {
    encoding: "utf8",
  });
}

function capabilities() {
  return {
    schema_version: 1,
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
}

function state(contextFile = "source.md") {
  return {
    schema_version: 1,
    mode: "mvp",
    capabilities_file: "build-pack/capabilities.json",
    source_authority: {
      build_intent_summary: "Exercise TypeScript parity boundaries",
      grommet_review: { status: "approved" },
      approved_sources: ["source.md"],
      contradictions: [],
    },
    automation_authority: {
      publication: { enabled: false, destinations: [] },
    },
    tasks: [
      {
        id: "T-001",
        title: "Parity boundary",
        status: "ready",
        dependencies: [],
        risk: "low",
        source_changes: false,
        context_files: [contextFile],
        requirement_sources: ["source.md"],
        validation: [
          {
            name: "focused",
            tier: "task",
            kind: "command",
            location: "local",
            argv: [process.execPath, "-e", "process.exit(0)"],
          },
        ],
      },
    ],
  };
}

test("strict JSON rejects invalid UTF-8, non-JSON whitespace, and duplicate prototype keys", () => {
  const cases: Array<[Buffer, RegExp]> = [
    [Buffer.from([0xff]), /invalid UTF-8/],
    [Buffer.from('{"schema_version":\u00a02}'), /invalid JSON/],
    [
      Buffer.from('{"__proto__":1,"__proto__":2}'),
      /duplicate JSON key '__proto__'/,
    ],
  ];
  for (const [document, expected] of cases) {
    const root = project();
    writeFileSync(
      path.join(root, "build-pack", "execution-state.json"),
      document,
    );
    const result = run(root, ["validate"]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, expected);
  }
});

test("CLI rejects unknown options and absolute containment escapes", () => {
  const unknown = spawnSync(
    process.execPath,
    [RUNNER, "validate", "--bogus", "value"],
    { encoding: "utf8" },
  );
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /unrecognized argument: --bogus/);

  const outside = project();
  const outsideFile = path.join(outside, "outside.md");
  writeFileSync(outsideFile, "outside\n");
  const root = project();
  writeFileSync(path.join(root, "source.md"), "source\n");
  writeFileSync(
    path.join(root, "build-pack", "capabilities.json"),
    JSON.stringify(capabilities()),
  );
  const absolute = state();
  absolute.capabilities_file = outsideFile;
  writeFileSync(
    path.join(root, "build-pack", "execution-state.json"),
    JSON.stringify(absolute),
  );
  const result = run(root, ["validate"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /capabilities_file must resolve inside/);
});

test(
  "context containment rejects symlink escapes",
  { skip: process.platform === "win32" },
  () => {
    const outside = project();
    const outsideFile = path.join(outside, "outside.md");
    writeFileSync(outsideFile, "outside\n");
    const root = project();
    writeFileSync(path.join(root, "source.md"), "source\n");
    symlinkSync(outsideFile, path.join(root, "context-link.md"));
    writeFileSync(
      path.join(root, "build-pack", "capabilities.json"),
      JSON.stringify(capabilities()),
    );
    writeFileSync(
      path.join(root, "build-pack", "execution-state.json"),
      JSON.stringify(state("context-link.md")),
    );
    const result = run(root, ["validate"]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /must resolve inside the repository/);
  },
);

test("canonical digest sorts Unicode keys by Python code point order", () => {
  const root = project();
  const documents = {
    "execution-state.json": { schema_version: 2, tasks: [] },
    "capabilities.json": {},
    "source-manifest.json": { schema_version: 1, "\ue000": 1, "𐀀": 2 },
    "requirements.json": { schema_version: 1, requirements: [] },
    "grommet-approval.json": { schema_version: 1, status: "pending" },
  };
  for (const [name, document] of Object.entries(documents)) {
    writeFileSync(
      path.join(root, "build-pack", name),
      JSON.stringify(document),
    );
  }
  const result = run(root, ["seal-plan"]);
  assert.equal(result.status, 0, result.stderr);
  const actual = JSON.parse(result.stdout).result.candidate_digest;
  const canonical =
    '{"manifest":{"schema_version":1,"\\ue000":1,"\\ud800\\udc00":2},"requirements":{"requirements":[],"schema_version":1},"task_plan":[]}';
  const expected = createHash("sha256").update(canonical).digest("hex");
  assert.equal(actual, expected);
});

test(
  "Git fingerprints accept astral UTF-8 paths and fail closed on invalid paths",
  { skip: process.platform === "win32" },
  () => {
    const root = project();
    writeFileSync(path.join(root, "source.md"), "source\n");
    writeFileSync(path.join(root, "astral-𐀀.txt"), "unicode\n");
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: root }).status, 0);
    const executionState = state();
    executionState.tasks[0].status = "in_progress";
    writeFileSync(
      path.join(root, "build-pack", "capabilities.json"),
      JSON.stringify(capabilities()),
    );
    writeFileSync(
      path.join(root, "build-pack", "execution-state.json"),
      JSON.stringify(executionState),
    );
    let result = run(root, ["verify", "T-001"]);
    assert.equal(result.status, 0, result.stderr);

    executionState.tasks[0].status = "in_progress";
    writeFileSync(
      path.join(root, "build-pack", "execution-state.json"),
      JSON.stringify(executionState),
    );
    const invalidPath = Buffer.concat([
      Buffer.from(`${root}${path.sep}`),
      Buffer.from([0xff]),
    ]);
    writeFileSync(invalidPath, "invalid filename\n");
    result = run(root, ["verify", "T-001"]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /non-UTF-8 path/);
  },
);
