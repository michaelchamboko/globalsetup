---
alwaysApply: false
---

# Universal Agent Rules

These rules represent the baseline behavioral standards for any agent executing a task in this repository. 

## 12 Universal Principles

### 1. Plan Before Coding
* Do not edit files immediately after receiving a request.
* Use the approved build-pack plans and active task; do not create a competing implementation plan.
* Verify the task's declared context, code paths, and interfaces before proposing changes.

### 2. Do Not Code Blind
* Eagerly search and inspect files related to the task before making modifications.
* Identify existing utility functions, APIs, database tables, and design conventions to ensure new code aligns with them.

### 3. Simplicity First
Before writing any code, climb the ladder and stop at the first rung that holds:
1. Does this need to exist at all? (YAGNI) → skip it
2. Does stdlib do it? → use it
3. Native platform feature? → use it
4. Already-installed dependency? → use it
5. Can it be one line? → one line
6. Only then: minimum code that satisfies the requirement

Use the optional Ponytail skills only when the operator requests them or existing-code bloat is part of the active task.

### 4. Surgical Changes
* Limit modifications strictly to files within the scoped task area.
* Avoid refactoring unrelated code blocks, updating styling conventions in other files, or modifying configuration files unless explicitly directed.

### 5. Contract-Driven Development
* Implement against the approved schemas, APIs, UI props, permissions, and integration contracts referenced by the task.
* Return material contract gaps to phase 1 instead of inventing them during implementation.

### 6. Isolated Task Execution
* Break large features into independent, self-contained task cards.
* Write task cards with specific context baselines, module-plan references, validation locations, and testing commands so that any agent can execute them in a clean session.

### 7. Test-Driven Discipline
* Implement the smallest automated tests that prove the changed behavior at the appropriate boundary.
* Use the AAA (Arrange-Act-Assert) pattern and run or observe validation in the task card's declared location after each coherent change.
* Do not run local dependency installs, local production builds, local dev servers, or full local typechecks unless the operator explicitly opts into local preview.

### 8. Proportional Review Gates
* Load only reviewer checklists relevant to the task's risk and affected boundaries.
* High-risk tasks require independent review. Low- and medium-risk tasks are not blocked by unrelated specialist reviews.

### 9. Never Bypass Safeguards
* Do not run banned or dangerous commands under any circumstances (refer to the exact restrictions in `safeguards/dangerous-command-rules.md`).
* Protect sensitive credentials, configuration files, and package lockfiles.

### 10. Preserve Context & Integrity
* Maintain all existing comments, docstrings, formatting patterns, and lint requirements.
* Do not remove relevant coverage without recording why the approved behavior remains protected.

### 11. Clear Git Hygiene
* Commit code in logical, self-contained units.
* Write descriptive commit messages matching the project style (e.g. conventional commits).

### 12. Goal-Driven Resolution
* Keep working until the objective is fully met, intended-location validation passes, review findings are resolved, and the Definition of Done is satisfied.
