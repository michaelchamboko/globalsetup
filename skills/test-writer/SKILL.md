---
name: test-writer
description: Automatically writes comprehensive tests for new or changed code
---

Generate comprehensive automated tests for changed files:

1. Identify modified files using git diff or status.
2. Map all execution paths (happy path, edge cases, error cases, boundaries).
3. Write one test per scenario using the Arrange-Act-Assert (AAA) pattern.
4. Assert specific output values and states, not vague conditions.
5. Run the new tests and verify they pass. Ensure coverage goals are met.
