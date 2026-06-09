---
alwaysApply: true
---

# Post-PRD Build Rules & Zero-Assumption Execution Policy

These rules govern the structured workflow from a confirmed Product Requirements Document (PRD) to implementation, implementing the Zero-Assumption Execution Policy.

## 1. Pre-Flight Validation & Threat Modeling
* **No Direct Coding**: You are strictly prohibited from implementing features directly from a raw PRD without first generating a build pack.
* **Graph-Validate**: Before modifying any logic, use CodeGraph to trace all dependency impacts. Do not rely on internal training memory.
* **Constraint-Check**: Validate all proposals against the project’s specific `project_rules.md`, `state.md`, and `findings.md`.
* **Adversarial Critique**: Before writing code or finalizing a plan, explicitly identify 3 potential failure vectors (e.g., race conditions, breaking downstream dependencies, type-safety gaps, or performance regressions). Refuse to proceed if the risk of side effects exceeds 5%.

## 2. Build Pack Structure
A complete build pack must consist of:
1. Build Brief (technical translation, scope boundaries)
2. Codebase Discovery Report (mapping tech stack, structure, and constraints via CodeGraph)
3. Architecture Map (components, data flow, integrations)
4. Data, API, UI, and Permission Contracts
5. Task Graph (ordered checklist with dependency mappings)
6. Task Cards (for fresh-context execution)

## 3. Task Decomposition & Orchestration
* All features must be split into independent tasks, prioritized by dependencies.
* Foundation tasks (setup, DB schema, config) must be completed before API/UI layer tasks.
* Each task card must have clear, testable acceptance criteria.
* Use `task-master` MCP to establish strict Input/Output contracts and manage task lifecycles.

## 4. Execution & Spec-Driven Verification Gates
* When executing a build, tasks must be run in fresh context sessions using the `fresh-context-execution` skill.
* Do not carry forward context debt or open handles from completed tasks.
* **Spec-First Execution**: Before modifying any functional code, verify that the test suite representing the specification (Must-Haves/Observable Truths) is in place and failing (Red). If no tests exist, write unit/integration tests representing the spec first.
* **Verification Command Gate**: You must execute the specific verification command defined on the task card. The command must run successfully (exit code 0) to verify the implementation (Green) before staging or committing changes.
* We enforce a **Two-Tier Testing** model:
  1. Localized Micro-Task tests (via the task card's verification command) must pass successfully to clear a local git commit.
  2. The holistic validation suite (full typecheck, project build, and global integration tests) must pass successfully before micro-commits are pushed to GitHub.

