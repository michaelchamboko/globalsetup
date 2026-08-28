#!/usr/bin/env python3
"""Small, model-agnostic execution-state runner for GlobalSetup projects."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


VALID_STATUSES = {"blocked", "ready", "in_progress", "verified", "done"}
REQUIRED_TIERS = {
    "low": {"task"},
    "medium": {"task", "affected"},
    "high": {"task", "affected", "full"},
}
GITNEXUS_STATUS_ARGV = ["node", ".gitnexus/run.cjs", "status"]
GITNEXUS_SYNC_ARGV = ["node", ".gitnexus/run.cjs", "analyze", "--skip-agents-md", "--skip-skills"]


class ContractError(Exception):
    """Raised when execution state is invalid or a transition is unsafe."""


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def read_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ContractError(f"missing required file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ContractError(f"invalid JSON in {path}: {exc}") from exc


def write_json_atomic(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            json.dump(payload, stream, indent=2, ensure_ascii=False)
            stream.write("\n")
        os.replace(temp_name, path)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


class StateLock:
    def __init__(self, state_path: Path):
        self.path = state_path.with_suffix(f"{state_path.suffix}.lock")
        self.fd: int | None = None

    def __enter__(self) -> "StateLock":
        try:
            self.fd = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except FileExistsError as exc:
            raise ContractError(f"execution state is locked: {self.path}") from exc
        os.write(self.fd, str(os.getpid()).encode("ascii"))
        return self

    def __exit__(self, *_: object) -> None:
        if self.fd is not None:
            os.close(self.fd)
        self.path.unlink(missing_ok=True)


def ensure_argv(value: Any, field: str) -> list[str]:
    if not isinstance(value, list) or not value or not all(isinstance(item, str) and item for item in value):
        raise ContractError(f"{field} must be a non-empty array of command arguments")
    return value


def run_argv(argv: list[str], root: Path, timeout: int = 900) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(
            argv,
            cwd=root,
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            timeout=timeout,
            shell=False,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        raise ContractError(f"could not run command {argv!r}: {exc}") from exc


def run_git_bytes(argv: list[str], root: Path) -> subprocess.CompletedProcess[bytes]:
    try:
        return subprocess.run(argv, cwd=root, capture_output=True, timeout=60, shell=False)
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        raise ContractError(f"could not inspect Git source state with {argv!r}: {exc}") from exc


def source_fingerprint(root: Path) -> str:
    top = run_git_bytes(["git", "rev-parse", "--show-toplevel"], root)
    if top.returncode != 0:
        raise ContractError("BuildRunner requires the target root to be a Git repository")
    top_level = Path(os.fsdecode(top.stdout).strip()).resolve()
    if top_level != root:
        raise ContractError("BuildRunner --root must be the Git repository root")

    digest = hashlib.sha256()
    head = run_git_bytes(["git", "rev-parse", "--verify", "HEAD"], root)
    if head.returncode == 0:
        digest.update(b"HEAD\0" + head.stdout.strip() + b"\0")
        diff = run_git_bytes(
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
        )
        if diff.returncode != 0:
            raise ContractError(f"could not fingerprint tracked changes: {os.fsdecode(diff.stderr)}")
        digest.update(diff.stdout)
        listed = run_git_bytes(["git", "ls-files", "--others", "--exclude-standard", "-z"], root)
    else:
        digest.update(b"UNBORN\0")
        listed = run_git_bytes(["git", "ls-files", "-co", "--exclude-standard", "-z"], root)
    if listed.returncode != 0:
        raise ContractError(f"could not fingerprint repository files: {os.fsdecode(listed.stderr)}")

    excluded = {"build-pack/execution-state.json", "build-pack/execution-state.json.lock"}
    for raw_path in sorted(path for path in listed.stdout.split(b"\0") if path):
        relative = os.fsdecode(raw_path).replace("\\", "/")
        if relative in excluded:
            continue
        candidate = (root / relative).resolve()
        try:
            candidate.relative_to(root)
        except ValueError as exc:
            raise ContractError(f"Git reported a path outside the repository: {relative}") from exc
        try:
            content = candidate.read_bytes()
        except OSError as exc:
            raise ContractError(f"could not fingerprint {relative}: {exc}") from exc
        digest.update(relative.encode("utf-8", errors="surrogateescape") + b"\0")
        digest.update(hashlib.sha256(content).digest())
    return digest.hexdigest()


def task_map(state: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {task["id"]: task for task in state.get("tasks", [])}


def validate_contract(state: dict[str, Any], capabilities: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if state.get("schema_version") != 1:
        errors.append("execution-state schema_version must be 1")
    if capabilities.get("schema_version") != 1:
        errors.append("capabilities schema_version must be 1")
    if state.get("mode") not in {"mvp", "standard", "high_assurance"}:
        errors.append("mode must be mvp, standard, or high_assurance")

    graph = capabilities.get("graph", {})
    if graph.get("required") is not True:
        errors.append("graph.required must be true")
    if graph.get("provider") != "gitnexus":
        errors.append("graph.provider must be gitnexus")
    license_config = graph.get("license", {})
    if license_config.get("spdx") != "PolyForm-Noncommercial-1.0.0":
        errors.append("graph.license.spdx must record the GitNexus license")
    if license_config.get("usage") != "noncommercial" or license_config.get("acknowledged") is not True:
        errors.append("GitNexus use must be declared and acknowledged as noncommercial")
    for field in ("status_argv", "sync_argv"):
        try:
            ensure_argv(graph.get(field), f"graph.{field}")
        except ContractError as exc:
            errors.append(str(exc))
    if graph.get("status_argv") != GITNEXUS_STATUS_ARGV:
        errors.append("graph.status_argv must use the repository-local GitNexus runner")
    if graph.get("sync_argv") != GITNEXUS_SYNC_ARGV:
        errors.append("graph.sync_argv must use the repository-local GitNexus runner")

    tasks = state.get("tasks")
    if not isinstance(tasks, list) or not tasks:
        errors.append("tasks must contain at least one approved task")
        return errors

    ids = [task.get("id") for task in tasks]
    if len(ids) != len(set(ids)) or any(not isinstance(task_id, str) or not task_id for task_id in ids):
        errors.append("task ids must be unique non-empty strings")
    known_ids = set(ids)
    active = 0
    for task in tasks:
        task_id = task.get("id", "<unknown>")
        status = task.get("status")
        if status not in VALID_STATUSES:
            errors.append(f"{task_id}: invalid status {status!r}")
        if status in {"in_progress", "verified"}:
            active += 1
        if not isinstance(task.get("source_changes"), bool):
            errors.append(f"{task_id}: source_changes must be true or false")
        if task.get("blocker") and status != "blocked":
            errors.append(f"{task_id}: a task with an active blocker must be blocked")
        risk = task.get("risk")
        if risk not in REQUIRED_TIERS:
            errors.append(f"{task_id}: risk must be low, medium, or high")
            continue
        dependencies = task.get("dependencies")
        if not isinstance(dependencies, list):
            errors.append(f"{task_id}: dependencies must be an array")
        else:
            missing = [dep for dep in dependencies if dep not in known_ids]
            if missing:
                errors.append(f"{task_id}: unknown dependencies {missing}")
            if task_id in dependencies:
                errors.append(f"{task_id}: task cannot depend on itself")
        validation = task.get("validation")
        if not isinstance(validation, list):
            errors.append(f"{task_id}: validation must be an array")
            continue
        tiers = {check.get("tier") for check in validation if isinstance(check, dict)}
        missing_tiers = REQUIRED_TIERS[risk] - tiers
        if missing_tiers:
            errors.append(f"{task_id}: {risk} risk requires validation tiers {sorted(missing_tiers)}")
        for index, check in enumerate(validation):
            if not isinstance(check, dict):
                errors.append(f"{task_id}: validation[{index}] must be an object")
                continue
            try:
                ensure_argv(check.get("argv"), f"{task_id}.validation[{index}].argv")
            except ContractError as exc:
                errors.append(str(exc))
    if active > 1:
        errors.append("only one task may be active")

    visiting: set[str] = set()
    visited: set[str] = set()
    mapping = task_map(state)

    def visit(task_id: str) -> None:
        if task_id in visiting:
            errors.append(f"task graph contains a cycle at {task_id}")
            return
        if task_id in visited or task_id not in mapping:
            return
        visiting.add(task_id)
        for dependency in mapping[task_id].get("dependencies", []):
            visit(dependency)
        visiting.remove(task_id)
        visited.add(task_id)

    for task_id in mapping:
        visit(task_id)
    return errors


def reconcile(state: dict[str, Any]) -> bool:
    changed = False
    mapping = task_map(state)
    for task in state["tasks"]:
        if task["status"] in {"done", "in_progress", "verified"}:
            continue
        if task.get("blocker"):
            if task["status"] != "blocked":
                task["status"] = "blocked"
                changed = True
            continue
        dependencies_done = all(mapping[dep]["status"] == "done" for dep in task.get("dependencies", []))
        desired = "ready" if dependencies_done else "blocked"
        if task["status"] != desired:
            task["status"] = desired
            changed = True
    return changed


def get_task(state: dict[str, Any], task_id: str) -> dict[str, Any]:
    task = task_map(state).get(task_id)
    if task is None:
        raise ContractError(f"unknown task: {task_id}")
    return task


def output_tail(value: str, limit: int = 2000) -> str:
    return value[-limit:]


def graph_config(capabilities: dict[str, Any]) -> dict[str, Any]:
    graph = capabilities.get("graph")
    if not isinstance(graph, dict) or graph.get("required") is not True:
        raise ContractError("required graph provider is not configured")
    return graph


def graph_status(root: Path, capabilities: dict[str, Any]) -> subprocess.CompletedProcess[str]:
    graph = graph_config(capabilities)
    if graph.get("status_argv") != GITNEXUS_STATUS_ARGV:
        raise ContractError("required graph provider gitnexus has an invalid status command")
    argv = GITNEXUS_STATUS_ARGV
    result = run_argv(argv, root, timeout=int(graph.get("timeout_seconds", 900)))
    fresh = re.search(
        r"^\s*Status:\s*(?:✅\s*)?up[- ]to[- ]date\s*$",
        result.stdout,
        flags=re.IGNORECASE | re.MULTILINE,
    )
    if result.returncode != 0 or fresh is None:
        raise ContractError(
            f"required graph provider {graph.get('provider')} is unavailable or stale: "
            f"{output_tail(result.stderr or result.stdout)}"
        )
    return result


def command_validate(state: dict[str, Any], capabilities: dict[str, Any]) -> None:
    errors = validate_contract(state, capabilities)
    if errors:
        raise ContractError("\n".join(errors))
    print("VALID")


def command_next(state: dict[str, Any], state_path: Path) -> None:
    if reconcile(state):
        write_json_atomic(state_path, state)
    for task in state["tasks"]:
        if task["status"] in {"in_progress", "verified"}:
            print(json.dumps(task, indent=2, ensure_ascii=True))
            return
    for task in state["tasks"]:
        if task["status"] == "ready":
            print(json.dumps(task, indent=2, ensure_ascii=True))
            return
    raise ContractError("no ready task; resolve blockers or complete active work")


def command_start(
    state: dict[str, Any], capabilities: dict[str, Any], state_path: Path, root: Path, task_id: str
) -> None:
    active = next((task for task in state["tasks"] if task["status"] in {"in_progress", "verified"}), None)
    if active:
        raise ContractError(f"task {active['id']} is already active")
    reconcile(state)
    task = get_task(state, task_id)
    if task["status"] != "ready":
        raise ContractError(f"task {task_id} is not ready")
    graph_status(root, capabilities)
    task["status"] = "in_progress"
    task["started_at"] = now_utc()
    write_json_atomic(state_path, state)
    print(json.dumps(task, indent=2, ensure_ascii=True))


def command_verify(state: dict[str, Any], state_path: Path, root: Path, task_id: str) -> None:
    task = get_task(state, task_id)
    if task["status"] != "in_progress":
        raise ContractError(f"task {task_id} must be in_progress before verification")
    required = REQUIRED_TIERS[task["risk"]]
    evidence: list[dict[str, Any]] = []
    for check in task["validation"]:
        if check["tier"] not in required:
            continue
        argv = ensure_argv(check.get("argv"), f"{task_id}.{check.get('name', 'validation')}.argv")
        result = run_argv(argv, root, timeout=int(check.get("timeout_seconds", 900)))
        receipt = {
            "name": check.get("name", check["tier"]),
            "tier": check["tier"],
            "argv": argv,
            "exit_code": result.returncode,
            "verified_at": now_utc(),
            "stdout": output_tail(result.stdout),
            "stderr": output_tail(result.stderr),
        }
        evidence.append(receipt)
        if result.returncode != 0:
            task["evidence"] = evidence
            task["status"] = "blocked"
            task["blocker"] = {
                "reason": f"validation failed: {receipt['name']}",
                "recorded_at": now_utc(),
            }
            write_json_atomic(state_path, state)
            print(json.dumps(receipt, indent=2, ensure_ascii=True), file=sys.stderr)
            raise SystemExit(1)
    task["evidence"] = evidence
    task["status"] = "verified"
    task["verified_at"] = now_utc()
    task["verified_source_fingerprint"] = source_fingerprint(root)
    write_json_atomic(state_path, state)
    print(json.dumps(evidence, indent=2, ensure_ascii=True))


def command_graph_sync(
    state: dict[str, Any], capabilities: dict[str, Any], state_path: Path, root: Path, task_id: str,
    emit: bool = True,
) -> None:
    task = get_task(state, task_id)
    if task["status"] != "verified":
        raise ContractError(f"task {task_id} must be verified before graph-sync")
    graph = graph_config(capabilities)
    if graph.get("sync_argv") != GITNEXUS_SYNC_ARGV:
        raise ContractError("required graph provider gitnexus has an invalid sync command")
    argv = GITNEXUS_SYNC_ARGV
    result = run_argv(argv, root, timeout=int(graph.get("timeout_seconds", 900)))
    if result.returncode != 0:
        raise ContractError(
            f"required graph provider {graph.get('provider')} failed to sync: "
            f"{output_tail(result.stderr or result.stdout)}"
        )
    status_result = graph_status(root, capabilities)
    evidence = {
        "provider": graph["provider"],
        "status": "fresh",
        "synced_at": now_utc(),
        "sync_output": output_tail(result.stdout),
        "status_output": output_tail(status_result.stdout),
    }
    task["graph_evidence"] = evidence
    write_json_atomic(state_path, state)
    if emit:
        print(json.dumps(evidence, indent=2, ensure_ascii=True))


def command_complete(
    state: dict[str, Any], capabilities: dict[str, Any], state_path: Path, root: Path, task_id: str
) -> None:
    task = get_task(state, task_id)
    if task["status"] != "verified":
        raise ContractError(f"task {task_id} must be verified before completion")
    if task["risk"] == "high" and task.get("review", {}).get("status") != "passed":
        raise ContractError(f"task {task_id} is high risk and requires a passed independent review")
    current_fingerprint = source_fingerprint(root)
    if task.get("verified_source_fingerprint") != current_fingerprint:
        history = task.setdefault("verification_history", [])
        history.append(
            {
                "status": "invalidated",
                "invalidated_at": now_utc(),
                "verified_source_fingerprint": task.get("verified_source_fingerprint"),
                "current_source_fingerprint": current_fingerprint,
                "evidence": task.get("evidence", []),
            }
        )
        task["status"] = "in_progress"
        task["evidence"] = []
        task.pop("verified_at", None)
        task.pop("verified_source_fingerprint", None)
        write_json_atomic(state_path, state)
        raise ContractError(f"task {task_id} source changed after verification; verify it again")
    # Completion owns the graph update so every done task has a fresh GitNexus receipt.
    command_graph_sync(state, capabilities, state_path, root, task_id, emit=False)
    task["status"] = "done"
    task["completed_at"] = now_utc()
    reconcile(state)
    write_json_atomic(state_path, state)
    print(json.dumps(task, indent=2, ensure_ascii=True))


def command_review(state: dict[str, Any], state_path: Path, task_id: str, reviewer: str, summary: str) -> None:
    task = get_task(state, task_id)
    if task["status"] != "verified":
        raise ContractError(f"task {task_id} must be verified before review")
    task["review"] = {
        "status": "passed",
        "reviewer": reviewer,
        "summary": summary,
        "reviewed_at": now_utc(),
    }
    write_json_atomic(state_path, state)
    print(json.dumps(task["review"], indent=2, ensure_ascii=True))


def command_block(state: dict[str, Any], state_path: Path, task_id: str, reason: str) -> None:
    task = get_task(state, task_id)
    if task["status"] == "done":
        raise ContractError(f"task {task_id} is done and cannot be blocked")
    task["status"] = "blocked"
    task["blocker"] = {"reason": reason, "recorded_at": now_utc()}
    write_json_atomic(state_path, state)
    print(json.dumps(task, indent=2, ensure_ascii=True))


def command_unblock(state: dict[str, Any], state_path: Path, task_id: str, resolution: str) -> None:
    task = get_task(state, task_id)
    blocker = task.get("blocker")
    if task["status"] != "blocked" or not blocker:
        raise ContractError(f"task {task_id} does not have an active explicit blocker")
    history = task.setdefault("blocker_history", [])
    history.append({**blocker, "resolution": resolution, "resolved_at": now_utc()})
    task.pop("blocker", None)
    reconcile(state)
    write_json_atomic(state_path, state)
    print(json.dumps(task, indent=2, ensure_ascii=True))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Target repository root")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("validate")
    subparsers.add_parser("next")
    subparsers.add_parser("status")
    for name in ("start", "verify", "complete", "graph-sync"):
        command = subparsers.add_parser(name)
        command.add_argument("task_id")
    block = subparsers.add_parser("block")
    block.add_argument("task_id")
    block.add_argument("--reason", required=True)
    unblock = subparsers.add_parser("unblock")
    unblock.add_argument("task_id")
    unblock.add_argument("--resolution", required=True)
    review = subparsers.add_parser("review")
    review.add_argument("task_id")
    review.add_argument("--reviewer", required=True)
    review.add_argument("--summary", required=True)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    root = Path(args.root).resolve()
    state_path = root / "build-pack" / "execution-state.json"
    try:
        with StateLock(state_path):
            state = read_json(state_path)
            capabilities_rel = state.get("capabilities_file", "build-pack/capabilities.json")
            capabilities_path = (root / capabilities_rel).resolve()
            try:
                capabilities_path.relative_to(root)
            except ValueError as exc:
                raise ContractError("capabilities_file must resolve inside the repository root") from exc
            capabilities = read_json(capabilities_path)
            if args.command == "validate":
                command_validate(state, capabilities)
            elif args.command == "next":
                command_next(state, state_path)
            elif args.command == "status":
                if reconcile(state):
                    write_json_atomic(state_path, state)
                print(json.dumps(state, indent=2, ensure_ascii=True))
            elif args.command == "start":
                command_start(state, capabilities, state_path, root, args.task_id)
            elif args.command == "verify":
                command_verify(state, state_path, root, args.task_id)
            elif args.command == "graph-sync":
                command_graph_sync(state, capabilities, state_path, root, args.task_id)
            elif args.command == "complete":
                command_complete(state, capabilities, state_path, root, args.task_id)
            elif args.command == "review":
                command_review(state, state_path, args.task_id, args.reviewer, args.summary)
            elif args.command == "block":
                command_block(state, state_path, args.task_id, args.reason)
            elif args.command == "unblock":
                command_unblock(state, state_path, args.task_id, args.resolution)
    except ContractError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
