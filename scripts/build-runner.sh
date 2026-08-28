#!/usr/bin/env bash
set -euo pipefail

PYTHON_BIN=""
for candidate in python3 python; do
  if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)' >/dev/null 2>&1; then
    PYTHON_BIN="$candidate"
    break
  fi
done
if [ -z "$PYTHON_BIN" ]; then
  echo "Python 3.10 or newer is required for the model-agnostic BuildRunner." >&2
  exit 2
fi

exec "$PYTHON_BIN" "$(dirname "$0")/build-runner.py" "$@"
