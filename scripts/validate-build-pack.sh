#!/usr/bin/env bash

# Checks build pack completeness.

echo "Validating build-pack documents..."
MISSING=0

for file in \
  00-confirmed-prd-summary.md \
  01-prd-review-checklist.md \
  02-build-brief.md \
  03-implementation-contract.md \
  04-existing-codebase-discovery.md \
  05-architecture-map.md \
  06-database-contract.md \
  07-api-contract.md \
  08-ui-contract.md \
  09-permissions-contract.md \
  10-implementation-plan.md \
  11-task-graph.md \
  12-test-plan.md \
  13-review-gate.md \
  14-rollback-plan.md \
  15-pre-ship-checklist.md \
  16-definition-of-done.md; do
  if [ ! -f "build-pack/$file" ]; then
    echo "[missing] build-pack/$file"
    MISSING=$((MISSING + 1))
  else
    if grep -q "<!-- TODO -->" "build-pack/$file" || grep -q "\[TODO\]" "build-pack/$file"; then
       echo "[placeholder] build-pack/$file contains placeholder markers"
    else
       echo "[ok] build-pack/$file is present"
    fi
  fi
done

if [ "$MISSING" -eq 0 ]; then
  for build_plan in \
    build-pack/build-plans/01-build-plan-index.md \
    build-pack/build-plans/02-ui-ux-build-plan.md; do
    if [ ! -f "$build_plan" ]; then
      echo "[missing] $build_plan"
      exit 1
    fi
  done

  if ! find build-pack/module-plans -maxdepth 1 -name 'M-*.md' ! -name 'M-000-*' | grep -q .; then
    echo "[missing] real build-pack/module-plans/M-*.md module plans beyond the M-000 template"
    exit 1
  fi
  echo "[ok] All 17 build pack files, build plans, and module plans are present"
  exit 0
else
  echo "[missing] $MISSING build pack file(s)"
  exit 1
fi
