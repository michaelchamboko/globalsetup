---
alwaysApply: true
---

# Git Workflow Rules

Maintain high git hygiene standards by following these conventions.

## Branch Naming
* Standard format: `<category>/<short-desc>`
  - Feature branch: `feat/feature-name` or `feature/feature-name`
  - Bug fix branch: `fix/bug-desc`
  - Hotfix branch: `hotfix/critical-bug`
  - Refactoring branch: `refactor/target-area`
  - Documentation: `docs/doc-area`
  - Chore / Setup: `chore/task-desc`

## Commits
* **Atomic Commits**: Commit changes in small, logical increments. Never bundle multiple features, or a feature and an unrelated bug fix, into a single commit.
* **Commit Message Format**: Follow conventional commits style:
  - Format: `<type>(<scope>): <subject>`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
  - Subject: Imperative, present tense, lowercase (e.g. `feat(auth): add JWT expiration handling`).

## Pull Requests
* Always create a branch for your work. Never work directly on `main` or `master` branches unless deploying a critical hotfix.
* PR description must include:
  1. Summary of changes.
  2. Requirements mapped (traceability).
  3. Testing proof (screenshots, command logs, coverage report).
  4. Rollback strategy.
* Request human review for all Pull Requests.
