---
name: mcp-orchestration
description: Use when starting, resuming, or coordinating more than one approved BuildRunner task.
---

# Build orchestration

1. Run BuildRunner `validate`, then `next`.
2. Execute the returned task with the `fresh-context-execution` skill and its declared `context_files`.
3. After BuildRunner completes the task and refreshes GitNexus, run `next` again.
4. Continue until the graph is complete or BuildRunner reports a stop condition.

BuildRunner state is authoritative. Harness delegation may help with a bounded task or independent review, but it must not create another lifecycle ledger.
