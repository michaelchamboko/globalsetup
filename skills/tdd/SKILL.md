---
name: tdd
description: Use when the active task calls for test-driven implementation of a bounded behavior.
argument-hint: [feature description]
---

Execute strict Test-Driven Development (TDD) for the given feature:

1. **Red**: Write one failing test for the next smallest behavior. Assert specific values and run it to confirm the expected failure.
2. **Green**: Write the minimum code that makes the test pass.
3. **Refactor**: Remove relevant duplication without changing behavior. Write code that reads like the surrounding code: match its comment density, naming, structure, and idiom. Re-run the focused checks.
4. Repeat only while the active task has unproved acceptance criteria.
