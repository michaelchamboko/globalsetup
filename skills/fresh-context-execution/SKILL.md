---
name: fresh-context-execution
description: Guidelines for executing a single task card in isolation
argument-hint: [Task Card ID]
---

Follow these guidelines to execute a single task card in a fresh, isolated session to prevent context debt:

1. Read the task card completely.
2. Load only the files listed under "Context Baseline".
3. Write/modify the minimum code to satisfy the card's objective.
4. Run the local automated verification command specified on the card.
5. Re-run related tests to check for regressions.
6. Commit the changes, clear temporary variables, and prepare for the next task card.
