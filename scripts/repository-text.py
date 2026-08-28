#!/usr/bin/env python3
"""Validate tracked agent-facing text as strict UTF-8 with live local references."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


TEXT_SUFFIXES = {".json", ".md", ".mdc", ".py", ".ps1", ".sh", ".toml", ".yaml", ".yml"}
REFERENCE_SUFFIXES = {".json", ".md", ".mdc", ".py", ".ps1", ".sh"}
IGNORED_PARTS = {".git", ".gitnexus", ".globalsetup-backups", "node_modules", "__pycache__"}
MOJIBAKE_MARKERS = tuple(
    "".join(chr(codepoint) for codepoint in codepoints)
    for codepoints in (
        (0x00C3,),
        (0x00C2,),
        (0x00E2, 0x20AC),
        (0x00E2, 0x201E),
        (0x00E2, 0x0153),
        (0x00E2, 0x009D),
        (0x00E2, 0x201D),
        (0x00E2, 0x2013),
        (0x00E2, 0x2014),
        (0x00F0, 0x0178),
        (0x00EF, 0x00B8),
    )
)
MARKDOWN_LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")


def candidate_paths(root: Path, staged: bool) -> list[Path]:
    if staged:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
            cwd=root,
            capture_output=True,
            check=False,
        )
        if result.returncode != 0:
            message = result.stderr.decode("utf-8", errors="replace").strip()
            raise RuntimeError(f"could not inspect staged text: {message}")
        relative_paths = [
            item.decode("utf-8", errors="surrogateescape")
            for item in result.stdout.split(b"\0")
            if item
        ]
        return [root / relative for relative in relative_paths]
    return [path for path in root.rglob("*") if path.is_file() and not IGNORED_PARTS.intersection(path.parts)]


def validate_file(path: Path, root: Path) -> list[str]:
    if path.suffix.lower() not in TEXT_SUFFIXES or not path.exists():
        return []
    relative = path.relative_to(root).as_posix()
    try:
        text = path.read_text(encoding="utf-8", errors="strict")
    except UnicodeDecodeError as exc:
        return [f"{relative}: invalid UTF-8 at byte {exc.start}"]

    errors: list[str] = []
    for line_number, line in enumerate(text.split("\n"), start=1):
        marker = next((item for item in MOJIBAKE_MARKERS if item in line), None)
        if marker:
            errors.append(f"{relative}:{line_number}: mojibake marker {marker!r}")
        for character in line:
            if ord(character) < 32 and character not in {"\t"}:
                errors.append(
                    f"{relative}:{line_number}: control character U+{ord(character):04X}"
                )
                break
        if path.suffix.lower() != ".md":
            continue
        for match in MARKDOWN_LINK.finditer(line):
            target = match.group(1).strip().strip("<>").split("#", 1)[0].split("?", 1)[0]
            if not target or target.startswith(("http://", "https://", "mailto:", "#", "/")):
                continue
            if "[" in target or Path(target).suffix.lower() not in REFERENCE_SUFFIXES:
                continue
            resolved = (path.parent / target).resolve()
            try:
                resolved.relative_to(root)
            except ValueError:
                continue
            if not resolved.exists():
                errors.append(f"{relative}:{line_number}: missing local reference {target}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Repository or staged-tree root")
    parser.add_argument("--staged", action="store_true", help="Validate only staged text files")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    try:
        paths = candidate_paths(root, args.staged)
        errors = [error for path in paths for error in validate_file(path, root)]
    except RuntimeError as exc:
        print(f"repository text validation failed: {exc}", file=sys.stderr)
        return 2
    if errors:
        print("repository text validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print("repository text validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
