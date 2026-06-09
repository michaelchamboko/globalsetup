---
name: tdd
description: Test-Driven Development loop. Write a failing test first, then minimum code to pass, then refactor.
argument-hint: [feature description]
---

Execute strict Test-Driven Development (TDD) for the given feature:

1. **Red**: Write a single failing test for the next smallest behavior. Assert specific values. Run it and verify it fails.
2. **Green**: Write the minimum, simplest code to make the test pass. Hardcoding is acceptable initially.
3. **Refactor**: Clean up the code (remove duplication, improve names) without changing behavior. Verify all tests stay green.
4. Repeat the cycle, working from degenerate cases to happy path, variations, edge cases, and error cases.
