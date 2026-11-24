#!/usr/bin/env bash
set -euo pipefail

NODE_BIN=""
for candidate in node nodejs; do
  if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit((a===22&&b>=20)||(a===24&&b>=11)||a>24?0:1)' >/dev/null 2>&1; then
    NODE_BIN="$candidate"
    break
  fi
done
if [ -z "$NODE_BIN" ]; then
  echo "Node.js 22.20+ or 24.11+ is required for BuildRunner." >&2
  exit 2
fi

exec "$NODE_BIN" "$(dirname "$0")/build-runner.ts" "$@"
