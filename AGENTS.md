# AGENTS.md — Universal Agent Instructions

You are an autonomous AI coding agent executing a build within this repository. You must adhere to the rules, workflows, and guidelines defined in this document at all times.

---

## 📋 The Post-PRD Pipeline

You must guide the build through the following 14-step pipeline:

```
Confirmed PRD
  ├── 1. PRD Review & Completeness Check
  ├── 2. Build Brief Generation
  ├── 3. Existing Codebase Discovery (Never write code blind)
  ├── 4. Architecture Map & Component Diagramming
  ├── 5. Data, API, UI, Permission, & Integration Contracts
  ├── 6. Task Graph Construction & Dependency Analysis
  ├── 7. Fresh-Context Task Cards Creation
  ├── 8. Isolated Task Execution (TDD Red-Green-Refactor)
  ├── 9. Automated Testing (Unit, Integration, E2E)
  ├── 10. Specialist Reviews (Security, Performance, DB, UI)
  ├── 11. Bug Fixes & Refinement
  ├── 12. Final Definition of Done Verification
  ├── 13. Pre-Ship Safeguards Check
  └── 14. Branch Commit, Push, and PR Creation
```

---

## 🧠 The 12 Universal Principles

1. **Plan Before Coding**: Never write code or modify files without first analyzing the requirements, codebase architecture, and dependencies.
2. **Do Not Code Blind**: Run codebase discovery before changing any files. Locate existing utility functions, models, and design patterns first.
3. **Simplicity First**: Implement the simplest correct solution. Avoid pre-optimization, excessive abstraction, and unnecessary code complexity.
4. **Surgical Changes**: Make precise, minimal edits. Avoid touching unrelated files or executing massive refactors during feature builds.
5. **Contract-Driven Development**: Define data, API, UI, and permission contracts *before* implementing the actual code.
6. **Isolated Task Execution**: Break large builds into independent task cards that can be executed in isolated sessions to prevent context debt.
7. **Test-Driven Discipline**: Write tests for all new functions, API endpoints, and UI components. Follow TDD loops (Red-Green-Refactor).
8. **Specialist Review Gates**: Subject your work to focused specialist reviews (security, performance, code quality, DB) before shipping.
9. **Never Bypass Safeguards**: Respect all protected files, dangerous command restrictions, and pre-ship checklists.
10. **Preserve Context & Integrity**: Preserve existing comments, docstrings, and formatting rules. Never drop existing tests.
11. **Clear Git Hygiene**: Write meaningful, structured commit messages. Maintain clean feature branches.
12. **Goal-Driven Resolution**: Do not stop until the feature meets the Definition of Done and passes all verification checks.

---

## 📂 System Directory Map

Use this map to navigate the build system:

* **Rules (`.agents/rules/` or `rules/`)**: Behavioral rules governing your execution.
  * `universal-agent-rules.md` — Explains the 12 universal principles.
  * `karpathy-guidelines.md` — Details build discipline guidelines.
  * `post-prd-build-rules.md` — Strict rules for the post-PRD workflow.
  * `code-quality.md`, `testing.md`, `database.md`, `security.md`, `frontend.md`, `error-handling.md`, `git-workflow.md`.
* **Skills (`.agents/skills/` or `skills/`)**: Actionable, step-by-step workflow definitions.
  * `prd-to-build-pack/SKILL.md` — Step-by-step guide to generating the build pack.
  * `repo-discovery/SKILL.md` — Codebase discovery guide.
  * `architecture-map/SKILL.md` — Architecture mapping instructions.
  * `task-graph/SKILL.md` — Task decomposition and task card creation.
  * `fresh-context-execution/SKILL.md` — Execution of task cards in fresh context.
  * `tdd/SKILL.md`, `pr-review/SKILL.md`, `ship/SKILL.md`.
* **Templates (`.agents/templates/` or `templates/`)**: Build pack templates to fill in.
  * `prd/`, `build-requirements/`, `architecture/`, `contracts/`, `tasks/`, `qa/`.
* **Reviewers (`.agents/reviewers/` or `reviewers/`)**: Specialist checklists.
  * `code-reviewer.md`, `security-reviewer.md`, `performance-reviewer.md`, `database-reviewer.md`.
* **Safeguards (`.agents/safeguards/` or `safeguards/`)**:
  * `dangerous-command-rules.md` — Protected command rules.
  * `protected-files.md` — Protected files list.

---

## 🚀 Execution Guide

When instructed to begin a build:
1. Locate the confirmed PRD.
2. Read the `prd-to-build-pack` skill (`skills/prd-to-build-pack/SKILL.md`).
3. Follow the steps in that skill to perform codebase discovery, create your architecture plan, define contracts, and map out the task graph.
4. Execute the tasks in dependency order.
5. Apply the specialist reviewers and complete the pre-ship safeguards before wrapping up.
