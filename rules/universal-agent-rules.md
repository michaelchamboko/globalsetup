---
alwaysApply: true
---

# Universal Agent Rules

These rules represent the baseline behavioral standards for any agent executing a task in this repository. 

## 12 Universal Principles

### 1. Plan Before Coding
* Do not edit files immediately after receiving a request.
* Create or update the implementation plan (`implementation_plan.md`) for any complex changes.
* Verify your understanding of the codebase structure and interfaces before proposing changes.

### 2. Do Not Code Blind
* Eagerly search and inspect files related to the task before making modifications.
* Identify existing utility functions, APIs, database tables, and design conventions to ensure new code aligns with them.

### 3. Simplicity First
* Write readable, straightforward code. Avoid over-engineering, needless abstractions, or custom utility libraries when language features or existing helpers suffice.
* Prefer clean inline code over single-use, complex utility functions.

### 4. Surgical Changes
* Limit modifications strictly to files within the scoped task area.
* Avoid refactoring unrelated code blocks, updating styling conventions in other files, or modifying configuration files unless explicitly directed.

### 5. Contract-Driven Development
* Draft schemas, API endpoints, UI props, permissions, and service integrations in markdown files first.
* Share and align on contracts before beginning implementation.

### 6. Isolated Task Execution
* Break large features into independent, self-contained task cards.
* Write task cards with specific, localized context baselines and testing commands so that any agent can execute them in a clean session.

### 7. Test-Driven Discipline
* Implement automated tests (unit, integration, and E2E) alongside your code changes.
* Use the AAA (Arrange-Act-Assert) pattern and run local tests after every modification.

### 8. Specialist Review Gates
* Use the checklists defined in the `reviewers/` folder.
* Conduct structured reviews (code quality, security, performance, DB) before declaring a task or build complete.

### 9. Never Bypass Safeguards
* Do not run banned commands (e.g. force push to main, dropping production databases).
* Protect sensitive credentials, configuration files, and package lockfiles.

### 10. Preserve Context & Integrity
* Maintain all existing comments, docstrings, formatting patterns, and lint requirements.
* Never degrade test coverage.

### 11. Clear Git Hygiene
* Commit code in logical, self-contained units.
* Write descriptive commit messages matching the project style (e.g. conventional commits).

### 12. Goal-Driven Resolution
* Keep working until the objective is fully met, all tests are passing, lint errors are resolved, and the Definition of Done is satisfied.
