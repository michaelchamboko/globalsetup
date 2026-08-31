#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="."
DRY_RUN=""
LICENSE_ACK=""
for argument in "$@"; do
  case "$argument" in
    --dry-run) DRY_RUN="--dry-run" ;;
    --acknowledge-gitnexus-license) LICENSE_ACK="--acknowledge-gitnexus-license" ;;
    *) TARGET_DIR="$argument" ;;
  esac
done
PYTHON_BIN=""
for candidate in python3 python; do
  if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)' >/dev/null 2>&1; then
    PYTHON_BIN="$candidate"
    break
  fi
done
if [ -z "$PYTHON_BIN" ]; then
  echo "GlobalSetup requires Python 3.10 or newer." >&2
  exit 2
fi

ARGS=("$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/setup-globalsetup.py" --target "$TARGET_DIR")
if [ "$DRY_RUN" = "--dry-run" ]; then
  ARGS+=(--dry-run)
fi
if [ "$LICENSE_ACK" = "--acknowledge-gitnexus-license" ]; then
  ARGS+=(--acknowledge-gitnexus-license)
fi
exec "$PYTHON_BIN" "${ARGS[@]}"
