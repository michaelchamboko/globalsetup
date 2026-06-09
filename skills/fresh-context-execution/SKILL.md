---
name: fresh-context-execution
description: Guidelines for executing a single task card in isolation
argument-hint: [Task Card ID]
---

Follow these guidelines to execute a single task card in a fresh, isolated session to prevent context debt:

1. Read the task card completely (specifically the Must-Haves and Verification Command).
2. Load only the files listed under "Context Baseline".
3. **Run Spec-First Check**: Run the verification command or check the test file to ensure the spec fails (Red). If a spec test is missing, write the unit/integration test representing the expected spec behavior first and verify that it fails.
4. Write/modify the minimum production code required to satisfy the card's objective and truths.
5. **Run Verification Command**: Run the local verification command specified on the card. Ensure it succeeds (Green) with exit code 0.
6. Re-run related tests to check for regressions.
7. Commit the changes locally (localized micro-test passed), clear temporary variables, and prepare for the next task card.

