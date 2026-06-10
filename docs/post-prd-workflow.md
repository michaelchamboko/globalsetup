# Post-PRD Workflow (Two-Step Development Cycle)

This document details the complete, two-step pipeline from a confirmed Product Requirements Document (PRD) to iteration and deployment.

---

## 🛠️ Step 1: Planning, Blueprinting, & Dependency Alignment

Step 1 is a strictly **human-in-the-loop planning phase**. The agent's goal is to construct the complete implementation plans, contracts, and test matrices without modifying any functional application code.

### Phase 1: PRD Review & Completeness Check
Verify the PRD is actionable using `templates/prd/prd-review-checklist.md`:
* All requirements are specific, measurable, and testable.
* Constraints, non-goals, and edge cases are documented.
* Stakeholders have approved the PRD.

### Phase 2: Build Brief
Create a technical build brief translating the PRD into architecture-level details using `templates/build-requirements/build-brief-template.md`.

### Phase 3: Existing Codebase Discovery
Before starting architecture mapping, inspect the target project using the `repo-discovery` skill and `CodeGraph`. Output findings to `build-pack/04-existing-codebase-discovery.md`.

### Phase 4: Architecture Map & ADRs
Model component relationships and write Architectural Decision Records (ADRs) using `templates/architecture/architecture-map-template.md`.

### Phase 5: Interface Contracts
Define and write data schemas, API routes, UI components, permission matrices, and external service contracts under `templates/contracts/`.

### Phase 6: Build Plans
Create visible build plans under `build-pack/build-plans/`.

Required build plans:
* `01-build-plan-index.md` — modular build index, runtimes, validation locations, and task ownership.
* `02-ui-ux-build-plan.md` — required for user-facing products; defines IA, screen workflows, interaction patterns, design posture, accessibility, and hosted validation.

### Phase 7: Module Plans
Create one module plan per implementation area under `build-pack/module-plans/` using `templates/tasks/module-plan-template.md`.
Each module plan must define ownership, boundaries, files likely involved, dependencies, target runtime, validation location, and task breakdown.
User-facing projects must include a dedicated UI/UX module plan using `templates/tasks/ui-ux-module-plan-template.md`.

### Phase 8: Task Graph & Sizing Heuristics
Decompose plans into ordered task graphs.
* Apply task-sizing heuristics: No single task card may modify more than **3 source files** or require more than **3 implementation steps**.
* Isolate infrastructure and database test fixtures into separate "Foundation" task cards.
* Every task must reference the module plan it belongs to.

### Phase 9: Task Card Specification & Test Matrices
Generate the final execution task cards. Each card must define:
* Scoped context files (Context Baseline).
* Must-Haves (Observable Truths & Target Artifacts).
* The exact `verification_command` or hosted validation check to execute.
* The `validation_location` where the check must run.

### ⚠️ Step 1 Human-in-the-Loop Policies (CRITICAL):
1. **Zero-Assumption Policy**: If details are missing from the PRD, or if a more optimal implementation, library, or design approach exists, the agent **MUST** pause, document its recommendation, and request explicit operator input. **Auto-approvals are strictly blocked during Step 1.**
2. **Plan Dependency Ripple Review**: If a plan for a module or task changes during design reviews, immediately trace and adjust all other dependent plans and modules to maintain global consistency.
3. **Completion Gate**: Step 1 is finished only when all plans, task cards, and test cases are verified as complete and approved by the human operator.

---

## 🚀 Step 2: Iterative Execution & Deployment

Step 2 is the iterative implementation of the approved task cards. This phase is characterized by autonomous, sequential execution of task cards under any agent harness.

### Phase 8: Isolated Task Execution (TDD Loop)
For each task card, the agent starts a fresh context session and follows the spec-first loop:
1. **Read Task Card**: Inspect must-haves, context baseline, and verification CLI command.
2. **Red State Check**: Use the declared validation location to confirm the spec is unmet or that tests/checks are in place. If missing, create the minimum spec check first.
3. **Implement**: Write the minimum code necessary to satisfy the truths.
4. **Green State Check**: Run or observe the declared validation check in the intended location.
5. **Regression Check**: Use hosted or target-runtime validation, not local app builds by default.
6. **Commit/Push**: Save changes and push so the intended platform can validate them.

### Phase 9: Automated Testing & Specialist Review
Run targeted reviews (security, performance, code style, database) on the diff and re-verify the changes before final staging.

### Phase 10: Stateless Scaling (Caveman Resets)
During long execution sessions:
* **Warning Check (35% capacity)**: Check if the task runs over context budgets.
* **Handover Reset (45% capacity)**: Serialize current state to `state.md` using the standardized Caveman Handover Payload, terminate the session, and resume in a fresh context.

### Phase 11: Deployment & Global Verification
* Push source changes to GitHub and verify the configured intended platform.
* For Vercel-hosted apps, use Vercel install/build/deploy logs as the production build check.
* For database or worker tasks, validate in the approved target runtime only.
* Do not run local application installs, production builds, dev servers, or full local typechecks unless the operator explicitly opts into local preview.

### Phase 12: Ship
Push the short-lived branch/PR to GitHub, verify status checks, and prepare for human code merge.

### 🚀 Step 2 Autonomous Policies (CRITICAL):
1. **Autonomous Development**: The agent executes Step 2 with **full autonomy**. Human-in-the-loop approvals are **NOT** required for ordinary commits, task-to-task transitions, sub-agent spawning, hosted validation checks, or plan traversal.
2. **Sequential & Modular Methods**: Build the codebase in a modular method strictly following the sequence established in Step 1. Leverage specialized sub-agent roles (`Planner-Agent`, `Builder-Agent`, `Review-Agent`), trace dependencies via `CodeGraph`, manage lifecycles via `task-master`, and keep logical continuity via `Sequential Thinking`.
3. **Escalation Exception**: The agent must only halt and ask the operator if:
   - It encounters a crucial requirement that was not reviewed or documented in Step 1.
   - It hits a severe blocker (e.g., missing third-party access, environment failures).
