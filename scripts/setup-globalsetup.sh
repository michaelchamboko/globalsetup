#!/usr/bin/env bash

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

chmod +x "$TARGET_DIR/scripts/"*.sh

echo "GlobalSetup configuration copied successfully!"
