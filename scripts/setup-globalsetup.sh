#!/usr/bin/env bash

set -euo pipefail

# Setup script to copy GlobalSetup files to a target project directory.
# Usage: bash setup-globalsetup.sh /path/to/target/project

TARGET_DIR="${1:-.}"

if [ ! -d "$TARGET_DIR" ]; then
  echo "Target directory $TARGET_DIR does not exist. Creating..."
  mkdir -p "$TARGET_DIR"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GS_DIR="$(dirname "$SCRIPT_DIR")"

echo "Copying GlobalSetup configuration from $GS_DIR to $TARGET_DIR..."

# Copy AGENTS.md to root
if [ -f "$TARGET_DIR/AGENTS.md" ]; then
  echo "AGENTS.md already exists. Backing up to AGENTS.md.bak..."
  cp "$TARGET_DIR/AGENTS.md" "$TARGET_DIR/AGENTS.md.bak"
fi
cp "$GS_DIR/AGENTS.md" "$TARGET_DIR/"

# Copy rules, skills, templates, reviewers, safeguards to .agents/
AGENT_CONFIG_DIR="$TARGET_DIR/.agents"
mkdir -p "$AGENT_CONFIG_DIR"

for folder in rules skills templates reviewers safeguards; do
  if [ -d "$AGENT_CONFIG_DIR/$folder" ]; then
    echo "Backing up existing $folder to $folder.bak..."
    mv "$AGENT_CONFIG_DIR/$folder" "$AGENT_CONFIG_DIR/$folder.bak"
  fi
  cp -r "$GS_DIR/$folder" "$AGENT_CONFIG_DIR/"
done

# Copy scripts to target/scripts for execution
mkdir -p "$TARGET_DIR/scripts"
cp "$GS_DIR/scripts/generate-build-pack.sh" "$TARGET_DIR/scripts/"
cp "$GS_DIR/scripts/generate-build-pack.ps1" "$TARGET_DIR/scripts/"
cp "$GS_DIR/scripts/validate-build-pack.sh" "$TARGET_DIR/scripts/"
cp "$GS_DIR/scripts/validate-build-pack.ps1" "$TARGET_DIR/scripts/"
cp "$GS_DIR/scripts/build-runner.py" "$TARGET_DIR/scripts/"
cp "$GS_DIR/scripts/build-runner.ps1" "$TARGET_DIR/scripts/"
cp "$GS_DIR/scripts/build-runner.sh" "$TARGET_DIR/scripts/"
cp "$GS_DIR/scripts/pre-tool-hook.ps1" "$TARGET_DIR/scripts/"
cp "$GS_DIR/scripts/repository-guard.py" "$TARGET_DIR/scripts/"

chmod +x "$TARGET_DIR/scripts/"*.sh

if [ ! -f "$TARGET_DIR/.gitnexusrc" ]; then
  cp "$GS_DIR/.gitnexusrc" "$TARGET_DIR/.gitnexusrc"
fi
touch "$TARGET_DIR/.gitignore"
if ! grep -Fxq '.gitnexus/' "$TARGET_DIR/.gitignore"; then
  printf '\n.gitnexus/\n' >> "$TARGET_DIR/.gitignore"
fi

if [ ! -d "$TARGET_DIR/.git" ]; then
  git -C "$TARGET_DIR" init --quiet
fi

EXISTING_HOOKS_PATH="$(git -C "$TARGET_DIR" config --local --get core.hooksPath || true)"
if [ -n "$EXISTING_HOOKS_PATH" ] && [ "$EXISTING_HOOKS_PATH" != ".githooks" ] && [ "$EXISTING_HOOKS_PATH" != "./.githooks" ]; then
  echo "Existing core.hooksPath '$EXISTING_HOOKS_PATH' must be integrated manually; setup will not overwrite it." >&2
  exit 2
fi
mkdir -p "$TARGET_DIR/.githooks"
if [ -f "$TARGET_DIR/.githooks/pre-commit" ] && ! cmp -s "$GS_DIR/scripts/pre-commit" "$TARGET_DIR/.githooks/pre-commit"; then
  if [ -e "$TARGET_DIR/.githooks/pre-commit.user" ]; then
    echo "Both .githooks/pre-commit and pre-commit.user exist; setup will not overwrite either hook." >&2
    exit 2
  fi
  mv "$TARGET_DIR/.githooks/pre-commit" "$TARGET_DIR/.githooks/pre-commit.user"
fi
cp "$GS_DIR/scripts/pre-commit" "$TARGET_DIR/.githooks/pre-commit"
chmod +x "$TARGET_DIR/.githooks/pre-commit"
git -C "$TARGET_DIR" config --local core.hooksPath .githooks

PYTHON_BIN=""
for candidate in python3 python; do
  if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)' >/dev/null 2>&1; then
    PYTHON_BIN="$candidate"
    break
  fi
done
if [ -z "$PYTHON_BIN" ]; then
  echo "BuildRunner requires Python 3.10 or newer." >&2
  exit 2
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "GitNexus requires Node.js and npm. Install Node.js 22.18+ or 24.11+ and rerun setup." >&2
  exit 2
fi
if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit((a===22&&b>=18)||(a===24&&b>=11)||a>24?0:1)'; then
  echo "GitNexus requires Node.js 22.18+ or 24.11+." >&2
  exit 2
fi

if ! command -v gitnexus >/dev/null 2>&1; then
  echo "Installing GitNexus for declared noncommercial use..."
  npm install --global gitnexus@latest
fi

(
  cd "$TARGET_DIR"
  gitnexus analyze
  if [ ! -f .gitnexus/run.cjs ]; then
    echo "GitNexus did not create its repository-local runner." >&2
    exit 2
  fi
  GITNEXUS_STATUS="$(node .gitnexus/run.cjs status)"
  if ! printf '%s\n' "$GITNEXUS_STATUS" | grep -Eiq '^[[:space:]]*Status:[[:space:]]*(✅[[:space:]]*)?up[- ]to[- ]date[[:space:]]*$'; then
    echo "GitNexus did not report an up-to-date index." >&2
    exit 2
  fi
  gitnexus setup
  if [ ! -f build-pack/execution-state.json ]; then
    bash scripts/generate-build-pack.sh
  fi
)

echo "GlobalSetup installed: build pack, BuildRunner, safety hook, and GitNexus index are ready."
