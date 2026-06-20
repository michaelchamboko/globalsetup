---
name: fresh-context-execution
description: Guidelines for executing a single task card in isolation, including the ponytail pre-build gate
argument-hint: [Task Card ID]
---

Follow these guidelines to execute a single task card in a fresh, isolated session to prevent context debt:

1. **🪡 Ponytail-debt scan (first)**: Run `ponytail-debt` before loading anything else. Surface any `ponytail:` shortcuts deferred from prior sessions. Any `no-trigger` marker must be resolved or accepted before new code is written.
2. Read the task card completely (specifically the Must-Haves, Module Plan Reference, Validation Location, and Verification Command/Hosted Check).
3. Load only the files listed under "Context Baseline".
4. **🪡 Ponytail ladder (pre-build gate)**: Before writing a single line, climb the ladder:
   - Does this task card need to produce new code at all, or does a stdlib/platform/installed-dep solution already exist?
   - Can the requirement be satisfied in one line?
   - Only if none of the above: write the minimum code to satisfy the card's acceptance criteria.
5. **Run Spec-First Check**: Use the declared validation location to ensure the spec is currently unmet or that the required check exists. If a spec check is missing, add the minimum check first.
6. Write/modify the minimum production code required to satisfy the card's objective and truths.
7. **Run Verification Command / Hosted Check**: Run or observe the verification specified on the card in the declared validation location.
8. Re-run or observe related hosted/runtime checks for regressions.
9. **🪡 Ponytail-review (post-build)**: Run `ponytail-review` on the diff. Action any `delete:` or `yagni:` finding with 0 risk before committing.
10. Commit and push according to the task card's delivery path, clear temporary variables, and prepare for the next task card.

Do not run local dependency installs, local application builds, local dev servers, or full local typechecks unless the task card cites explicit operator opt-in for local preview.
