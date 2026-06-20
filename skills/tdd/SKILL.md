---
name: tdd
description: Test-Driven Development loop — with ponytail gate before the first test is written.
argument-hint: [feature description]
---

Execute strict Test-Driven Development (TDD) for the given feature:

0. **🪡 Ponytail ladder (before red)**: Does this feature need to exist at all? Is there a stdlib/platform/native solution? Can the acceptance criteria be met with zero new code? If the answer to any of these is yes, document it and stop — don't write the test.
1. **Red**: Write a single failing test for the next smallest behavior. Assert specific values. Run it and verify it fails. Use the simplest possible test form — no framework overhead for a one-liner.
2. **Green**: Write the minimum, simplest code to make the test pass. Hardcoding is acceptable initially.
3. **Refactor**: Clean up the code (remove duplication, improve names) without changing behavior. Verify all tests stay green. Run `ponytail-review` on the refactored diff — shrink before committing.
4. Repeat the cycle, working from degenerate cases to happy path, variations, edge cases, and error cases.
