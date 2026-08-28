# GlobalSetup Agent Contract

## Purpose

This repository is bootstrapped once after the source PRD and supporting product documents are approved. Setup installs the build pack, safety hook, GitNexus, and the model-agnostic BuildRunner. Implementation planning is phase 1; autonomous implementation is phase 2. There is no second setup.

## Sources of truth

Use these in order:

1. `build-pack/execution-state.json` — task dependencies, risk, status, and evidence.
2. The active task card and its referenced module plan.
3. Approved contracts and plans under `build-pack/`.
4. The code and current GitNexus graph.

Markdown checklists explain intent. BuildRunner owns execution state. Do not maintain a competing task ledger.

## Start or resume

1. Read this file and the next task only; load deeper rules when the task requires them.
2. Inspect Git status and preserve unrelated or user-owned changes.
3. Run `scripts/build-runner.py --root . validate`.
4. Run `gitnexus status`. If missing or stale, run `gitnexus analyze` before trusting graph results.
5. Run `scripts/build-runner.py --root . next` and work on exactly that ready task.

If a harness cannot invoke Python directly, use `scripts/build-runner.ps1` or `scripts/build-runner.sh` with the same arguments.

## Phase 1: compile the approved build

- Do not implement production code from a raw PRD.
- Complete the build brief, discovery, architecture, contracts, module plans, task graph, task cards, and test plan.
- Compile every approved task into `build-pack/execution-state.json` with dependencies, risk, source-change intent, and argument-array validation commands.
- Ask the operator only about material product or architecture choices not resolved by approved documents.
- Phase 1 ends when the operator approves the plans and BuildRunner validation passes.

## Phase 2: execute end to end

For each task:

1. `next` — select the next dependency-ready task.
2. Use GitNexus query/context and impact analysis to locate the smallest safe change.
3. `start TASK_ID` — claims the one allowed in-progress task after graph preflight.
4. Implement only the task contract. Prefer the simplest working change and test the required behavior.
5. `verify TASK_ID` — runs the task's risk-tiered checks and records evidence.
6. For high-risk work, record an independent review with `review TASK_ID`.
7. `complete TASK_ID` — automatically updates GitNexus, records a fresh graph receipt, closes the task, and unlocks dependants. Completion fails if GitNexus cannot update.
8. Continue immediately until the approved graph is done or a real stop condition occurs.

Never edit task status by hand during execution. Use `block TASK_ID --reason ...` for a genuine blocker and `unblock TASK_ID --resolution ...` once it is resolved.

## Proportional verification

- `low`: focused task check only.
- `medium`: focused plus affected-area checks.
- `high`: focused, affected, full-system checks, and independent review.

Do not turn every task into a release gate. A failing required check blocks that task; unrelated heavyweight checks do not block low- or medium-risk MVP progress.

## GitNexus contract

GitNexus is mandatory and is used under the repository's declared noncommercial scope.

- Query the graph before broad text search when learning architecture or flows.
- Run impact analysis before changing an existing symbol or interface.
- Run change detection before committing when the CLI or MCP adapter supports it.
- Every `complete` command must re-index GitNexus and record a fresh receipt, even for a task that declares no source changes. The local `.gitnexus/` index is never committed.
- If GitNexus is unavailable, stop instead of inventing graph results or silently falling back.

## Engineering rules

- State assumptions before consequential edits; verify cheap facts from the repository.
- Keep changes surgical. Do not add abstractions, dependencies, personas, or infrastructure without demonstrated need.
- Preserve existing tests, comments, formatting, and unrelated work.
- Use argument arrays and non-shell process execution for repository-owned automation.
- Never expose secrets. Respect the permission and destructive-change contracts.
- Use fresh context at task boundaries when helpful; durable state lives in the repository, not conversation history.

## Delivery boundary

- GitHub is for source updates, branches, pull requests, and manual review.
- GitHub Actions workflows and hosted runners are prohibited. GitHub is source control and manual review only.
- Run validation in the location named by the task contract. Do not substitute a local check for required hosted or production evidence.
- Do not install application dependencies, start application runtimes, or run production builds locally unless the task contract or operator explicitly permits it. GlobalSetup's own bootstrap tools are the exception.

## Load detailed guidance only when applicable

- Planning: `.agents/rules/post-prd-build-rules.md` and `.agents/skills/prd-to-build-pack/SKILL.md`.
- Task execution: `.agents/skills/mcp-orchestration/SKILL.md` and `.agents/skills/fresh-context-execution/SKILL.md`.
- Graph work: `.agents/rules/mcp-integration-rules.md` and `.agents/skills/repo-discovery/SKILL.md`.
- Testing, security, database, frontend, performance, accessibility, deployment, and incident work: load only the matching rule, skill, and reviewer.
- Before delivery: `.agents/safeguards/pre-ship-checklist.md` and the relevant risk-tier reviewers.

## Stop conditions

Stop and report one precise blocker only when:

- an approved requirement is materially ambiguous or contradictory;
- required authority, credentials, runtime, or GitNexus is unavailable;
- a required validation or high-risk review fails; or
- continuing would exceed the task's permission boundary.

Ordinary task completion, commits, context boundaries, and passing checks are not reasons to stop before the approved build is complete.
