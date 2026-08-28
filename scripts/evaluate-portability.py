#!/usr/bin/env python3
"""Exercise the same BuildRunner contract against three language-shaped repositories."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RUNNER = ROOT / "scripts" / "build-runner.py"
PROFILES = {
    "python": ("src/account_service.py", "def find_account(account_id):\n    return account_id\n"),
    "typescript": ("src/accountService.ts", "export const findAccount = (accountId: string) => accountId;\n"),
    "go": ("account_service.go", "package account\n\nfunc FindAccount(accountID string) string { return accountID }\n"),
}


def run(argv: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(argv, cwd=cwd, text=True, encoding="utf-8", errors="replace", capture_output=True)
    if result.returncode != 0:
        raise RuntimeError((result.stderr or result.stdout).strip())
    return result


def runner(project: Path, *args: str) -> dict[str, object]:
    result = run([sys.executable, str(RUNNER), "--root", str(project), *args])
    payload = json.loads(result.stdout)
    if payload.get("ok") is not True:
        raise RuntimeError(result.stdout)
    return payload


def evaluate_profile(root: Path, profile: str, code: tuple[str, str]) -> dict[str, object]:
    project = root / profile
    project.mkdir()
    run(["git", "init", "--quiet", str(project)])
    (project / ".gitignore").write_text(".gitnexus/\n", encoding="utf-8")

    code_path = project / code[0]
    code_path.parent.mkdir(parents=True, exist_ok=True)
    code_path.write_text(code[1], encoding="utf-8")
    task_card = project / "build-pack" / "tasks" / "T-001.md"
    task_card.parent.mkdir(parents=True)
    task_card.write_text(f"# T-001 {profile} contract check\n", encoding="utf-8")
    skill = project / ".agents" / "skills" / "fresh-context-execution" / "SKILL.md"
    skill.parent.mkdir(parents=True)
    skill.write_text(
        "---\nname: fresh-context-execution\ndescription: Use when executing one approved task.\n---\n",
        encoding="utf-8",
    )

    local_runner = project / ".gitnexus" / "run.cjs"
    local_runner.parent.mkdir()
    local_runner.write_text(
        "const command = process.argv[2];\n"
        "if (command === 'status') { console.log('Status: up-to-date'); process.exit(0); }\n"
        "if (command === 'analyze') { console.log('Indexed'); process.exit(0); }\n"
        "process.exit(2);\n",
        encoding="utf-8",
    )
    capabilities = {
        "schema_version": 1,
        "python": {"required": True, "minimum_version": "3.10"},
        "graph": {
            "required": True,
            "provider": "gitnexus",
            "license": {
                "spdx": "PolyForm-Noncommercial-1.0.0",
                "usage": "noncommercial",
                "acknowledged": True,
            },
            "status_argv": ["node", ".gitnexus/run.cjs", "status"],
            "sync_argv": ["node", ".gitnexus/run.cjs", "analyze", "--skip-agents-md", "--skip-skills"],
        },
    }
    (project / "build-pack" / "capabilities.json").write_text(
        json.dumps(capabilities, indent=2), encoding="utf-8"
    )
    context_files = [
        code[0].replace("\\", "/"),
        "build-pack/tasks/T-001.md",
        ".agents/skills/fresh-context-execution/SKILL.md",
    ]
    state = {
        "schema_version": 1,
        "mode": "mvp",
        "capabilities_file": "build-pack/capabilities.json",
        "tasks": [
            {
                "id": "T-001",
                "title": f"Validate the {profile} repository contract",
                "status": "ready",
                "dependencies": [],
                "risk": "low",
                "source_changes": False,
                "context_files": context_files,
                "validation": [
                    {
                        "name": "focused contract check",
                        "tier": "task",
                        "kind": "command",
                        "location": "local",
                        "argv": [sys.executable, "-c", "print('portable')"],
                    }
                ],
                "evidence": [],
            }
        ],
    }
    (project / "build-pack" / "execution-state.json").write_text(
        json.dumps(state, indent=2), encoding="utf-8"
    )

    runner(project, "validate")
    selected = runner(project, "next")["result"]
    if selected["context_files"] != context_files:
        raise RuntimeError(f"{profile}: context routing changed")
    runner(project, "start", "T-001")
    runner(project, "verify", "T-001")
    completed = runner(project, "complete", "T-001")["result"]
    return {
        "profile": profile,
        "status": completed["status"],
        "context_files": context_files,
        "graph_status": completed["graph_evidence"]["status"],
    }


def main() -> int:
    try:
        with tempfile.TemporaryDirectory(prefix="globalsetup-portability-") as temp:
            profiles = [evaluate_profile(Path(temp), name, code) for name, code in PROFILES.items()]
    except (OSError, RuntimeError, json.JSONDecodeError) as exc:
        print(json.dumps({"contract_portable": False, "error": str(exc)}, indent=2), file=sys.stderr)
        return 1
    print(json.dumps({"contract_portable": True, "profiles": profiles}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
