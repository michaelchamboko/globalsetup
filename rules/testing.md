---
alwaysApply: true
---

# Testing & Verification Rules

These rules govern the implementation and execution of automated tests and release gates.

## 1. Two-Tier Testing Model (Delivery Gate)
We enforce a strict two-tier testing hierarchy to protect main branch integrity:
* **Tier 1 (Local Git Commit)**: Localized Micro-Task unit/integration tests must pass successfully before approving a local git commit. You are prohibited from staging and committing code that does not pass localized tests.
* **Tier 2 (GitHub Push)**: The holistic validation suite (full codebase typecheck, production build command, and global integration/E2E tests) must pass successfully on your machine before pushing the micro-commits to GitHub.

## 2. Test Execution & Feedback
* Run the specific, targeted test file after changes, not the full suite, during development. This provides faster feedback and conserves token limits.
* Flaky test? Fix it or delete it. Never retry in a loop to make it pass.

## 3. Test Design Conventions
* Verify behavior, not implementation details. Assert output states and values rather than verifying internal function call counts.
* Prefer real implementations. Mock only at system boundaries (network services, filesystem, system clock, randomness).
* Follow the Arrange-Act-Assert (AAA) pattern.
* One logical assertion per test. Test names must describe the expected behavior.
* Do not write loops, conditionals, or complex logic inside test functions.
* Never use dummy assertions like `expect(true)`. Always verify exact arguments and returns.
