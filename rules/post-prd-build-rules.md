---
alwaysApply: false
---

# Post-PRD Build Rules

## Planning gate

- Do not implement production code directly from a raw or unapproved PRD.
- Complete the build brief, discovery report, architecture, contracts, build plans, module plans, task graph, task cards, and test plan.
- Resolve material product or architecture ambiguity with the operator during planning.
- Compile the approved task graph into `build-pack/execution-state.json`; BuildRunner validation is the machine gate into execution.

## Task contract

Every task must declare:

- a unique id, title, dependencies, and status;
- `low`, `medium`, or `high` risk;
- whether it changes source;
- focused validation and the additional tiers required by its risk;
- argument-array commands, intended validation location, and referenced plans.

Keep tasks independently verifiable. Split by dependency or permission boundary, not by arbitrary file counts.

## Execution gate

- Use BuildRunner for every lifecycle transition; never maintain a competing status file.
- Use GitNexus before editing existing symbols. BuildRunner completion must update GitNexus and record a fresh receipt after every task.
- Work on one in-progress task at a time.
- A failed required check blocks that task. Do not run unrelated full-suite gates for low- or medium-risk work.
- High-risk work requires full validation and independent review before completion.
- Continue through ready tasks without asking for routine approval.

## Delivery boundary

Validation must run where the approved task says it belongs. GitHub is source control and manual review only; GitHub Actions workflows and hosted runners are prohibited. Local application installs, servers, and production builds require an approved task exception. GlobalSetup and GitNexus bootstrap tools are allowed during setup.
