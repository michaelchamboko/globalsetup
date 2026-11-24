#!/usr/bin/env node
/** Exercise the same BuildRunner contract against three language-shaped repositories. */
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const RUNNER = path.join(ROOT, "scripts", "build-runner.ts");
const PROFILES: Record<string, readonly [string, string]> = {
  python: [
    "src/account_service.py",
    "def find_account(account_id):\n    return account_id\n",
  ],
  typescript: [
    "src/accountService.ts",
    "export const findAccount = (accountId: string) => accountId;\n",
  ],
  go: [
    "account_service.go",
    "package account\n\nfunc FindAccount(accountID string) string { return accountID }\n",
  ],
};
function run(argv: readonly string[], cwd?: string): string {
  const result = spawnSync(argv[0], argv.slice(1), { cwd, encoding: "utf8" });
  if (result.error || result.status !== 0)
    throw new Error(
      (
        result.stderr ||
        result.stdout ||
        result.error?.message ||
        "command failed"
      ).trim(),
    );
  return result.stdout;
}
function write(file: string, content: string): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content, "utf8");
}
function runner(project: string, ...args: string[]): Record<string, any> {
  const payload = JSON.parse(
    run([process.execPath, RUNNER, "--root", project, ...args]),
  );
  if (payload.ok !== true) throw new Error(JSON.stringify(payload));
  return payload;
}
function evaluateProfile(
  root: string,
  profile: string,
  code: readonly [string, string],
): Record<string, unknown> {
  const project = path.join(root, profile);
  mkdirSync(project);
  run(["git", "init", "--quiet", project]);
  write(path.join(project, ".gitignore"), ".gitnexus/\n");
  write(path.join(project, code[0]), code[1]);
  write(
    path.join(project, "build-pack", "tasks", "T-001.md"),
    `# T-001 ${profile} contract check\n`,
  );
  write(
    path.join(project, "docs", "approved-prd.md"),
    `# Approved ${profile} PRD\n`,
  );
  write(
    path.join(
      project,
      ".agents",
      "skills",
      "fresh-context-execution",
      "SKILL.md",
    ),
    "---\nname: fresh-context-execution\ndescription: Use when executing one approved task.\n---\n",
  );
  write(
    path.join(project, ".gitnexus", "run.cjs"),
    "const command = process.argv[2];\nif (command === 'status') { console.log('Status: up-to-date'); process.exit(0); }\nif (command === 'analyze') { console.log('Indexed'); process.exit(0); }\nprocess.exit(2);\n",
  );
  write(
    path.join(project, "build-pack", "capabilities.json"),
    `${JSON.stringify({ schema_version: 1, node: { required: true, minimum_version: "22.20" }, graph: { required: true, provider: "gitnexus", license: { spdx: "PolyForm-Noncommercial-1.0.0", usage: "noncommercial", acknowledged: true }, status_argv: ["node", ".gitnexus/run.cjs", "status"], sync_argv: ["node", ".gitnexus/run.cjs", "analyze", "--skip-agents-md", "--skip-skills"] } }, null, 2)}\n`,
  );
  const contextFiles = [
    "docs/approved-prd.md",
    code[0].replaceAll("\\", "/"),
    "build-pack/tasks/T-001.md",
    ".agents/skills/fresh-context-execution/SKILL.md",
  ];
  const state = {
    schema_version: 1,
    mode: "mvp",
    capabilities_file: "build-pack/capabilities.json",
    source_authority: {
      build_intent_summary: `Validate the approved ${profile} repository contract.`,
      approved_sources: ["docs/approved-prd.md"],
      contradictions: [],
      grommet_review: {
        status: "approved",
        summary: "The task matches the approved source.",
      },
    },
    automation_authority: { publication: { enabled: false, destinations: [] } },
    tasks: [
      {
        id: "T-001",
        title: `Validate the ${profile} repository contract`,
        status: "ready",
        dependencies: [],
        risk: "low",
        source_changes: false,
        requirement_sources: ["docs/approved-prd.md"],
        context_files: contextFiles,
        validation: [
          {
            name: "focused contract check",
            tier: "task",
            kind: "command",
            location: "local",
            argv: [process.execPath, "-e", "console.log('portable')"],
          },
        ],
        evidence: [],
      },
    ],
  };
  write(
    path.join(project, "build-pack", "execution-state.json"),
    `${JSON.stringify(state, null, 2)}\n`,
  );
  runner(project, "validate");
  const selected = runner(project, "next").result as {
    context_files: string[];
  };
  if (JSON.stringify(selected.context_files) !== JSON.stringify(contextFiles))
    throw new Error(`${profile}: context routing changed`);
  runner(project, "start", "T-001");
  runner(project, "verify", "T-001");
  const completed = runner(project, "complete", "T-001").result as {
    status: string;
    graph_evidence: { status: string };
  };
  return {
    profile,
    status: completed.status,
    context_files: contextFiles,
    graph_status: completed.graph_evidence.status,
  };
}
const temporary = mkdtempSync(path.join(tmpdir(), "globalsetup-portability-"));
try {
  const profiles = Object.entries(PROFILES).map(([name, code]) =>
    evaluateProfile(temporary, name, code),
  );
  console.log(JSON.stringify({ contract_portable: true, profiles }, null, 2));
} catch (error) {
  console.error(
    JSON.stringify(
      {
        contract_portable: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
