# Script to generate a fresh build-pack folder from templates (PowerShell).

if (Test-Path "build-pack\execution-state.json") {
    Write-Error "build-pack already exists; refusing to overwrite durable execution state."
    exit 2
}

Write-Host "Generating build-pack directory..."
New-Item -ItemType Directory -Path "build-pack" -Force | Out-Null
New-Item -ItemType Directory -Path "build-pack\build-plans" -Force | Out-Null
New-Item -ItemType Directory -Path "build-pack\tasks" -Force | Out-Null
New-Item -ItemType Directory -Path "build-pack\module-plans" -Force | Out-Null

Copy-Item .agents\templates\prd\confirmed-prd-template.md build-pack\00-confirmed-prd-summary.md -Force
Copy-Item .agents\templates\prd\prd-review-checklist.md build-pack\01-prd-review-checklist.md -Force
Copy-Item .agents\templates\build-requirements\build-brief-template.md build-pack\02-build-brief.md -Force
Copy-Item .agents\templates\build-requirements\implementation-contract-template.md build-pack\03-implementation-contract.md -Force
Copy-Item .agents\templates\architecture\architecture-discovery-template.md build-pack\04-existing-codebase-discovery.md -Force
Copy-Item .agents\templates\architecture\architecture-map-template.md build-pack\05-architecture-map.md -Force
Copy-Item .agents\templates\contracts\database-contract-template.md build-pack\06-database-contract.md -Force
Copy-Item .agents\templates\contracts\api-contract-template.md build-pack\07-api-contract.md -Force
Copy-Item .agents\templates\contracts\ui-contract-template.md build-pack\08-ui-contract.md -Force
Copy-Item .agents\templates\contracts\permissions-contract-template.md build-pack\09-permissions-contract.md -Force
Copy-Item .agents\templates\tasks\implementation-plan-template.md build-pack\10-implementation-plan.md -Force
Copy-Item .agents\templates\tasks\task-graph-template.md build-pack\11-task-graph.md -Force
Copy-Item .agents\templates\qa\test-plan-template.md build-pack\12-test-plan.md -Force
Copy-Item .agents\templates\qa\review-gate-template.md build-pack\13-review-gate.md -Force
Copy-Item .agents\templates\qa\rollback-plan-template.md build-pack\14-rollback-plan.md -Force
Copy-Item .agents\safeguards\pre-ship-checklist.md build-pack\15-pre-ship-checklist.md -Force
Copy-Item .agents\templates\qa\definition-of-done-template.md build-pack\16-definition-of-done.md -Force
Copy-Item .agents\templates\build-plans\build-plan-index-template.md build-pack\build-plans\01-build-plan-index.md -Force
Copy-Item .agents\templates\build-plans\ui-ux-build-plan-template.md build-pack\build-plans\02-ui-ux-build-plan.md -Force
Copy-Item .agents\templates\tasks\module-plan-template.md build-pack\module-plans\M-000-module-plan-template.md -Force
Copy-Item .agents\templates\tasks\ui-ux-module-plan-template.md build-pack\module-plans\M-000-ui-ux-module-plan-template.md -Force
Copy-Item .agents\templates\governance\capabilities-template.json build-pack\capabilities.json -Force
Copy-Item .agents\templates\governance\execution-state-template.json build-pack\execution-state.json -Force
Copy-Item .agents\templates\governance\source-manifest-template.json build-pack\source-manifest.json -Force
Copy-Item .agents\templates\governance\requirements-template.json build-pack\requirements.json -Force
Copy-Item .agents\templates\governance\grommet-approval-template.json build-pack\grommet-approval.json -Force
Copy-Item .agents\templates\governance\capabilities.schema.json build-pack\capabilities.schema.json -Force
Copy-Item .agents\templates\governance\execution-state.schema.json build-pack\execution-state.schema.json -Force
Copy-Item .agents\templates\governance\source-manifest.schema.json build-pack\source-manifest.schema.json -Force
Copy-Item .agents\templates\governance\requirements.schema.json build-pack\requirements.schema.json -Force
Copy-Item .agents\templates\governance\grommet-approval.schema.json build-pack\grommet-approval.schema.json -Force

Write-Host "Build pack documents and machine-readable execution state generated under build-pack/"
