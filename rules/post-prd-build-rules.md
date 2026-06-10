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
5. Module Plans (one plan per implementation module under `build-pack/module-plans/`)
6. Task Graph (ordered checklist with dependency mappings and module-plan references)
7. Task Cards (for fresh-context execution)

## 3. Task Decomposition & Orchestration
* All features must be split into independent tasks, prioritized by dependencies.
* Foundation tasks (setup, DB schema, config) must be completed before API/UI layer tasks.
* Each task card must have clear, testable acceptance criteria.
* Use `task-master` MCP to establish strict Input/Output contracts and manage task lifecycles.

## 4. Execution & Spec-Driven Verification Gates
* When executing a build, tasks must be run in fresh context sessions using the `fresh-context-execution` skill.
* Do not carry forward context debt or open handles from completed tasks.
* **Spec-First Execution**: Before modifying any functional code, verify that the test suite representing the specification (Must-Haves/Observable Truths) is in place and failing (Red). If no tests exist, write unit/integration tests representing the spec first.
* **Verification Command Gate**: You must execute the specific verification command or hosted validation check defined on the task card. It must run in the declared validation location and succeed before delivery is called complete.
* We enforce an **Intended-Location Validation** model:
  1. Micro-Task validation must run in the task card's declared validation location.
  2. For hosted applications, source changes are pushed to GitHub and build validation occurs in the intended platform such as Vercel or GitHub Actions.
  3. For external runtimes such as databases, workers, and infrastructure, validation occurs only in the approved target environment and only within the project's explicit permission boundary.
  4. Local app installs, local production builds, local dev servers, and local full-project typechecks are prohibited by default unless the operator explicitly opts into local preview.

