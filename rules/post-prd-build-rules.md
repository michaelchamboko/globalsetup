---
alwaysApply: true
---

# Post-PRD Build Rules

These rules govern the structured workflow from a confirmed Product Requirements Document (PRD) to implementation.

## Build Planning is Required
* **No direct coding**: You are strictly prohibited from implementing features directly from a raw PRD without first generating a build pack.
* A build pack must consist of:
  1. Build Brief (technical translation, scope boundaries)
  2. codebase Discovery Report (mapping tech stack, structure, and constraints)
  3. Architecture Map (components, data flow, integrations)
  4. Data, API, UI, and Permission Contracts
  5. Task Graph (ordered checklist with dependency mappings)
  6. Task Cards (for fresh-context execution)

## Task Decomposition
* All features must be split into independent tasks, prioritized by dependencies.
* Foundation tasks (setup, DB schema, config) must be completed before API/UI layer tasks.
* Each task card must have clear, testable acceptance criteria.

## Fresh-Context Isolation for Large Builds
* When executing a large build, tasks must be run in fresh context sessions (or isolated environment runs) using the `fresh-context-execution` skill.
* Do not carry forward context debt or open handles from completed tasks.
* Verify each task card individually using its local verification commands before moving to the next.
