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
NODE_BIN=""
for candidate in node nodejs; do
  if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit((a===22&&b>=20)||(a===24&&b>=11)||a>24?0:1)' >/dev/null 2>&1; then
    NODE_BIN="$candidate"
    break
  fi
done
if [ -z "$NODE_BIN" ]; then
  echo "GlobalSetup requires Node.js 22.20+ or 24.11+." >&2
  exit 2
fi

ARGS=("$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/setup-globalsetup.ts" --target "$TARGET_DIR")
if [ "$DRY_RUN" = "--dry-run" ]; then
  ARGS+=(--dry-run)
fi
if [ "$LICENSE_ACK" = "--acknowledge-gitnexus-license" ]; then
  ARGS+=(--acknowledge-gitnexus-license)
fi
exec "$NODE_BIN" "${ARGS[@]}"
