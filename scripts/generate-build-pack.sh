#!/usr/bin/env bash

# Script to generate a fresh build-pack folder from templates.

echo "Generating build-pack directory..."
mkdir -p build-pack
mkdir -p build-pack/build-plans
mkdir -p build-pack/tasks
mkdir -p build-pack/module-plans

# Map templates to build-pack files
cp .agents/templates/prd/confirmed-prd-template.md build-pack/00-confirmed-prd-summary.md
cp .agents/templates/prd/prd-review-checklist.md build-pack/01-prd-review-checklist.md
cp .agents/templates/build-requirements/build-brief-template.md build-pack/02-build-brief.md
cp .agents/templates/build-requirements/implementation-contract-template.md build-pack/03-implementation-contract.md
cp .agents/templates/architecture/architecture-discovery-template.md build-pack/04-existing-codebase-discovery.md
cp .agents/templates/architecture/architecture-map-template.md build-pack/05-architecture-map.md
cp .agents/templates/contracts/database-contract-template.md build-pack/06-database-contract.md
cp .agents/templates/contracts/api-contract-template.md build-pack/07-api-contract.md
cp .agents/templates/contracts/ui-contract-template.md build-pack/08-ui-contract.md
cp .agents/templates/contracts/permissions-contract-template.md build-pack/09-permissions-contract.md
cp .agents/templates/tasks/implementation-plan-template.md build-pack/10-implementation-plan.md
cp .agents/templates/tasks/task-graph-template.md build-pack/11-task-graph.md
cp .agents/templates/qa/test-plan-template.md build-pack/12-test-plan.md
cp .agents/templates/qa/review-gate-template.md build-pack/13-review-gate.md
cp .agents/templates/qa/rollback-plan-template.md build-pack/14-rollback-plan.md
cp .agents/safeguards/pre-ship-checklist.md build-pack/15-pre-ship-checklist.md
cp .agents/templates/qa/definition-of-done-template.md build-pack/16-definition-of-done.md
cp .agents/templates/build-plans/build-plan-index-template.md build-pack/build-plans/01-build-plan-index.md
cp .agents/templates/build-plans/ui-ux-build-plan-template.md build-pack/build-plans/02-ui-ux-build-plan.md
cp .agents/templates/tasks/module-plan-template.md build-pack/module-plans/M-000-module-plan-template.md
cp .agents/templates/tasks/ui-ux-module-plan-template.md build-pack/module-plans/M-000-ui-ux-module-plan-template.md

echo "Build pack documents, build-plans, and module-plans generated under build-pack/"
