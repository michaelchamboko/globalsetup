#!/usr/bin/env python3
"""Small, model-agnostic execution-state runner for GlobalSetup projects."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import secrets
import shutil
import subprocess
import sys
import tempfile
import time
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
GITNEXUS_VERSION = "1.6.10"
JOURNAL_NAME = "execution-journal.jsonl"


class ContractError(Exception):
    """Raised when execution state is invalid or a transition is unsafe."""


class VerificationFailed(ContractError):
    """Raised after a required command records failing evidence."""

    def __init__(self, message: str, result: dict[str, Any]):
        super().__init__(message)
        self.result = result


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def emit_result(command: str, result: Any) -> None:
    print(json.dumps({"ok": True, "command": command, "result": result}, indent=2, ensure_ascii=True))


def emit_error(command: str, error: str, result: Any | None = None) -> None:
    payload: dict[str, Any] = {"ok": False, "command": command, "error": error}
    if result is not None:
        payload["result"] = result
    print(json.dumps(payload, indent=2, ensure_ascii=True), file=sys.stderr)


def read_json(path: Path) -> dict[str, Any]:
    try:
        def reject_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
            result: dict[str, Any] = {}
            for key, value in pairs:
                if key in result:
                    raise ContractError(f"duplicate JSON key {key!r} in {path}")
                result[key] = value
            return result

        value = json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=reject_duplicates)
        if not isinstance(value, dict):
            raise ContractError(f"JSON document must be an object: {path}")
        return value
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
            stream.flush()
            os.fsync(stream.fileno())
        # Re-read the staged payload before replacing the durable state.
        read_json(Path(temp_name))
        os.replace(temp_name, path)
        if hasattr(os, "O_DIRECTORY"):
            try:
                directory = os.open(path.parent, os.O_DIRECTORY)
                try:
                    os.fsync(directory)
                finally:
                    os.close(directory)
            except OSError:
                pass
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
            try:
                metadata = read_json(self.path)
                started = metadata.get("started_at", "")
                age = time.time() - datetime.fromisoformat(str(started).replace("Z", "+00:00")).timestamp()
            except (ContractError, TypeError, ValueError):
                age = 0
            if age > 3600:
                raise ContractError(f"execution state has a stale lock requiring recover: {self.path}") from exc
            raise ContractError(f"execution state is locked: {self.path}") from exc
        payload = {
            "pid": os.getpid(),
            "nonce": secrets.token_hex(16),
            "started_at": now_utc(),
            "heartbeat_at": now_utc(),
        }
        os.write(self.fd, json.dumps(payload, ensure_ascii=True).encode("utf-8"))
        os.fsync(self.fd)
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


def validate_contract(state: dict[str, Any], capabilities: dict[str, Any], root: Path) -> list[str]:
    errors: list[str] = []
    if state.get("schema_version") != 1:
        errors.append("execution-state schema_version must be 1")
    if capabilities.get("schema_version") != 1:
        errors.append("capabilities schema_version must be 1")
    if state.get("mode") not in {"mvp", "standard", "high_assurance"}:
        errors.append("mode must be mvp, standard, or high_assurance")

    source_authority = state.get("source_authority")
    approved_sources: set[str] = set()
    if not isinstance(source_authority, dict):
        errors.append("source_authority must declare approved sources and contradictions")
    else:
        if not isinstance(source_authority.get("build_intent_summary"), str) or not source_authority["build_intent_summary"].strip():
            errors.append("source_authority.build_intent_summary must state what GlobalSetup will build")
        grommet_review = source_authority.get("grommet_review")
        if not isinstance(grommet_review, dict) or grommet_review.get("status") != "approved":
            errors.append("source_authority.grommet_review must approve the source-to-build mapping")
        sources = source_authority.get("approved_sources")
        if not isinstance(sources, list) or not sources:
            errors.append("source_authority.approved_sources must be a non-empty array")
        else:
            for index, relative in enumerate(sources):
                field = f"source_authority.approved_sources[{index}]"
                if not isinstance(relative, str) or not relative.strip():
                    errors.append(f"{field} must be a non-empty repository-relative path")
                    continue
                normalized = relative.replace("\\", "/")
                if normalized == ".gitnexus" or normalized.startswith(".gitnexus/"):
                    errors.append(f"{field} cannot use derived GitNexus data as product authority")
                    continue
                candidate = (root / relative).resolve()
                try:
                    candidate.relative_to(root)
                except ValueError:
                    errors.append(f"{field} must resolve inside the repository")
                    continue
                if not candidate.is_file():
                    errors.append(f"{field} does not exist: {relative}")
                    continue
                approved_sources.add(relative)
        contradictions = source_authority.get("contradictions")
        if not isinstance(contradictions, list):
            errors.append("source_authority.contradictions must be an array")
        else:
            for index, contradiction in enumerate(contradictions):
                if not isinstance(contradiction, dict):
                    errors.append(f"source_authority.contradictions[{index}] must be an object")
                    continue
                if contradiction.get("status") != "resolved":
                    identifier = contradiction.get("id", index)
                    errors.append(f"source contradiction {identifier} must be resolved before execution")

    automation_authority = state.get("automation_authority")
    publication_authority: dict[str, Any] = {}
    if not isinstance(automation_authority, dict):
        errors.append("automation_authority must explicitly declare publication authority")
    else:
        publication_authority = automation_authority.get("publication", {})
        if not isinstance(publication_authority, dict):
            errors.append("automation_authority.publication must be an object")
            publication_authority = {}
        elif not isinstance(publication_authority.get("enabled"), bool):
            errors.append("automation_authority.publication.enabled must be true or false")
        destinations = publication_authority.get("destinations")
        if not isinstance(destinations, list):
            errors.append("automation_authority.publication.destinations must be an array")

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
        context_files = task.get("context_files")
        if not isinstance(context_files, list) or not context_files:
            errors.append(f"{task_id}: context_files must be a non-empty array")
        else:
            for index, relative in enumerate(context_files):
                field = f"{task_id}.context_files[{index}]"
                if not isinstance(relative, str) or not relative.strip():
                    errors.append(f"{field} must be a non-empty repository-relative path")
                    continue
                candidate = (root / relative).resolve()
                try:
                    candidate.relative_to(root)
                except ValueError:
                    errors.append(f"{field} must resolve inside the repository")
                    continue
                if not candidate.is_file():
                    errors.append(f"{field} does not exist: {relative}")
        requirement_sources = task.get("requirement_sources")
        if not isinstance(requirement_sources, list) or not requirement_sources:
            errors.append(f"{task_id}: requirement_sources must be a non-empty array")
        else:
            for relative in requirement_sources:
                if relative not in approved_sources:
                    errors.append(f"{task_id}: requirement source is not approved: {relative}")
                if isinstance(context_files, list) and relative not in context_files:
                    errors.append(f"{task_id}: requirement source must also be in context_files: {relative}")
        publication = task.get("publication")
        if publication is not None:
            if not isinstance(publication, dict) or not isinstance(publication.get("destination"), str):
                errors.append(f"{task_id}: publication must declare a destination")
            elif publication_authority.get("enabled") is not True:
                errors.append(f"{task_id}: automated publication is not enabled")
            elif publication.get("destination") not in publication_authority.get("destinations", []):
                errors.append(f"{task_id}: publication destination is not authorized: {publication.get('destination')}")
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
        names = [check.get("name") for check in validation if isinstance(check, dict)]
        if len(names) != len(set(names)) or any(not isinstance(name, str) or not name for name in names):
            errors.append(f"{task_id}: validation names must be unique non-empty strings")
        tiers = {check.get("tier") for check in validation if isinstance(check, dict)}
        missing_tiers = REQUIRED_TIERS[risk] - tiers
        if missing_tiers:
            errors.append(f"{task_id}: {risk} risk requires validation tiers {sorted(missing_tiers)}")
        for index, check in enumerate(validation):
            if not isinstance(check, dict):
                errors.append(f"{task_id}: validation[{index}] must be an object")
                continue
            kind = check.get("kind")
            location = check.get("location")
            if kind not in {"command", "receipt"}:
                errors.append(f"{task_id}.validation[{index}].kind must be command or receipt")
            if not isinstance(location, str) or not location:
                errors.append(f"{task_id}.validation[{index}].location must be a non-empty string")
            if kind == "command":
                if location != "local":
                    errors.append(f"{task_id}.validation[{index}] command location must be local")
                try:
                    ensure_argv(check.get("argv"), f"{task_id}.validation[{index}].argv")
                except ContractError as exc:
                    errors.append(str(exc))
            elif kind == "receipt" and "argv" in check:
                errors.append(f"{task_id}.validation[{index}] receipt must not declare argv")
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


def command_validate(state: dict[str, Any], capabilities: dict[str, Any], root: Path) -> dict[str, str]:
    errors = validate_contract(state, capabilities, root)
    if errors:
        raise ContractError("\n".join(errors))
    return {"status": "valid"}


def command_next(state: dict[str, Any], state_path: Path) -> dict[str, Any]:
    if reconcile(state):
        write_json_atomic(state_path, state)
    for task in state["tasks"]:
        if task["status"] in {"in_progress", "verified"}:
            return task
    for task in state["tasks"]:
        if task["status"] == "ready":
            return task
    raise ContractError("no ready task; resolve blockers or complete active work")


def command_start(
    state: dict[str, Any], capabilities: dict[str, Any], state_path: Path, root: Path, task_id: str
) -> dict[str, Any]:
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
    return task


def command_verify(state: dict[str, Any], state_path: Path, root: Path, task_id: str) -> list[dict[str, Any]]:
    task = get_task(state, task_id)
    if task["status"] != "in_progress":
        raise ContractError(f"task {task_id} must be in_progress before verification")
    required = REQUIRED_TIERS[task["risk"]]
    evidence: list[dict[str, Any]] = []
    current_fingerprint = source_fingerprint(root)
    for check in task["validation"]:
        if check["tier"] not in required:
            continue
        if check["kind"] == "receipt":
            receipt = next(
                (
                    item
                    for item in task.get("external_evidence", [])
                    if item.get("name") == check["name"] and item.get("location") == check["location"]
                ),
                None,
            )
            if receipt is None:
                raise ContractError(
                    f"{task_id}: receipt validation {check['name']!r} is missing; "
                    "use record-evidence before verify"
                )
            if receipt.get("source_fingerprint") != current_fingerprint:
                raise ContractError(f"{task_id}: receipt validation {check['name']!r} is stale; record it again")
            evidence.append(dict(receipt))
            continue

        argv = ensure_argv(check.get("argv"), f"{task_id}.{check.get('name', 'validation')}.argv")
        result = run_argv(argv, root, timeout=int(check.get("timeout_seconds", 900)))
        resulting_fingerprint = source_fingerprint(root)
        receipt = {
            "name": check["name"],
            "tier": check["tier"],
            "kind": "command",
            "location": "local",
            "argv": argv,
            "exit_code": result.returncode,
            "verified_at": now_utc(),
            "source_fingerprint": resulting_fingerprint,
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
            raise VerificationFailed(f"validation failed: {receipt['name']}", receipt)
        if resulting_fingerprint != current_fingerprint:
            task.setdefault("verification_history", []).append(
                {
                    "status": "source_changed_during_validation",
                    "recorded_at": now_utc(),
                    "check": receipt["name"],
                    "before_source_fingerprint": current_fingerprint,
                    "after_source_fingerprint": resulting_fingerprint,
                    "evidence": evidence,
                }
            )
            task["evidence"] = []
            write_json_atomic(state_path, state)
            raise ContractError(
                f"task {task_id} validation command {receipt['name']!r} changed source; run verify again"
            )
    task["evidence"] = evidence
    task["status"] = "verified"
    task["verified_at"] = now_utc()
    task["verified_source_fingerprint"] = current_fingerprint
    task.pop("review", None)
    write_json_atomic(state_path, state)
    return evidence


def command_record_evidence(
    state: dict[str, Any],
    state_path: Path,
    root: Path,
    task_id: str,
    check_name: str,
    location: str,
    source: str,
    summary: str,
) -> dict[str, Any]:
    task = get_task(state, task_id)
    if task["status"] != "in_progress":
        raise ContractError(f"task {task_id} must be in_progress before recording evidence")
    check = next(
        (
            item
            for item in task["validation"]
            if item.get("name") == check_name and item.get("kind") == "receipt"
        ),
        None,
    )
    if check is None:
        raise ContractError(f"task {task_id} has no receipt validation named {check_name!r}")
    if check.get("location") != location:
        raise ContractError(
            f"task {task_id} receipt {check_name!r} requires location {check.get('location')!r}"
        )
    receipt = {
        "name": check_name,
        "tier": check["tier"],
        "kind": "receipt",
        "location": location,
        "source": source,
        "summary": summary,
        "recorded_at": now_utc(),
        "source_fingerprint": source_fingerprint(root),
    }
    recorded = task.setdefault("external_evidence", [])
    task["external_evidence"] = [item for item in recorded if item.get("name") != check_name]
    task["external_evidence"].append(receipt)
    write_json_atomic(state_path, state)
    return receipt


def command_graph_sync(
    state: dict[str, Any], capabilities: dict[str, Any], state_path: Path, root: Path, task_id: str
) -> dict[str, Any]:
    task = get_task(state, task_id)
    if task["status"] != "verified":
        raise ContractError(f"task {task_id} must be verified before graph-sync")
    verified_fingerprint = task.get("verified_source_fingerprint")
    if not isinstance(verified_fingerprint, str) or not verified_fingerprint:
        raise ContractError(f"task {task_id} has no verified source fingerprint; verify it again")
    if source_fingerprint(root) != verified_fingerprint:
        raise ContractError(f"task {task_id} source changed after verification; verify it again before graph-sync")
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
        "source_fingerprint": verified_fingerprint,
        "sync_output": output_tail(result.stdout),
        "status_output": output_tail(status_result.stdout),
    }
    task["graph_evidence"] = evidence
    write_json_atomic(state_path, state)
    return evidence


def command_complete(
    state: dict[str, Any], capabilities: dict[str, Any], state_path: Path, root: Path, task_id: str
) -> dict[str, Any]:
    task = get_task(state, task_id)
    if task["status"] != "verified":
        raise ContractError(f"task {task_id} must be verified before completion")
    if task["risk"] == "high":
        review = task.get("review", {})
        if review.get("status") != "passed" or not review.get("receipt"):
            raise ContractError(f"task {task_id} is high risk and requires a passed independent review receipt")
        if review.get("source_fingerprint") != task.get("verified_source_fingerprint"):
            raise ContractError(f"task {task_id} independent review is not bound to the verified source")
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
    command_graph_sync(state, capabilities, state_path, root, task_id)
    task["status"] = "done"
    task["completed_at"] = now_utc()
    reconcile(state)
    write_json_atomic(state_path, state)
    return task


def command_review(
    state: dict[str, Any],
    state_path: Path,
    root: Path,
    task_id: str,
    reviewer: str,
    status: str,
    summary: str,
    receipt: str,
) -> dict[str, Any]:
    task = get_task(state, task_id)
    if task["status"] != "verified":
        raise ContractError(f"task {task_id} must be verified before review")
    current_fingerprint = source_fingerprint(root)
    if current_fingerprint != task.get("verified_source_fingerprint"):
        raise ContractError(f"task {task_id} source changed after verification; verify it again before review")
    task["review"] = {
        "status": status,
        "reviewer": reviewer,
        "summary": summary,
        "receipt": receipt,
        "source_fingerprint": current_fingerprint,
        "reviewed_at": now_utc(),
    }
    write_json_atomic(state_path, state)
    return task["review"]


def command_block(state: dict[str, Any], state_path: Path, task_id: str, reason: str) -> dict[str, Any]:
    task = get_task(state, task_id)
    if task["status"] == "done":
        raise ContractError(f"task {task_id} is done and cannot be blocked")
    task["status"] = "blocked"
    task["blocker"] = {"reason": reason, "recorded_at": now_utc()}
    write_json_atomic(state_path, state)
    return task


def command_unblock(state: dict[str, Any], state_path: Path, task_id: str, resolution: str) -> dict[str, Any]:
    task = get_task(state, task_id)
    blocker = task.get("blocker")
    if task["status"] != "blocked" or not blocker:
        raise ContractError(f"task {task_id} does not have an active explicit blocker")
    history = task.setdefault("blocker_history", [])
    history.append({**blocker, "resolution": resolution, "resolved_at": now_utc()})
    task.pop("blocker", None)
    reconcile(state)
    write_json_atomic(state_path, state)
    return task


# Version 2 keeps source meaning in dedicated, hash-bound contracts.  The v1
# commands above remain intentionally intact so installed build packs can be
# migrated explicitly instead of being rewritten during an ordinary command.
V2_STATUSES = {"blocked", "ready", "in_progress", "verified", "integrated", "published", "done"}
V2_ROOT_KEYS = {
    "schema_version", "mode", "capabilities_file", "source_manifest_file", "requirements_file",
    "grommet_file", "automation_authority", "tasks", "extensions",
}
V2_TASK_KEYS = {
    "id", "title", "status", "dependencies", "risk", "risk_assessment", "source_changes",
    "requirement_ids", "context_files", "validation", "evidence", "model_route", "context_packet",
    "baseline_commit", "workspace", "operation_phase", "evidence_refs", "publication", "review",
    "blocker", "external_evidence", "verification_history", "started_at", "verified_at", "integrated_at",
    "published_at", "completed_at", "verified_commit", "integration_commit", "extensions",
}


def stable_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def digest_value(value: Any) -> str:
    return hashlib.sha256(stable_json(value).encode("utf-8")).hexdigest()


def normalized_section(path: Path, locator: dict[str, Any]) -> str:
    start, end = locator.get("start_line"), locator.get("end_line")
    if not isinstance(start, int) or not isinstance(end, int) or start < 1 or end < start:
        raise ContractError(f"invalid source section locator for {path}")
    lines = path.read_text(encoding="utf-8").splitlines()
    if end > len(lines):
        raise ContractError(f"source section locator exceeds file length: {path}")
    return "\n".join(line.rstrip() for line in lines[start - 1 : end]).strip() + "\n"


def v2_contract_paths(root: Path, state: dict[str, Any]) -> dict[str, Path]:
    defaults = {
        "source_manifest_file": "build-pack/source-manifest.json",
        "requirements_file": "build-pack/requirements.json",
        "grommet_file": "build-pack/grommet-approval.json",
    }
    paths: dict[str, Path] = {}
    for field, default in defaults.items():
        raw = state.get(field, default)
        if not isinstance(raw, str) or not raw:
            raise ContractError(f"{field} must be a repository-relative path")
        candidate = (root / raw).resolve()
        try:
            candidate.relative_to(root)
        except ValueError as exc:
            raise ContractError(f"{field} must resolve inside the repository") from exc
        paths[field] = candidate
    return paths


def v2_raw_contracts(root: Path, state: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    paths = v2_contract_paths(root, state)
    return tuple(read_json(paths[field]) for field in ("source_manifest_file", "requirements_file", "grommet_file"))  # type: ignore[return-value]


def v2_digest(root: Path, state: dict[str, Any], manifest: dict[str, Any], requirements: dict[str, Any]) -> str:
    task_plan = []
    for task in state.get("tasks", []):
        if isinstance(task, dict):
            task_plan.append({key: task.get(key) for key in ("id", "title", "dependencies", "requirement_ids", "risk", "publication")})
    return digest_value({"manifest": manifest, "requirements": requirements, "task_plan": task_plan})


def append_journal(root: Path, operation: str, phase: str, details: dict[str, Any]) -> None:
    journal = root / "build-pack" / JOURNAL_NAME
    journal.parent.mkdir(parents=True, exist_ok=True)
    entry = {"operation": operation, "phase": phase, "recorded_at": now_utc(), "details": details}
    with journal.open("a", encoding="utf-8", newline="\n") as stream:
        stream.write(stable_json(entry) + "\n")
        stream.flush()
        os.fsync(stream.fileno())


def write_receipt(root: Path, task_id: str, operation: str, payload: dict[str, Any]) -> str:
    path = root / "build-pack" / "evidence" / task_id / f"{operation}.json"
    if path.exists():
        raise ContractError(f"immutable evidence receipt already exists: {path}")
    write_json_atomic(path, payload)
    return path.relative_to(root).as_posix()


def ensure_v2_fields(state: dict[str, Any], capabilities: dict[str, Any], root: Path) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    if state.get("schema_version") != 2 or capabilities.get("schema_version") != 2:
        raise ContractError("v2 commands require schema_version 2 state and capabilities")
    unknown = set(state) - V2_ROOT_KEYS
    if unknown:
        raise ContractError(f"execution-state has unknown core fields: {sorted(unknown)}")
    if "extensions" in state and not isinstance(state["extensions"], dict):
        raise ContractError("execution-state.extensions must be an object")
    manifest, requirements, grommet = v2_raw_contracts(root, state)
    if manifest.get("schema_version") != 1 or requirements.get("schema_version") != 1 or grommet.get("schema_version") != 1:
        raise ContractError("source manifest, requirements map, and Grommet approval must use schema_version 1")
    if grommet.get("status") != "approved":
        raise ContractError("Grommet approval is required before execution")
    calculated = v2_digest(root, state, manifest, requirements)
    if grommet.get("candidate_digest") != calculated:
        raise ContractError("Grommet approval digest does not match the current build pack; reseal and reapprove it")
    sources: dict[tuple[str, str], str] = {}
    for source in manifest.get("sources", []):
        if not isinstance(source, dict) or source.get("authority") != "approved":
            raise ContractError("each source manifest entry must be an approved object")
        source_id, relative = source.get("id"), source.get("path")
        if not isinstance(source_id, str) or not isinstance(relative, str):
            raise ContractError("source manifest entries require id and path")
        path = (root / relative).resolve()
        try:
            path.relative_to(root)
        except ValueError as exc:
            raise ContractError("source manifest path must stay inside the repository") from exc
        if not path.is_file() or ".gitnexus" in path.parts:
            raise ContractError(f"invalid product authority source: {relative}")
        for section in source.get("sections", []):
            if not isinstance(section, dict) or not isinstance(section.get("id"), str):
                raise ContractError("source sections require an id")
            actual = hashlib.sha256(normalized_section(path, section.get("locator", {})).encode("utf-8")).hexdigest()
            if section.get("hash") != actual:
                raise ContractError(f"source section changed: {source_id}/{section.get('id')}")
            sources[(source_id, section["id"])] = actual
    requirement_ids: set[str] = set()
    for requirement in requirements.get("requirements", []):
        if not isinstance(requirement, dict) or not isinstance(requirement.get("id"), str):
            raise ContractError("requirements must have permanent ids")
        requirement_ids.add(requirement["id"])
        refs = requirement.get("sources")
        if not isinstance(refs, list) or not refs:
            raise ContractError(f"requirement {requirement['id']} has no source references")
        for ref in refs:
            if not isinstance(ref, dict) or (ref.get("source_id"), ref.get("section_id")) not in sources:
                raise ContractError(f"requirement {requirement['id']} has an unknown source section")
    graph = capabilities.get("graph", {})
    if graph.get("provider") != "gitnexus" or graph.get("version") != GITNEXUS_VERSION:
        raise ContractError(f"GitNexus version must be pinned to {GITNEXUS_VERSION}")
    if graph.get("license", {}).get("eligible") is not True:
        raise ContractError("GitNexus license eligibility must be explicitly confirmed")
    for task in state.get("tasks", []):
        if not isinstance(task, dict):
            raise ContractError("tasks must be objects")
        unknown_task = set(task) - V2_TASK_KEYS
        if unknown_task:
            raise ContractError(f"task {task.get('id', '<unknown>')} has unknown core fields: {sorted(unknown_task)}")
        if task.get("status") not in V2_STATUSES:
            raise ContractError(f"task {task.get('id', '<unknown>')} has invalid status")
        refs = task.get("requirement_ids")
        if not isinstance(refs, list) or not refs or any(item not in requirement_ids for item in refs):
            raise ContractError(f"task {task.get('id', '<unknown>')} must reference mapped requirements")
        score = task.get("risk_assessment", {})
        factors = ("blast_radius", "reversibility", "authority", "sensitive_data", "external_impact")
        if any(not isinstance(score.get(name), int) or score[name] not in {0, 1, 2} for name in factors):
            raise ContractError(f"task {task.get('id', '<unknown>')} has invalid measured-risk factors")
        total = sum(score[name] for name in factors)
        expected = "low" if total <= 2 else "medium" if total <= 5 else "high"
        publication = task.get("publication")
        if publication or score.get("authority") == 2 or score.get("sensitive_data") == 2:
            expected = "high"
        if task.get("risk") != expected:
            raise ContractError(f"task {task.get('id', '<unknown>')} risk does not match its measured assessment")
        checks = task.get("validation")
        if not isinstance(checks, list) or not checks:
            raise ContractError(f"task {task.get('id', '<unknown>')} must declare validation")
        tiers = {item.get("tier") for item in checks if isinstance(item, dict)}
        if not REQUIRED_TIERS[task["risk"]].issubset(tiers):
            raise ContractError(f"task {task.get('id', '<unknown>')} lacks validation for its risk tier")
        packet = task.get("context_packet", {})
        if not isinstance(packet, dict) or not isinstance(packet.get("window_tokens"), int) or not isinstance(packet.get("initial_tokens"), int):
            raise ContractError(f"task {task.get('id', '<unknown>')} must declare its context packet")
        if packet["initial_tokens"] > packet["window_tokens"] * 0.40:
            raise ContractError(f"task {task.get('id', '<unknown>')} initial context exceeds 40 percent of its model window")
        if publication:
            authority = state.get("automation_authority", {}).get("publication", {})
            required = {"destination", "artifact", "idempotency_key", "credential_refs", "attempts"}
            if not isinstance(publication, dict) or not required.issubset(publication):
                raise ContractError(f"task {task.get('id', '<unknown>')} publication contract is incomplete")
            if authority.get("enabled") is not True or publication["destination"] not in authority.get("destinations", []):
                raise ContractError(f"task {task.get('id', '<unknown>')} publication destination is not authorized")
            prefixes = authority.get("command_prefixes", [])
            if not isinstance(prefixes, list) or not prefixes:
                raise ContractError("publication authority must declare allowed command prefixes")
            for attempt in publication["attempts"]:
                argv = attempt.get("publish_argv") if isinstance(attempt, dict) else None
                if not isinstance(argv, list) or not any(argv[: len(prefix)] == prefix for prefix in prefixes if isinstance(prefix, list)):
                    raise ContractError(f"task {task.get('id', '<unknown>')} publication command is outside approved prefixes")
    return manifest, requirements, grommet


def v2_workspace_root(root: Path) -> Path:
    return root.parent / ".globalsetup-worktrees" / root.name


def run_git(argv: list[str], cwd: Path) -> str:
    result = run_argv(["git", *argv], cwd, timeout=120)
    if result.returncode != 0:
        raise ContractError(output_tail(result.stderr or result.stdout))
    return result.stdout.strip()


def v2_ensure_integration(root: Path, capabilities: dict[str, Any]) -> Path:
    workspace_root = v2_workspace_root(root)
    integration = workspace_root / "integration"
    if integration.exists():
        return integration
    workspace_root.mkdir(parents=True, exist_ok=True)
    base = run_git(["rev-parse", "HEAD"], root)
    branch = capabilities.get("workspace", {}).get("integration_branch", "globalsetup/integration")
    run_git(["worktree", "add", "-b", branch, str(integration), base], root)
    return integration


def v2_start(state: dict[str, Any], capabilities: dict[str, Any], root: Path, state_path: Path, task_id: str) -> dict[str, Any]:
    active = next((task for task in state["tasks"] if task["status"] in {"in_progress", "verified", "integrated"}), None)
    if active:
        raise ContractError(f"task {active['id']} is already active")
    task = get_task(state, task_id)
    if task["status"] != "ready":
        raise ContractError(f"task {task_id} is not ready")
    graph_status(root, capabilities)
    integration = v2_ensure_integration(root, capabilities)
    base = run_git(["rev-parse", "HEAD"], integration)
    path = v2_workspace_root(root) / task_id
    if path.exists():
        raise ContractError(f"managed task worktree already exists: {path}")
    branch = f"globalsetup/task-{task_id.lower()}"
    run_git(["worktree", "add", "-b", branch, str(path), base], root)
    operation = secrets.token_hex(12)
    append_journal(root, operation, "prepared", {"command": "start", "task_id": task_id, "baseline": base})
    task.update({"status": "in_progress", "started_at": now_utc(), "baseline_commit": base, "workspace": {"path": str(path), "branch": branch}, "operation_phase": "executed"})
    append_journal(root, operation, "executed", {"workspace": str(path)})
    write_json_atomic(state_path, state)
    append_journal(root, operation, "committed", {"state": "in_progress"})
    return task


def v2_verify(state: dict[str, Any], root: Path, state_path: Path, task_id: str) -> list[dict[str, Any]]:
    task = get_task(state, task_id)
    if task.get("status") != "in_progress":
        raise ContractError(f"task {task_id} must be in_progress before verification")
    workspace = Path(task.get("workspace", {}).get("path", root))
    if not workspace.is_dir():
        raise ContractError(f"task {task_id} worktree is unavailable")
    evidence: list[dict[str, Any]] = []
    operation = secrets.token_hex(12)
    append_journal(root, operation, "prepared", {"command": "verify", "task_id": task_id})
    for check in task.get("validation", []):
        if check.get("kind") != "command":
            continue
        argv = ensure_argv(check.get("argv"), f"{task_id} validation")
        result = run_argv(argv, workspace, timeout=int(check.get("timeout_seconds", 900)))
        receipt = {"name": check.get("name"), "kind": "command", "exit_code": result.returncode, "verified_at": now_utc(), "stdout": output_tail(result.stdout), "stderr": output_tail(result.stderr)}
        evidence.append(receipt)
        if result.returncode != 0:
            task.update({"status": "blocked", "blocker": {"reason": f"validation failed: {check.get('name')}", "recorded_at": now_utc()}, "evidence": evidence, "operation_phase": "verified"})
            write_json_atomic(state_path, state)
            append_journal(root, operation, "verified", {"result": "failed", "check": check.get("name")})
            raise VerificationFailed(f"validation failed: {check.get('name')}", receipt)
    head = run_git(["rev-parse", "HEAD"], workspace)
    if head == task.get("baseline_commit") and task.get("source_changes"):
        raise ContractError(f"task {task_id} has no committed change in its worktree")
    if run_git(["status", "--porcelain"], workspace):
        raise ContractError(f"task {task_id} worktree is dirty; commit or discard task-owned changes before verification")
    receipt_ref = write_receipt(root, task_id, operation, {"task_id": task_id, "commit": head, "evidence": evidence})
    task.update({"status": "verified", "verified_at": now_utc(), "evidence": evidence, "evidence_refs": [receipt_ref], "operation_phase": "verified", "verified_commit": head})
    write_json_atomic(state_path, state)
    append_journal(root, operation, "committed", {"receipt": receipt_ref})
    return evidence


def v2_integrate(state: dict[str, Any], capabilities: dict[str, Any], root: Path, state_path: Path, task_id: str) -> dict[str, Any]:
    task = get_task(state, task_id)
    if task.get("status") != "verified":
        raise ContractError(f"task {task_id} must be verified before integration")
    if task.get("risk") == "high" and task.get("review", {}).get("status") != "passed":
        raise ContractError(f"task {task_id} is high risk and requires a passed independent review before integration")
    integration = v2_ensure_integration(root, capabilities)
    if run_git(["status", "--porcelain"], integration):
        raise ContractError("managed integration worktree is dirty")
    operation = secrets.token_hex(12)
    append_journal(root, operation, "prepared", {"command": "integrate", "task_id": task_id})
    run_git(["merge", "--no-ff", "--no-edit", task["workspace"]["branch"]], integration)
    graph = capabilities["graph"]
    result = run_argv(ensure_argv(graph["sync_argv"], "graph.sync_argv"), integration, timeout=int(graph.get("timeout_seconds", 900)))
    if result.returncode != 0:
        raise ContractError(f"GitNexus sync failed after integration: {output_tail(result.stderr or result.stdout)}")
    task.update({"status": "integrated", "integrated_at": now_utc(), "integration_commit": run_git(["rev-parse", "HEAD"], integration), "operation_phase": "verified"})
    write_json_atomic(state_path, state)
    append_journal(root, operation, "committed", {"integration_commit": task["integration_commit"]})
    return task


def v2_publish(state: dict[str, Any], root: Path, state_path: Path, task_id: str) -> dict[str, Any]:
    task = get_task(state, task_id)
    if task.get("status") != "integrated" or not isinstance(task.get("publication"), dict):
        raise ContractError(f"task {task_id} must be an integrated publication task")
    publication = task["publication"]
    attempts = publication.get("attempts")
    if not isinstance(attempts, list) or not 1 <= len(attempts) <= 3 or len({item.get("strategy") for item in attempts if isinstance(item, dict)}) != len(attempts):
        raise ContractError("publication must declare one to three materially distinct attempts")
    workspace = v2_ensure_integration(root, {"workspace": {}})
    operation = secrets.token_hex(12)
    append_journal(root, operation, "prepared", {"command": "publish", "task_id": task_id, "idempotency_key": publication.get("idempotency_key")})
    records: list[dict[str, Any]] = []
    for attempt in attempts:
        publish = run_argv(ensure_argv(attempt.get("publish_argv"), "publication publish_argv"), workspace)
        health = run_argv(ensure_argv(attempt.get("health_argv"), "publication health_argv"), workspace)
        record = {"strategy": attempt["strategy"], "publish_exit_code": publish.returncode, "health_exit_code": health.returncode}
        records.append(record)
        if publish.returncode == 0 and health.returncode == 0:
            ref = write_receipt(root, task_id, operation, {"publication": publication, "attempts": records, "status": "published"})
            task.update({"status": "published", "published_at": now_utc(), "evidence_refs": task.get("evidence_refs", []) + [ref], "operation_phase": "verified"})
            write_json_atomic(state_path, state)
            append_journal(root, operation, "committed", {"receipt": ref})
            return {"status": "published", "attempts": records}
        rollback = attempt.get("rollback_argv")
        if rollback:
            run_argv(ensure_argv(rollback, "publication rollback_argv"), workspace)
    preview = publication.get("preview_argv")
    if preview:
        run_argv(ensure_argv(preview, "publication preview_argv"), workspace)
    task.update({"status": "blocked", "blocker": {"reason": "three publication attempts did not pass health checks", "recorded_at": now_utc()}, "operation_phase": "verified"})
    write_json_atomic(state_path, state)
    append_journal(root, operation, "verified", {"status": "preview_or_blocked", "attempts": records})
    raise ContractError("publication did not produce a healthy production release")


def v2_review(state: dict[str, Any], root: Path, state_path: Path, task_id: str, reviewer: str, status: str, summary: str, receipt: str) -> dict[str, Any]:
    task = get_task(state, task_id)
    if task.get("status") != "verified":
        raise ContractError(f"task {task_id} must be verified before review")
    review = {"reviewer": reviewer, "status": status, "summary": summary, "receipt": receipt, "commit": task.get("verified_commit"), "reviewed_at": now_utc()}
    task["review"] = review
    write_json_atomic(state_path, state)
    append_journal(root, secrets.token_hex(12), "committed", {"command": "review", "task_id": task_id, "status": status})
    return review


def v2_reconcile(state: dict[str, Any]) -> None:
    mapping = task_map(state)
    for task in state["tasks"]:
        if task["status"] in {"done", "in_progress", "verified", "integrated", "published"} or task.get("blocker"):
            continue
        task["status"] = "ready" if all(mapping[dep]["status"] == "done" for dep in task.get("dependencies", [])) else "blocked"


def v2_impact(state: dict[str, Any], root: Path, state_path: Path) -> dict[str, Any]:
    manifest, requirements, _ = v2_raw_contracts(root, state)
    changed_sections: set[tuple[str, str]] = set()
    for source in manifest.get("sources", []):
        if not isinstance(source, dict):
            continue
        path = root / str(source.get("path", ""))
        for section in source.get("sections", []):
            if not isinstance(section, dict) or not path.is_file():
                continue
            actual = hashlib.sha256(normalized_section(path, section.get("locator", {})).encode("utf-8")).hexdigest()
            if actual != section.get("hash"):
                changed_sections.add((str(source.get("id")), str(section.get("id"))))
    changed_requirements = {
        item["id"] for item in requirements.get("requirements", []) if isinstance(item, dict) and any(
            (ref.get("source_id"), ref.get("section_id")) in changed_sections for ref in item.get("sources", []) if isinstance(ref, dict)
        )
    }
    requirement_dependencies = {
        item["id"]: set(item.get("dependencies", [])) for item in requirements.get("requirements", []) if isinstance(item, dict) and isinstance(item.get("id"), str)
    }
    changed = True
    while changed:
        changed = False
        for requirement_id, dependencies in requirement_dependencies.items():
            if requirement_id not in changed_requirements and dependencies & changed_requirements:
                changed_requirements.add(requirement_id)
                changed = True
    changed_tasks = {task["id"] for task in state.get("tasks", []) if isinstance(task, dict) and any(req in changed_requirements for req in task.get("requirement_ids", []))}
    task_dependencies = {task["id"]: set(task.get("dependencies", [])) for task in state.get("tasks", []) if isinstance(task, dict) and isinstance(task.get("id"), str)}
    changed = True
    while changed:
        changed = False
        for task_id, dependencies in task_dependencies.items():
            if task_id not in changed_tasks and dependencies & changed_tasks:
                changed_tasks.add(task_id)
                changed = True
    for task in state.get("tasks", []):
        if isinstance(task, dict) and task.get("id") in changed_tasks and task.get("status") != "done":
            task["status"] = "blocked"
            task["blocker"] = {"reason": "approved source section changed; reseal and reapprove the affected plan", "recorded_at": now_utc()}
    if changed_tasks:
        write_json_atomic(state_path, state)
    result = {"changed_requirements": sorted(changed_requirements), "changed_tasks": sorted(changed_tasks), "source_manifest_digest": digest_value(manifest), "requirements_digest": digest_value(requirements)}
    append_journal(root, secrets.token_hex(12), "committed", {"command": "impact", **result})
    return result


def command_migrate(root: Path, state_path: Path, apply: bool) -> dict[str, Any]:
    state = read_json(state_path)
    if state.get("schema_version") == 2:
        return {"status": "already_v2"}
    if state.get("schema_version") != 1:
        raise ContractError("only schema_version 1 execution state can be migrated")
    capabilities_path = root / state.get("capabilities_file", "build-pack/capabilities.json")
    capabilities = read_json(capabilities_path)
    sources = []
    for index, relative in enumerate(state["source_authority"]["approved_sources"], start=1):
        path = root / relative
        lines = path.read_text(encoding="utf-8").splitlines()
        sources.append({"id": f"SRC-{index:03d}", "path": relative, "authority": "approved", "currentness": "current", "sections": [{"id": "whole-document", "locator": {"start_line": 1, "end_line": max(1, len(lines))}, "hash": hashlib.sha256(normalized_section(path, {"start_line": 1, "end_line": max(1, len(lines))}).encode("utf-8")).hexdigest()}]})
    manifest = {"schema_version": 1, "sources": sources}
    requirements = {"schema_version": 1, "requirements": [{"id": f"R-{task['id']}", "summary": task["title"], "sources": [{"source_id": source["id"], "section_id": "whole-document"} for source in sources], "acceptance_criteria": [check["name"] for check in task["validation"]], "tests": [check["name"] for check in task["validation"]], "tasks": [task["id"]], "dependencies": []} for task in state["tasks"]]}
    migrated = {key: value for key, value in state.items() if key in {"mode", "capabilities_file", "automation_authority", "tasks"}}
    migrated.update({"schema_version": 2, "source_manifest_file": "build-pack/source-manifest.json", "requirements_file": "build-pack/requirements.json", "grommet_file": "build-pack/grommet-approval.json"})
    for task in migrated["tasks"]:
        legacy_risk = task.get("risk")
        task["requirement_ids"] = [f"R-{task['id']}"]
        task.pop("requirement_sources", None)
        scores = {
            "low": {"blast_radius": 0, "reversibility": 0, "authority": 0, "sensitive_data": 0, "external_impact": 0},
            "medium": {"blast_radius": 1, "reversibility": 1, "authority": 1, "sensitive_data": 0, "external_impact": 0},
            "high": {"blast_radius": 2, "reversibility": 1, "authority": 1, "sensitive_data": 0, "external_impact": 2},
        }
        task["risk_assessment"] = scores.get(legacy_risk, scores["high"]).copy()
        if task.get("publication"):
            task["risk_assessment"]["authority"] = 2
            task["risk_assessment"]["external_impact"] = 2
        task["risk"] = "high" if task.get("publication") else legacy_risk
        task["model_route"] = {"worker": "standard", "verifier": "premium", "escalation": "operator"}
        task["context_packet"] = {"window_tokens": 32000, "initial_tokens": 12000, "retrieval": "targeted"}
        task["evidence_refs"] = []
        task["operation_phase"] = "prepared"
    migrated_caps = dict(capabilities)
    migrated_caps["schema_version"] = 2
    graph = dict(migrated_caps.get("graph", {}))
    graph.update({"version": GITNEXUS_VERSION, "repository_alias": root.name, "branch": "globalsetup/integration", "license": {"spdx": "PolyForm-Noncommercial-1.0.0", "eligible": True}, "sync_argv": ["gitnexus", "analyze", "--index-only", "--skip-agents-md", "--skip-skills", "--name", root.name, "--branch", "globalsetup/integration"]})
    migrated_caps["graph"] = graph
    migrated_caps["workspace"] = {"integration_branch": "globalsetup/integration", "serial": True}
    grommet = {"schema_version": 1, "status": "pending", "operator": "", "approved_at": "", "contradictions": state["source_authority"].get("contradictions", []), "candidate_digest": v2_digest(root, migrated, manifest, requirements)}
    result = {"status": "dry_run", "candidate_digest": grommet["candidate_digest"], "files": [str(state_path), str(capabilities_path), "build-pack/source-manifest.json", "build-pack/requirements.json", "build-pack/grommet-approval.json"]}
    if not apply:
        return result
    backup = state_path.with_suffix(".json.v1.bak")
    if backup.exists():
        raise ContractError(f"migration backup already exists: {backup}")
    shutil.copy2(state_path, backup)
    write_json_atomic(root / "build-pack" / "source-manifest.json", manifest)
    write_json_atomic(root / "build-pack" / "requirements.json", requirements)
    write_json_atomic(root / "build-pack" / "grommet-approval.json", grommet)
    write_json_atomic(capabilities_path, migrated_caps)
    write_json_atomic(state_path, migrated)
    append_journal(root, secrets.token_hex(12), "committed", {"command": "migrate", "backup": str(backup)})
    result["status"] = "migrated_pending_grommet_approval"
    return result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Target repository root")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("validate", help="Validate task state, context paths, tools, and evidence contracts")
    subparsers.add_parser("next", help="Return the active or next dependency-ready task and its context files")
    subparsers.add_parser("status", help="Return the complete durable execution state")
    for name, help_text in (
        ("start", "Claim one ready task after the GitNexus preflight"),
        ("verify", "Run required local commands and consume recorded external receipts"),
        ("complete", "Refresh GitNexus and complete a verified task"),
        ("graph-sync", "Refresh GitNexus for a verified task without completing it"),
    ):
        command = subparsers.add_parser(name, help=help_text, description=help_text)
        command.add_argument("task_id", help="Approved task identifier")
    block = subparsers.add_parser("block", help="Record a genuine task blocker")
    block.add_argument("task_id", help="Approved task identifier")
    block.add_argument("--reason", required=True, help="Precise blocking condition")
    unblock = subparsers.add_parser("unblock", help="Resolve a recorded task blocker")
    unblock.add_argument("task_id", help="Approved task identifier")
    unblock.add_argument("--resolution", required=True, help="Evidence that resolved the blocker")
    evidence = subparsers.add_parser(
        "record-evidence",
        help="Record a hosted or external verification receipt",
        description="Record a hosted or external verification receipt before verify.",
    )
    evidence.add_argument("task_id", help="Approved task identifier")
    evidence.add_argument("--check", required=True, help="Receipt validation name from execution state")
    evidence.add_argument("--location", required=True, help="Declared runtime or hosted location")
    evidence.add_argument("--source", required=True, help="Durable URL or external receipt identifier")
    evidence.add_argument("--summary", required=True, help="Observed result")
    review = subparsers.add_parser("review", help="Record source-bound independent review evidence")
    review.add_argument("task_id", help="Approved task identifier")
    review.add_argument("--reviewer", required=True, help="Independent reviewer identity")
    review.add_argument("--status", required=True, choices=("passed", "failed"), help="Review outcome")
    review.add_argument("--summary", required=True, help="Findings or no-blocker conclusion")
    review.add_argument("--receipt", required=True, help="Durable review task, thread, or artifact identifier")
    migrate = subparsers.add_parser("migrate", help="Create a reversible schema v2 build-pack migration")
    migrate.add_argument("--apply", action="store_true", help="Write the migration after reviewing the dry-run result")
    subparsers.add_parser("seal-plan", help="Return the current source-to-build digest for Grommet approval")
    subparsers.add_parser("impact", help="Record source-contract impact for the current build pack")
    subparsers.add_parser("recover", help="Inspect durable journal state and report incomplete operations")
    integrate = subparsers.add_parser("integrate", help="Merge a verified task worktree into the managed integration worktree")
    integrate.add_argument("task_id", help="Verified task identifier")
    publish = subparsers.add_parser("publish", help="Run the approved autonomous publication contract")
    publish.add_argument("task_id", help="Integrated publication task identifier")
    subparsers.add_parser("release-check", help="Confirm every approved task has integrated, reviewed release evidence")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    root = Path(args.root).resolve()
    state_path = root / "build-pack" / "execution-state.json"
    try:
        with StateLock(state_path):
            state = read_json(state_path)
            if args.command == "migrate":
                result = command_migrate(root, state_path, args.apply)
                emit_result(args.command, result)
                return 0
            capabilities_rel = state.get("capabilities_file", "build-pack/capabilities.json")
            capabilities_path = (root / capabilities_rel).resolve()
            try:
                capabilities_path.relative_to(root)
            except ValueError as exc:
                raise ContractError("capabilities_file must resolve inside the repository root") from exc
            capabilities = read_json(capabilities_path)
            if state.get("schema_version") == 2:
                if args.command == "seal-plan":
                    manifest, requirements, grommet = v2_raw_contracts(root, state)
                    emit_result(args.command, {"candidate_digest": v2_digest(root, state, manifest, requirements), "grommet_status": grommet.get("status")})
                    return 0
                if args.command == "impact":
                    result = v2_impact(state, root, state_path)
                    emit_result(args.command, result)
                    return 0
                manifest, requirements, grommet = ensure_v2_fields(state, capabilities, root)
                if args.command == "validate":
                    result = {"status": "valid", "schema_version": 2, "candidate_digest": v2_digest(root, state, manifest, requirements)}
                elif args.command == "status":
                    v2_reconcile(state)
                    write_json_atomic(state_path, state)
                    result = state
                elif args.command == "next":
                    v2_reconcile(state)
                    ready = next((task for task in state["tasks"] if task["status"] in {"in_progress", "verified", "integrated", "published"}), None)
                    result = ready or next((task for task in state["tasks"] if task["status"] == "ready"), None)
                    if result is None:
                        raise ContractError("no ready task; resolve blockers or complete active work")
                elif args.command == "recover":
                    journal = root / "build-pack" / JOURNAL_NAME
                    entries = [json.loads(line) for line in journal.read_text(encoding="utf-8").splitlines() if line.strip()] if journal.exists() else []
                    phases = {entry.get("operation"): entry.get("phase") for entry in entries}
                    incomplete = [operation for operation, phase in phases.items() if phase != "committed"]
                    result = {"journal_entries": len(entries), "incomplete_operations": incomplete, "status": "no automatic replay; inspect incomplete operations before retrying"}
                elif args.command == "start":
                    result = v2_start(state, capabilities, root, state_path, args.task_id)
                elif args.command == "verify":
                    result = v2_verify(state, root, state_path, args.task_id)
                elif args.command == "integrate":
                    result = v2_integrate(state, capabilities, root, state_path, args.task_id)
                elif args.command == "publish":
                    result = v2_publish(state, root, state_path, args.task_id)
                elif args.command == "review":
                    result = v2_review(state, root, state_path, args.task_id, args.reviewer, args.status, args.summary, args.receipt)
                elif args.command == "release-check":
                    incomplete = [task["id"] for task in state["tasks"] if task.get("status") != "done"]
                    if incomplete:
                        raise ContractError(f"release is incomplete; unfinished tasks: {incomplete}")
                    missing_reviews = [task["id"] for task in state["tasks"] if task.get("risk") == "high" and task.get("review", {}).get("status") != "passed"]
                    if missing_reviews:
                        raise ContractError(f"release lacks independent review for high-risk tasks: {missing_reviews}")
                    result = {"status": "release_ready", "tasks": len(state["tasks"]), "grommet_digest": grommet["candidate_digest"]}
                elif args.command == "complete":
                    task = get_task(state, args.task_id)
                    if task.get("status") not in ({"published"} if task.get("publication") else {"integrated"}):
                        raise ContractError(f"task {args.task_id} must be integrated and published when required before completion")
                    task.update({"status": "done", "completed_at": now_utc(), "operation_phase": "committed"})
                    v2_reconcile(state)
                    write_json_atomic(state_path, state)
                    result = task
                else:
                    raise ContractError(f"command {args.command} is not available for schema_version 2")
                emit_result(args.command, result)
                return 0
            contract_errors = validate_contract(state, capabilities, root)
            if contract_errors:
                raise ContractError("invalid execution contract: " + "; ".join(contract_errors))
            if args.command == "validate":
                result = command_validate(state, capabilities, root)
            elif args.command == "next":
                result = command_next(state, state_path)
            elif args.command == "status":
                if reconcile(state):
                    write_json_atomic(state_path, state)
                result = state
            elif args.command == "start":
                result = command_start(state, capabilities, state_path, root, args.task_id)
            elif args.command == "verify":
                result = command_verify(state, state_path, root, args.task_id)
            elif args.command == "graph-sync":
                result = command_graph_sync(state, capabilities, state_path, root, args.task_id)
            elif args.command == "complete":
                result = command_complete(state, capabilities, state_path, root, args.task_id)
            elif args.command == "record-evidence":
                result = command_record_evidence(
                    state,
                    state_path,
                    root,
                    args.task_id,
                    args.check,
                    args.location,
                    args.source,
                    args.summary,
                )
            elif args.command == "review":
                result = command_review(
                    state,
                    state_path,
                    root,
                    args.task_id,
                    args.reviewer,
                    args.status,
                    args.summary,
                    args.receipt,
                )
            elif args.command == "block":
                result = command_block(state, state_path, args.task_id, args.reason)
            elif args.command == "unblock":
                result = command_unblock(state, state_path, args.task_id, args.resolution)
            emit_result(args.command, result)
    except VerificationFailed as exc:
        emit_error(args.command, str(exc), exc.result)
        return 1
    except ContractError as exc:
        emit_error(args.command, str(exc))
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
