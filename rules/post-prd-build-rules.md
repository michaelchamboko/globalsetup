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

## 4. Execution & Testing Gates
* When executing a large build, tasks must be run in fresh context sessions using the `fresh-context-execution` skill.
* Do not carry forward context debt or open handles from completed tasks.
* We enforce a **Two-Tier Testing** model:
  1. Localized Micro-Task tests must pass to clear a local git commit.
  2. The holistic validation suite (full typecheck, project build, and global integration tests) must pass successfully before micro-commits are pushed to GitHub.
