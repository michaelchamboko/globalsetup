#!/usr/bin/env python3
"""Install GlobalSetup into one target repository after a fail-fast preflight."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path


AGENT_FOLDERS = ("rules", "skills", "templates", "reviewers", "safeguards")
SCRIPT_NAMES = (
    "generate-build-pack.sh",
    "generate-build-pack.ps1",
    "validate-build-pack.sh",
    "validate-build-pack.ps1",
    "build-runner.py",
    "build-runner.ps1",
    "build-runner.sh",
    "pre-tool-hook.ps1",
    "repository-guard.py",
    "repository-text.py",
)
BUILD_PACK_FILES = (
    ("prd/confirmed-prd-template.md", "00-confirmed-prd-summary.md"),
    ("prd/prd-review-checklist.md", "01-prd-review-checklist.md"),
    ("build-requirements/build-brief-template.md", "02-build-brief.md"),
    ("build-requirements/implementation-contract-template.md", "03-implementation-contract.md"),
    ("architecture/architecture-discovery-template.md", "04-existing-codebase-discovery.md"),
    ("architecture/architecture-map-template.md", "05-architecture-map.md"),
    ("contracts/database-contract-template.md", "06-database-contract.md"),
    ("contracts/api-contract-template.md", "07-api-contract.md"),
    ("contracts/ui-contract-template.md", "08-ui-contract.md"),
    ("contracts/permissions-contract-template.md", "09-permissions-contract.md"),
    ("tasks/implementation-plan-template.md", "10-implementation-plan.md"),
    ("tasks/task-graph-template.md", "11-task-graph.md"),
    ("qa/test-plan-template.md", "12-test-plan.md"),
    ("qa/review-gate-template.md", "13-review-gate.md"),
    ("qa/rollback-plan-template.md", "14-rollback-plan.md"),
    ("qa/definition-of-done-template.md", "16-definition-of-done.md"),
    ("build-plans/build-plan-index-template.md", "build-plans/01-build-plan-index.md"),
    ("build-plans/ui-ux-build-plan-template.md", "build-plans/02-ui-ux-build-plan.md"),
    ("tasks/module-plan-template.md", "module-plans/M-000-module-plan-template.md"),
    ("tasks/ui-ux-module-plan-template.md", "module-plans/M-000-ui-ux-module-plan-template.md"),
    ("governance/capabilities-template.json", "capabilities.json"),
    ("governance/execution-state-template.json", "execution-state.json"),
    ("governance/source-manifest-template.json", "source-manifest.json"),
    ("governance/requirements-template.json", "requirements.json"),
    ("governance/grommet-approval-template.json", "grommet-approval.json"),
    ("governance/capabilities.schema.json", "capabilities.schema.json"),
    ("governance/execution-state.schema.json", "execution-state.schema.json"),
    ("governance/source-manifest.schema.json", "source-manifest.schema.json"),
    ("governance/requirements.schema.json", "requirements.schema.json"),
    ("governance/grommet-approval.schema.json", "grommet-approval.schema.json"),
)


class SetupError(RuntimeError):
    pass


def run(argv: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(argv, cwd=cwd, text=True, encoding="utf-8", errors="replace", capture_output=True)
    if result.returncode != 0:
        detail = (result.stderr or result.stdout).strip()
        raise SetupError(f"command failed ({' '.join(argv)}): {detail}")
    return result


def require_command(name: str) -> str:
    command = shutil.which(name)
    if not command:
        raise SetupError(f"missing required command: {name}")
    return command


def preflight(source: Path, target: Path, install_dependencies: bool = True, license_eligible: bool = False) -> dict[str, str]:
    git = require_command("git")
    node = require_command("node")
    run([sys.executable, str(source / "scripts" / "repository-text.py"), "--root", str(source)])
    run([node, "-e", "const [a,b]=process.versions.node.split('.').map(Number);process.exit((a===22&&b>=18)||(a===24&&b>=11)||a>24?0:1)"])

    if target.exists() and not target.is_dir():
        raise SetupError(f"target is not a directory: {target}")
    gitnexus_config = target / ".gitnexusrc"
    if gitnexus_config.exists():
        try:
            config = json.loads(gitnexus_config.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise SetupError(f"existing .gitnexusrc is not valid UTF-8 JSON: {exc}") from exc
        if not isinstance(config, dict):
            raise SetupError("existing .gitnexusrc must contain a JSON object")
    if target.exists() and (target / ".git").exists():
        hooks = subprocess.run(
            [git, "-C", str(target), "config", "--local", "--get", "core.hooksPath"],
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
        )
        hooks_path = hooks.stdout.strip() if hooks.returncode == 0 else ""
        if hooks_path and hooks_path not in {".githooks", "./.githooks"}:
            raise SetupError(f"existing core.hooksPath {hooks_path!r} requires manual integration")

    gitnexus = shutil.which("gitnexus")
    npm = shutil.which("npm") or ""
    if not gitnexus:
        npm = require_command("npm")
        if install_dependencies:
            run([npm, "install", "--global", "gitnexus@1.6.10"])
            gitnexus = require_command("gitnexus")
        else:
            gitnexus = "gitnexus"
    if not license_eligible:
        raise SetupError("GitNexus is PolyForm-Noncommercial; pass --acknowledge-gitnexus-license only when this target is eligible")
    return {"git": git, "node": node, "npm": npm, "gitnexus": gitnexus}


class Journal:
    def __init__(self, target: Path, backup_root: Path):
        self.target = target
        self.backup_root = backup_root
        self.records: list[tuple[Path, Path | None]] = []

    def replace(self, source: Path, destination: Path) -> None:
        backup: Path | None = None
        if destination.exists():
            relative = destination.relative_to(self.target)
            backup = self.backup_root / relative
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(destination), str(backup))
        self.records.append((destination, backup))
        destination.parent.mkdir(parents=True, exist_ok=True)
        if source.is_dir():
            shutil.copytree(source, destination)
        else:
            shutil.copy2(source, destination)

    def snapshot_file(self, path: Path) -> None:
        if any(destination == path for destination, _ in self.records):
            return
        backup: Path | None = None
        if path.exists():
            relative = path.relative_to(self.target)
            backup = self.backup_root / relative
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, backup)
        self.records.append((path, backup))

    def rollback(self) -> None:
        for destination, backup in reversed(self.records):
            if destination.is_dir():
                shutil.rmtree(destination)
            elif destination.exists():
                destination.unlink()
            if backup and backup.exists():
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(backup), str(destination))
        parents = sorted(
            {destination.parent for destination, _ in self.records},
            key=lambda path: len(path.parts),
            reverse=True,
        )
        for parent in parents:
            while parent != self.target and parent.exists() and not any(parent.iterdir()):
                parent.rmdir()
                parent = parent.parent


def append_gitignore(target: Path, journal: Journal) -> None:
    path = target / ".gitignore"
    journal.snapshot_file(path)
    existing = path.read_text(encoding="utf-8") if path.exists() else ""
    lines = existing.splitlines()
    for entry in (".gitnexus/", ".globalsetup-backups/", "build-pack/runtime/"):
        if entry not in lines:
            lines.append(entry)
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def enforce_gitnexus_config(path: Path, journal: Journal) -> None:
    journal.snapshot_file(path)
    config = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    config["indexOnly"] = True
    path.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")


def stage_build_pack(stage_agents: Path, build_pack: Path) -> None:
    templates = stage_agents / "templates"
    for source_relative, target_relative in BUILD_PACK_FILES:
        destination = build_pack / target_relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(templates / source_relative, destination)
    pre_ship = stage_agents / "safeguards" / "pre-ship-checklist.md"
    shutil.copy2(pre_ship, build_pack / "15-pre-ship-checklist.md")
    (build_pack / "tasks").mkdir(exist_ok=True)


def stage_payload(source: Path, stage: Path, include_build_pack: bool) -> None:
    shutil.copy2(source / "AGENTS.md", stage / "AGENTS.md")
    stage_agents = stage / ".agents"
    stage_agents.mkdir()
    for folder in AGENT_FOLDERS:
        shutil.copytree(source / folder, stage_agents / folder)
    stage_scripts = stage / "scripts"
    stage_scripts.mkdir()
    for name in SCRIPT_NAMES:
        shutil.copy2(source / "scripts" / name, stage_scripts / name)
    shutil.copy2(source / ".gitnexusrc", stage / ".gitnexusrc")
    stage_hooks = stage / ".githooks"
    stage_hooks.mkdir()
    shutil.copy2(source / "scripts" / "pre-commit", stage_hooks / "pre-commit")
    if include_build_pack:
        stage_build_pack(stage_agents, stage / "build-pack")


def persist_backups(target: Path, backup_root: Path) -> None:
    if not backup_root.exists() or not any(backup_root.rglob("*")):
        return
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    destination = target / ".globalsetup-backups" / timestamp
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(backup_root, destination)


def install(source: Path, target: Path, tools: dict[str, str], dry_run: bool) -> dict[str, object]:
    plan = {
        "target": str(target),
        "agent_folders": list(AGENT_FOLDERS),
        "scripts": list(SCRIPT_NAMES),
        "gitnexus": "required",
        "dry_run": dry_run,
    }
    if dry_run:
        return plan

    target_created = not target.exists()
    with tempfile.TemporaryDirectory(prefix="globalsetup-") as temp:
        temp_root = Path(temp)
        stage = temp_root / "stage"
        stage.mkdir()
        include_build_pack = not (target / "build-pack" / "execution-state.json").exists()
        stage_payload(source, stage, include_build_pack)
        target.mkdir(parents=True, exist_ok=True)
        backup_root = temp_root / "backup"
        journal = Journal(target, backup_root)
        had_git = (target / ".git").exists()
        old_hooks = ""
        if had_git:
            hooks = subprocess.run(
                [tools["git"], "-C", str(target), "config", "--local", "--get", "core.hooksPath"],
                text=True,
                capture_output=True,
            )
            old_hooks = hooks.stdout.strip() if hooks.returncode == 0 else ""
        try:
            journal.replace(stage / "AGENTS.md", target / "AGENTS.md")
            journal.replace(stage / ".agents", target / ".agents")
            for name in SCRIPT_NAMES:
                journal.replace(stage / "scripts" / name, target / "scripts" / name)
            enforce_gitnexus_config(target / ".gitnexusrc", journal)
            append_gitignore(target, journal)

            if not had_git:
                run([tools["git"], "-C", str(target), "init", "--quiet"])
            hook = target / ".githooks" / "pre-commit"
            if hook.exists() and hook.read_bytes() != (stage / ".githooks" / "pre-commit").read_bytes():
                journal.replace(hook, target / ".githooks" / "pre-commit.user")
            journal.replace(stage / ".githooks" / "pre-commit", hook)
            if os.name != "nt":
                hook.chmod(0o755)
                for name in ("generate-build-pack.sh", "validate-build-pack.sh", "build-runner.sh"):
                    (target / "scripts" / name).chmod(0o755)
            run([tools["git"], "-C", str(target), "config", "--local", "core.hooksPath", ".githooks"])

            run(
                [
                    tools["gitnexus"],
                    "analyze",
                    "--index-only",
                    "--skip-agents-md",
                    "--skip-skills",
                    "--name",
                    target.name,
                    "--branch",
                    "globalsetup/integration",
                ],
                cwd=target,
            )
            local_runner = target / ".gitnexus" / "run.cjs"
            if not local_runner.exists():
                raise SetupError("GitNexus did not create its repository-local runner")
            status = run([tools["node"], str(local_runner), "status"], cwd=target).stdout
            if "up-to-date" not in status.lower() and "up to date" not in status.lower():
                raise SetupError("GitNexus did not report an up-to-date index")
            if include_build_pack:
                journal.replace(stage / "build-pack", target / "build-pack")
            persist_backups(target, backup_root)
        except Exception:
            journal.rollback()
            if had_git:
                if old_hooks:
                    subprocess.run(
                        [tools["git"], "-C", str(target), "config", "--local", "core.hooksPath", old_hooks]
                    )
                else:
                    subprocess.run(
                        [tools["git"], "-C", str(target), "config", "--local", "--unset", "core.hooksPath"]
                    )
            elif (target / ".git").exists():
                shutil.rmtree(target / ".git")
            if target_created and target.exists():
                shutil.rmtree(target)
            raise
    return plan


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", default=".", help="Target repository directory")
    parser.add_argument("--dry-run", action="store_true", help="Preflight and print the install plan without mutation")
    parser.add_argument(
        "--acknowledge-gitnexus-license",
        action="store_true",
        help="Confirm the target's eligible noncommercial GitNexus use before installation",
    )
    args = parser.parse_args()

    source = Path(__file__).resolve().parents[1]
    target = Path(args.target).resolve()
    try:
        tools = preflight(
            source,
            target,
            install_dependencies=not args.dry_run,
            license_eligible=args.acknowledge_gitnexus_license,
        )
    except SetupError as exc:
        print(f"setup preflight failed: {exc}", file=sys.stderr)
        return 2
    try:
        result = install(source, target, tools, args.dry_run)
    except (OSError, SetupError, subprocess.SubprocessError) as exc:
        print(f"setup failed and target changes were rolled back: {exc}", file=sys.stderr)
        return 2
    print(json.dumps({"ok": True, "result": result}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
