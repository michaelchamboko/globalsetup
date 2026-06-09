---
alwaysApply: true
---

# Karpathy-Inspired Build Discipline Guidelines

Adhere to these 4 core guidelines for engineering discipline during software construction:

## 1. Think Before Coding (Cognitive Prep)
* Spend significant time analyzing the problem space before writing code.
* Identify the exact data paths, constraints, and edge cases.
* Inspect files that interact with the target component to understand existing patterns.

## 2. Simplicity First (No Abstraction Bloat)
* Avoid "future-proofing" the codebase. Implement only what is requested in the simplest possible manner.
* Do not introduce frameworks, complex patterns, or boilerplate utilities when a direct, readable approach will do.
* Refactor code only to make it cleaner and more readable for the immediate scope, not for hypothetical future expansion.

## 3. Surgical Changes (Precise Scope)
* Make the smallest possible code changes to satisfy the requirements.
* Keep diffs clean and easy to review.
* Avoid touching unrelated files or executing massive refactors during feature builds.

## 4. Goal-Driven Execution (Relentless Completion)
* Focus single-mindedly on satisfying the defined acceptance criteria and Definition of Done.
* Keep iterating, debugging, and testing until all tests pass and the solution is complete.
* Do not stop or exit until verification is fully completed.
