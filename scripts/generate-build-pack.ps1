# Script to generate a fresh build-pack folder from templates (PowerShell).

Write-Host "Generating build-pack directory..."
New-Item -ItemType Directory -Path "build-pack" -Force | Out-Null
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
Copy-Item .agents\templates\tasks\module-plan-template.md build-pack\module-plans\M-000-module-plan-template.md -Force

Write-Host "Build pack documents and module-plans generated under build-pack/"
