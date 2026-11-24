import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import test from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const NODE = process.execPath;
const MATT_SKILLS = [
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
];

function run(
  argv: readonly string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
) {
  return spawnSync(argv[0], argv.slice(1), {
    cwd: options.cwd,
    env: options.env,
    encoding: "utf8",
  });
}
function temporary(): { root: string; cleanup: () => void } {
  const root = mkdtempSync(path.join(tmpdir(), "globalsetup-test-"));
  return {
    root,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}
function write(file: string, content: string | Buffer): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
}
function executable(file: string, content: string): void {
  write(file, content);
  chmodSync(file, 0o755);
}
function fakeTools(bin: string, gitnexusExit = 0): NodeJS.ProcessEnv {
  const npxCli = `const fs = require('node:fs'); const path = require('node:path');
const skills = ${JSON.stringify(MATT_SKILLS)};
for (const skill of skills) { const dir = path.join('.agents','skills',skill); fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(path.join(dir,'SKILL.md'),'---\\nname: '+skill+'\\n---\\n'); }
fs.writeFileSync('skills-lock.json', JSON.stringify({version:2,skills:Object.fromEntries(skills.map((skill)=>[skill,{source:'mattpocock/skills'}]))},null,2)+'\\n');
`;
  const gitnexusCli = `const fs = require('node:fs'); const path = require('node:path');
if (${gitnexusExit} !== 0) { console.error('forced analyze failure'); process.exit(${gitnexusExit}); }
fs.mkdirSync('.gitnexus',{recursive:true}); fs.writeFileSync(path.join('.gitnexus','run.cjs'), "if(process.argv[2]==='status'){console.log('Status: up-to-date');process.exit(0)};if(process.argv[2]==='analyze'){process.exit(0)};process.exit(2);\\n");
`;
  if (process.platform === "win32") {
    const npmRoot = path.join(bin, "global-node-modules");
    write(path.join(bin, "npx.cmd"), "@exit /b 0\r\n");
    write(path.join(bin, "npm.cmd"), "@exit /b 0\r\n");
    write(path.join(bin, "gitnexus.cmd"), "@exit /b 0\r\n");
    write(path.join(bin, "node_modules", "npm", "bin", "npx-cli.js"), npxCli);
    write(
      path.join(bin, "node_modules", "npm", "bin", "npm-cli.js"),
      `if (process.argv.slice(2).join(' ') === 'root --global') console.log(${JSON.stringify(npmRoot)}); else process.exit(2);\n`,
    );
    write(
      path.join(npmRoot, "gitnexus", "package.json"),
      JSON.stringify({ bin: { gitnexus: "cli.js" } }),
    );
    write(path.join(npmRoot, "gitnexus", "cli.js"), gitnexusCli);
  } else {
    executable(
      path.join(bin, "npx"),
      `#!/usr/bin/env node
${npxCli}`,
    );
    executable(
      path.join(bin, "gitnexus"),
      `#!/usr/bin/env node
${gitnexusCli}`,
    );
  }
  return {
    ...process.env,
    PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}`,
  };
}
const HAS_POWERSHELL =
  run(["pwsh", "-NoProfile", "-Command", "exit 0"]).status === 0;
const HAS_CROSS_DEVICE_TMP =
  process.platform !== "win32" &&
  existsSync("/dev/shm") &&
  statSync("/dev/shm").dev !== statSync(tmpdir()).dev;
function filesBelow(root: string): string[] {
  if (!existsSync(root)) return [];
  const found: string[] = [];
  function visit(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else found.push(path.relative(root, full).replaceAll("\\", "/"));
    }
  }
  visit(root);
  return found.sort();
}
function markdownFiles(roots: string[]): string[] {
  return roots.flatMap((relative) => {
    const full = path.join(REPO_ROOT, relative);
    if (!existsSync(full)) return [];
    if (statSync(full).isFile()) return [full];
    return filesBelow(full)
      .filter((file) => file.endsWith(".md"))
      .map((file) => path.join(full, file));
  });
}

test("root contract is a small model-agnostic router", () => {
  const agents = readFileSync(path.join(REPO_ROOT, "AGENTS.md"), "utf8");
  assert.ok(agents.split("\n").length <= 140);
  for (const forbidden of [
    "task-master",
    "Sequential Thinking",
    "Caveman",
    "45% capacity",
  ])
    assert.ok(!agents.includes(forbidden));
});

test("setup preflight failure preserves the target", () => {
  const temp = temporary();
  try {
    const target = path.join(temp.root, "target");
    mkdirSync(target);
    write(path.join(target, "AGENTS.md"), "operator-owned\n");
    const result = run(
      [
        NODE,
        path.join(REPO_ROOT, "scripts", "setup-globalsetup.ts"),
        "--target",
        target,
        "--acknowledge-gitnexus-license",
      ],
      { env: { PATH: path.join(temp.root, "missing-tools") } },
    );
    assert.equal(result.status, 2, result.stdout + result.stderr);
    assert.match(result.stderr, /preflight failed/);
    assert.equal(
      readFileSync(path.join(target, "AGENTS.md"), "utf8"),
      "operator-owned\n",
    );
    assert.deepEqual(readdirSync(target), ["AGENTS.md"]);
  } finally {
    temp.cleanup();
  }
});

test("setup failure rolls back every target mutation", () => {
  const temp = temporary();
  try {
    const target = path.join(temp.root, "target"),
      bin = path.join(temp.root, "bin");
    mkdirSync(path.join(target, ".agents"), { recursive: true });
    mkdirSync(bin);
    write(path.join(target, "AGENTS.md"), "operator-owned\n");
    write(path.join(target, ".agents", "custom.md"), "keep\n");
    write(path.join(target, ".gitignore"), "operator-only/\n");
    const result = run(
      [
        NODE,
        path.join(REPO_ROOT, "scripts", "setup-globalsetup.ts"),
        "--target",
        target,
        "--acknowledge-gitnexus-license",
      ],
      { env: fakeTools(bin, 9) },
    );
    assert.equal(result.status, 2, result.stdout + result.stderr);
    assert.match(result.stderr, /rolled back/);
    assert.deepEqual(filesBelow(target), [
      ".agents/custom.md",
      ".gitignore",
      "AGENTS.md",
    ]);
    assert.ok(!existsSync(path.join(target, ".git")));
  } finally {
    temp.cleanup();
  }
});

test(
  "cross-device setup failure restores existing files exactly",
  { skip: !HAS_CROSS_DEVICE_TMP },
  () => {
    const temp = temporary(),
      target = mkdtempSync("/dev/shm/globalsetup-cross-device-"),
      bin = path.join(temp.root, "bin");
    try {
      mkdirSync(path.join(target, ".agents"), { recursive: true });
      mkdirSync(bin);
      write(path.join(target, "AGENTS.md"), "operator-owned\n");
      write(path.join(target, ".agents", "custom.md"), "keep\n");
      symlinkSync("custom.md", path.join(target, ".agents", "custom-link"));
      write(path.join(target, ".gitignore"), "operator-only/\n");
      const result = run(
        [
          NODE,
          path.join(REPO_ROOT, "scripts", "setup-globalsetup.ts"),
          "--target",
          target,
          "--acknowledge-gitnexus-license",
        ],
        { env: fakeTools(bin, 9) },
      );
      assert.equal(result.status, 2, result.stdout + result.stderr);
      assert.match(result.stderr, /target changes were rolled back/);
      assert.equal(
        readFileSync(path.join(target, "AGENTS.md"), "utf8"),
        "operator-owned\n",
      );
      assert.equal(
        readFileSync(path.join(target, ".agents", "custom.md"), "utf8"),
        "keep\n",
      );
      assert.equal(
        readlinkSync(path.join(target, ".agents", "custom-link")),
        "custom.md",
      );
      assert.equal(
        readFileSync(path.join(target, ".gitignore"), "utf8"),
        "operator-only/\n",
      );
      assert.deepEqual(filesBelow(target), [
        ".agents/custom-link",
        ".agents/custom.md",
        ".gitignore",
        "AGENTS.md",
      ]);
    } finally {
      temp.cleanup();
      rmSync(target, { recursive: true, force: true });
    }
  },
);

test("rollback restores hooks, executable mode, index, and backup state", () => {
  const temp = temporary();
  try {
    const target = path.join(temp.root, "target"),
      bin = path.join(temp.root, "bin"),
      hook = path.join(target, ".githooks", "pre-commit");
    mkdirSync(target);
    mkdirSync(bin);
    run(["git", "-C", target, "init", "--quiet"]);
    run([
      "git",
      "-C",
      target,
      "config",
      "--local",
      "core.hooksPath",
      ".githooks",
    ]);
    write(path.join(target, "AGENTS.md"), "operator-owned\n");
    write(hook, "#!/bin/sh\necho operator\n");
    chmodSync(hook, 0o700);
    write(
      path.join(target, ".githooks", "pre-commit.user"),
      "#!/bin/sh\necho prior-user-hook\n",
    );
    write(path.join(target, ".gitnexus", "operator-index"), "preserve\n");
    const result = run(
      [
        NODE,
        path.join(REPO_ROOT, "scripts", "setup-globalsetup.ts"),
        "--target",
        target,
        "--acknowledge-gitnexus-license",
      ],
      { env: fakeTools(bin, 9) },
    );
    assert.equal(result.status, 2, result.stdout + result.stderr);
    assert.equal(
      readFileSync(path.join(target, "AGENTS.md"), "utf8"),
      "operator-owned\n",
    );
    assert.equal(readFileSync(hook, "utf8"), "#!/bin/sh\necho operator\n");
    assert.equal(statSync(hook).mode & 0o777, 0o700);
    assert.equal(
      readFileSync(path.join(target, ".githooks", "pre-commit.user"), "utf8"),
      "#!/bin/sh\necho prior-user-hook\n",
    );
    assert.equal(
      readFileSync(path.join(target, ".gitnexus", "operator-index"), "utf8"),
      "preserve\n",
    );
    assert.equal(
      run([
        "git",
        "-C",
        target,
        "config",
        "--local",
        "--get",
        "core.hooksPath",
      ]).stdout.trim(),
      ".githooks",
    );
    assert.ok(!existsSync(path.join(target, ".globalsetup-backups")));
    assert.ok(!existsSync(path.join(target, "skills-lock.json")));
  } finally {
    temp.cleanup();
  }
});

test("successful setup installs official skills and preserves unrelated custom skills", () => {
  const temp = temporary();
  try {
    const target = path.join(temp.root, "target"),
      bin = path.join(temp.root, "bin");
    mkdirSync(path.join(target, ".agents", "skills", "custom"), {
      recursive: true,
    });
    mkdirSync(bin);
    write(
      path.join(target, ".agents", "skills", "custom", "SKILL.md"),
      "---\nname: custom\n---\n",
    );
    write(
      path.join(target, ".agents", "skills", "tdd", "SKILL.md"),
      "---\nname: tdd\ndescription: Use when the active task calls for test-driven implementation of a bounded behavior.\nargument-hint: [feature description]\n---\n\nExecute strict Test-Driven Development (TDD) for the given feature:\n\n1. **Red**: Write one failing test for the next smallest behavior. Assert specific values and run it to confirm the expected failure.\n2. **Green**: Write the minimum code that makes the test pass.\n3. **Refactor**: Remove relevant duplication without changing behavior. Write code that reads like the surrounding code: match its comment density, naming, structure, and idiom. Re-run the focused checks.\n4. Repeat only while the active task has unproved acceptance criteria.\n",
    );
    write(
      path.join(target, ".gitnexusrc"),
      `${JSON.stringify({ indexOnly: false, customSetting: "preserve" }, null, 2)}\n`,
    );
    write(
      path.join(target, "package.json"),
      `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`,
    );
    const env = fakeTools(bin);
    const dryRun = run(
      [
        NODE,
        path.join(REPO_ROOT, "scripts", "setup-globalsetup.ts"),
        "--target",
        target,
        "--dry-run",
        "--acknowledge-gitnexus-license",
      ],
      { env },
    );
    assert.equal(dryRun.status, 0, dryRun.stdout + dryRun.stderr);
    assert.equal(
      JSON.parse(readFileSync(path.join(target, ".gitnexusrc"), "utf8"))
        .indexOnly,
      false,
    );
    assert.ok(!existsSync(path.join(target, "AGENTS.md")));
    const result = run(
      [
        NODE,
        path.join(REPO_ROOT, "scripts", "setup-globalsetup.ts"),
        "--target",
        target,
        "--acknowledge-gitnexus-license",
      ],
      { env },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    for (const skill of MATT_SKILLS)
      assert.ok(
        existsSync(path.join(target, ".agents", "skills", skill, "SKILL.md")),
        skill,
      );
    assert.ok(
      existsSync(path.join(target, ".agents", "skills", "custom", "SKILL.md")),
    );
    assert.ok(existsSync(path.join(target, "skills-lock.json")));
    assert.ok(
      existsSync(
        path.join(target, ".agents", "skills", "globalsetup-tdd", "SKILL.md"),
      ),
    );
    assert.ok(
      existsSync(
        path.join(target, ".agents", "rules", "matt-pocock-workflow.md"),
      ),
    );
    for (const relative of [
      "AGENTS.md",
      ".gitnexusrc",
      "scripts/build-runner.mts",
      "scripts/node-package-command.mts",
      "scripts/pre-tool-hook.ps1",
      "scripts/repository-guard.mts",
      ".githooks/pre-commit",
      "build-pack/capabilities.json",
      "build-pack/execution-state.json",
    ])
      assert.ok(existsSync(path.join(target, relative)), relative);
    const config = JSON.parse(
      readFileSync(path.join(target, ".gitnexusrc"), "utf8"),
    );
    assert.equal(config.indexOnly, true);
    assert.equal(config.customSetting, "preserve");
    for (const command of [
      [NODE, path.join(target, "scripts", "build-runner.mts"), "--help"],
      [
        NODE,
        path.join(target, "scripts", "repository-guard.mts"),
        "--root",
        target,
        "--staged",
      ],
      [
        NODE,
        path.join(target, "scripts", "repository-text.mts"),
        "--root",
        target,
      ],
    ]) {
      const installed = run(command);
      assert.equal(installed.status, 0, installed.stdout + installed.stderr);
    }
    const statePath = path.join(target, "build-pack", "execution-state.json"),
      state = JSON.parse(readFileSync(statePath, "utf8"));
    state.operator_marker = "preserve-on-rerun";
    write(statePath, `${JSON.stringify(state, null, 2)}\n`);
    const rerun = run(
      [
        NODE,
        path.join(REPO_ROOT, "scripts", "setup-globalsetup.ts"),
        "--target",
        target,
        "--acknowledge-gitnexus-license",
      ],
      { env },
    );
    assert.equal(rerun.status, 0, rerun.stdout + rerun.stderr);
    assert.equal(
      JSON.parse(readFileSync(statePath, "utf8")).operator_marker,
      "preserve-on-rerun",
    );
    assert.equal(
      run([
        "git",
        "-C",
        target,
        "config",
        "--local",
        "--get",
        "core.hooksPath",
      ]).stdout.trim(),
      ".githooks",
    );
    write(
      path.join(target, ".github", "workflows", "build.yml"),
      "name: prohibited\n",
    );
    run(["git", "-C", target, "add", ".github/workflows/build.yml"]);
    const guard = run([
      NODE,
      path.join(target, "scripts", "repository-guard.mts"),
      "--root",
      target,
      "--staged",
    ]);
    assert.equal(guard.status, 1, guard.stdout + guard.stderr);
    assert.match(guard.stderr, /GitHub Actions/);
    const clean = run([
      NODE,
      path.join(target, "scripts", "repository-text.mts"),
      "--root",
      target,
    ]);
    assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  } finally {
    temp.cleanup();
  }
});

test("setup refuses to overwrite a custom upstream-named skill before mutation", () => {
  const temp = temporary();
  try {
    const target = path.join(temp.root, "target"),
      bin = path.join(temp.root, "bin");
    mkdirSync(path.join(target, ".agents", "skills", "code-review"), {
      recursive: true,
    });
    mkdirSync(bin);
    write(path.join(target, "AGENTS.md"), "operator-owned\n");
    write(
      path.join(target, ".agents", "skills", "code-review", "SKILL.md"),
      "custom\n",
    );
    const result = run(
      [
        NODE,
        path.join(REPO_ROOT, "scripts", "setup-globalsetup.ts"),
        "--target",
        target,
        "--acknowledge-gitnexus-license",
      ],
      { env: fakeTools(bin) },
    );
    assert.equal(result.status, 2);
    assert.match(result.stderr, /refusing to overwrite existing custom skill/);
    assert.equal(
      readFileSync(path.join(target, "AGENTS.md"), "utf8"),
      "operator-owned\n",
    );
  } finally {
    temp.cleanup();
  }
});

test("repository text validator rejects corruption, invalid UTF-8, and accepts CRLF", () => {
  const temp = temporary();
  try {
    write(
      path.join(temp.root, "broken.md"),
      `bad ${String.fromCodePoint(0x00e2, 0x20ac, 0x201d)} text\ncontrol \x08 byte\n`,
    );
    write(path.join(temp.root, "invalid.md"), Buffer.from([0x66, 0x80, 0x0a]));
    write(path.join(temp.root, "clean.md"), "clean\r\ntext\r\n");
    const result = run([
      NODE,
      path.join(REPO_ROOT, "scripts", "repository-text.mts"),
      "--root",
      temp.root,
    ]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /mojibake/);
    assert.match(result.stderr, /control character/);
    assert.match(result.stderr, /invalid UTF-8/);
    assert.doesNotMatch(result.stderr, /clean\.md/);
  } finally {
    temp.cleanup();
  }
});

test("repository text validator rejects broken local Markdown links", () => {
  const temp = temporary();
  try {
    write(
      path.join(temp.root, "guide.md"),
      "Read [the contract](missing.md).\n",
    );
    const result = run([
      NODE,
      path.join(REPO_ROOT, "scripts", "repository-text.mts"),
      "--root",
      temp.root,
    ]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /missing local reference/);
  } finally {
    temp.cleanup();
  }
});

test("repository text is UTF-8 and reference clean", () => {
  const result = run([
    NODE,
    path.join(REPO_ROOT, "scripts", "repository-text.mts"),
    "--root",
    REPO_ROOT,
  ]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test(
  "safety hook canonicalizes guarded paths",
  { skip: !HAS_POWERSHELL },
  () => {
    for (const target of [
      ".github/workflows/build.yml",
      path.join(REPO_ROOT, ".github", "workflows", "build.yml"),
      "../outside.txt",
    ]) {
      const result = run([
        "pwsh",
        "-NoProfile",
        "-File",
        path.join(REPO_ROOT, "scripts", "pre-tool-hook.ps1"),
        "-ActionType",
        "Write",
        "-TargetFile",
        target,
        "-DryRun",
      ]);
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout + result.stderr, /DRY_RUN_RESULT=BLOCKED/);
    }
  },
);

test("bootstrap generates machine-readable execution state", () => {
  for (const name of ["generate-build-pack.ps1", "generate-build-pack.sh"]) {
    const text = readFileSync(path.join(REPO_ROOT, "scripts", name), "utf8");
    assert.match(text, /execution-state\.json/);
    assert.match(text, /capabilities\.json/);
  }
});
test("machine contracts publish JSON schemas", () => {
  for (const name of [
    "execution-state.schema.json",
    "capabilities.schema.json",
  ]) {
    const schema = JSON.parse(
      readFileSync(
        path.join(REPO_ROOT, "templates", "governance", name),
        "utf8",
      ),
    );
    assert.equal(
      schema.$schema,
      "https://json-schema.org/draft/2020-12/schema",
    );
    assert.equal(schema.type, "object");
  }
});

test(
  "PowerShell bootstrap installs a runnable contract",
  { skip: !HAS_POWERSHELL },
  () => {
    const temp = temporary();
    try {
      const target = path.join(temp.root, "target"),
        bin = path.join(temp.root, "bin");
      mkdirSync(target);
      mkdirSync(bin);
      const result = run(
        [
          "pwsh",
          "-NoProfile",
          "-File",
          path.join(REPO_ROOT, "scripts", "setup-globalsetup.ps1"),
          "-TargetDir",
          target,
          "-AcknowledgeGitNexusLicense",
        ],
        { env: fakeTools(bin) },
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.ok(existsSync(path.join(target, "scripts", "build-runner.mts")));
    } finally {
      temp.cleanup();
    }
  },
);

test("example execution state is valid", () => {
  const temp = temporary();
  try {
    cpSync(
      path.join(REPO_ROOT, "examples", "post-prd-build-pack"),
      path.join(temp.root, "build-pack"),
      { recursive: true },
    );
    cpSync(
      path.join(REPO_ROOT, "skills"),
      path.join(temp.root, ".agents", "skills"),
      { recursive: true },
    );
    cpSync(
      path.join(REPO_ROOT, "rules"),
      path.join(temp.root, ".agents", "rules"),
      { recursive: true },
    );
    const result = run([
      NODE,
      path.join(REPO_ROOT, "scripts", "build-runner.mts"),
      "--root",
      temp.root,
      "validate",
    ]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  } finally {
    temp.cleanup();
  }
});
test("three-profile portability evaluation", () => {
  const result = run([
    NODE,
    path.join(REPO_ROOT, "scripts", "evaluate-portability.ts"),
  ]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.contract_portable, true);
  assert.deepEqual(
    payload.profiles.map((item: { profile: string }) => item.profile).sort(),
    ["go", "python", "typescript"],
  );
});

test("obsolete orchestrators are absent from installed contract", () => {
  const combined = markdownFiles([
    "AGENTS.md",
    "docs",
    "rules",
    "skills",
    "templates",
    "reviewers",
    "safeguards",
  ])
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  for (const forbidden of [
    "CodeGraph",
    "task-master",
    "Sequential Thinking",
    "Caveman",
    "45% capacity",
  ])
    assert.ok(!combined.includes(forbidden), forbidden);
});
test("graph intelligence is mandatory and GitNexus-only", () => {
  const capabilities = readFileSync(
    path.join(
      REPO_ROOT,
      "templates",
      "governance",
      "capabilities-template.json",
    ),
    "utf8",
  );
  assert.match(capabilities, /"required": true/);
  assert.match(capabilities, /"provider": "gitnexus"/);
  assert.match(capabilities, /"usage": "noncommercial"/);
  assert.doesNotMatch(capabilities.toLowerCase(), /codegraph/);
});
test("no default GitHub Actions workflows exist", () => {
  const directory = path.join(REPO_ROOT, ".github", "workflows");
  const workflows = existsSync(directory)
    ? readdirSync(directory).filter((name) => /\.ya?ml$/.test(name))
    : [];
  assert.deepEqual(workflows, []);
});
test("GitHub Actions are prohibited without an exception path", () => {
  const combined = markdownFiles([
    "AGENTS.md",
    "README.md",
    "SECURITY.md",
    "docs",
    "rules",
    "skills",
    "templates",
    "safeguards",
  ])
    .map((file) => readFileSync(file, "utf8").toLowerCase())
    .join("\n");
  for (const forbidden of [
    "github actions exception",
    "explicitly approves actions",
    "explicitly approves a workflow",
    "github actions need explicit",
  ])
    assert.ok(!combined.includes(forbidden), forbidden);
});
test("detailed rules are loaded on demand", () => {
  for (const name of readdirSync(path.join(REPO_ROOT, "rules")))
    if (name.endsWith(".md"))
      assert.doesNotMatch(
        readFileSync(path.join(REPO_ROOT, "rules", name), "utf8"),
        /alwaysApply: true/,
        name,
      );
});
test("optional Ponytail skills do not claim lifecycle authority", () => {
  const paths = [
    "rules/ponytail.md",
    "skills/ponytail/SKILL.md",
    "skills/ponytail-review/SKILL.md",
    "skills/ponytail-audit/SKILL.md",
    "skills/ponytail-debt/SKILL.md",
    "skills/ponytail-done/SKILL.md",
  ];
  const combined = paths
    .map((file) =>
      readFileSync(path.join(REPO_ROOT, file), "utf8").toLowerCase(),
    )
    .join("\n");
  for (const forbidden of [
    "runs automatically",
    "mandatory completion gate",
    "before every task card",
    "at the start of every new context",
  ])
    assert.ok(!combined.includes(forbidden), forbidden);
});
