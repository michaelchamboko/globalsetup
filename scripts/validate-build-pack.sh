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
    echo "âŒ Missing build-pack/$file"
    MISSING=$((MISSING + 1))
  else
    # Check if file is still empty or has placeholders
    if grep -q "<!-- TODO -->" "build-pack/$file" || grep -q "\[TODO\]" "build-pack/$file"; then
       echo "âš ï¸  build-pack/$file contains placeholder markers"
    else
       echo "âœ… build-pack/$file is present"
    fi
  fi
done

if [ $MISSING -eq 0 ]; then
  echo "ðŸŽ‰ All 17 build pack files are present!"
  exit 0
else
  echo "âŒ Missing $MISSING build pack file(s)!"
  exit 1
fi
