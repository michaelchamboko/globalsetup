#!/usr/bin/env python3
"""Fail closed when staged repository content violates GlobalSetup boundaries."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path, PurePosixPath


def staged_paths(root: Path) -> list[str]:
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
        cwd=root,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        message = result.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"could not inspect staged paths: {message}")
    return [item.decode("utf-8", errors="surrogateescape") for item in result.stdout.split(b"\0") if item]


def violation(path: str) -> str | None:
    normalized = path.replace("\\", "/")
    if normalized.startswith("./"):
        normalized = normalized[2:]
    lowered = normalized.lower()
    name = PurePosixPath(lowered).name
    if lowered.startswith(".github/workflows/"):
        return "GitHub Actions workflows and runners are prohibited; GitHub is source control only"
    if name == ".env" or name.startswith(".env."):
        return "environment files may contain secrets"
    if name.endswith((".pem", ".key")) or name in {"id_rsa", "credentials.json"}:
        return "likely credential material must not be committed"
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Git repository root")
    parser.add_argument("--staged", action="store_true", help="inspect staged paths")
    args = parser.parse_args()
    if not args.staged:
        parser.error("--staged is required")

    root = Path(args.root).resolve()
    try:
        violations = [(path, reason) for path in staged_paths(root) if (reason := violation(path))]
    except RuntimeError as exc:
        print(f"repository guard failed closed: {exc}", file=sys.stderr)
        return 2
    if violations:
        print("repository guard blocked the commit:", file=sys.stderr)
        for path, reason in violations:
            print(f"- {path}: {reason}", file=sys.stderr)
        return 1
    print("repository guard passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
