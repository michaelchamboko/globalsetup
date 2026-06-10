---
name: fresh-context-execution
description: Guidelines for executing a single task card in isolation
argument-hint: [Task Card ID]
---

Follow these guidelines to execute a single task card in a fresh, isolated session to prevent context debt:

1. Read the task card completely (specifically the Must-Haves, Module Plan Reference, Validation Location, and Verification Command/Hosted Check).
2. Load only the files listed under "Context Baseline".
3. **Run Spec-First Check**: Use the declared validation location to ensure the spec is currently unmet or that the required check exists. If a spec check is missing, add the minimum check first.
4. Write/modify the minimum production code required to satisfy the card's objective and truths.
5. **Run Verification Command / Hosted Check**: Run or observe the verification specified on the card in the declared validation location.
6. Re-run or observe related hosted/runtime checks for regressions.
7. Commit and push according to the task card's delivery path, clear temporary variables, and prepare for the next task card.

Do not run local dependency installs, local application builds, local dev servers, or full local typechecks unless the task card cites explicit operator opt-in for local preview.

