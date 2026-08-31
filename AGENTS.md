# GlobalSetup Agent Contract

## Purpose

GlobalSetup runs once after the source PRD and supporting documents are approved. It installs a model-agnostic planning and execution contract, GitNexus, and the BuildRunner. Planning is phase 1 and implementation is phase 2; there is no second setup.

## Sources of truth

Use these in order:

1. `build-pack/execution-state.json` for task status, dependencies, risk, context, and evidence.
2. The approved `source_authority`, mandatory Grommet review, and `context_files` returned with the active task.
3. Approved contracts and plans under `build-pack/`.
4. The code and current GitNexus graph.

BuildRunner owns lifecycle state. Markdown explains intent and must not become a competing task ledger.

## Start or resume

1. Inspect Git status and preserve unrelated or operator-owned changes.
2. Run `python scripts/build-runner.py --root . validate`.
3. Run `node .gitnexus/run.cjs status`; refresh a missing or stale index before trusting it.
4. Run `python scripts/build-runner.py --root . next`.
5. Load exactly the returned task's approved `requirement_sources` and `context_files`, then use GitNexus context and impact analysis for the symbols in scope.

Run `python scripts/build-runner.py --help` for the authoritative command interface. PowerShell and Bash wrappers accept the same arguments.

## Build phases

- Phase 1 registers approved sources, states build intent, resolves contradictions, completes the mandatory Grommet source-to-build review, and compiles source-backed requirements into discovery, architecture, contracts, module plans, task cards, risk tiers, context files, and validation contracts. It ends when the operator approves the build and BuildRunner validation passes.
- Every task traces to approved `requirement_sources`. GitNexus is derived structural evidence only and cannot introduce, reinterpret, or override product requirements.
- Phase 2 executes one dependency-ready task at a time through `.agents/skills/fresh-context-execution/SKILL.md` until the graph is complete or a stop condition occurs.

## Engineering contract

- Write code that reads like the surrounding code: match its comment density, naming, structure, and idiom.
- Treat the nearest maintained code, repository formatters, and tests as the style authority; do not normalize adjacent code.
- State consequential assumptions and verify cheap facts from the repository.
- Prefer the smallest working change. Add no speculative abstractions, dependencies, personas, or infrastructure.
- Preserve unrelated work and never expose credentials.
- Repository automation uses argument arrays and non-shell process execution.

## Execution and evidence

- `command` validation runs a declared argument array locally.
- `receipt` validation represents hosted or external evidence and must be recorded with `record-evidence` before `verify`.
- Low-risk tasks require task evidence; medium-risk tasks add affected-area evidence; high-risk tasks add full evidence and a source-bound independent review receipt.
- `complete` always refreshes GitNexus and records a fresh graph receipt, including for tasks without source changes.
- Exactly one task may be active. Use BuildRunner for transitions and blockers; never edit task status by hand.

## Delivery boundary

- GitHub is source control and manual review only. GitHub Actions workflows and hosted runners are prohibited.
- Validation runs in the location declared by the task. A local result cannot replace required hosted or production evidence.
- Application installs, dev servers, production builds, external writes, and publications require an approved task contract. Publication proceeds automatically to destinations declared in `automation_authority`; do not request repeated confirmation. GlobalSetup bootstrap tools are the exception.

## Progressive guidance

- Planning: `.agents/rules/post-prd-build-rules.md` and `.agents/skills/prd-to-build-pack/SKILL.md`.
- One task: use the returned `context_files`; they are the deterministic rule, skill, plan, code, and reviewer route.
- Repository discovery or graph work: `.agents/skills/repo-discovery/SKILL.md`.
- Delivery: `.agents/safeguards/pre-ship-checklist.md` plus the reviewers named by the task.

## Stop conditions

Stop with one precise blocker only for a material contradiction in approved requirements, missing authority or runtime, unavailable GitNexus, failed required evidence, operator cancellation, or a permission-boundary conflict. Passing checks and ordinary task transitions are reasons to continue.
