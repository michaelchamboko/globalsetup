---
name: context-scaling
description: Resume long-horizon work from durable BuildRunner state with task-bounded context.
---

# Context scaling

1. Finish the active bounded task when it remains safe and understandable to do so.
2. Record verification, graph evidence, review, completion, or a precise blocker through BuildRunner.
3. Start a fresh context at a task boundary, or earlier only when the current context can no longer execute the task reliably.
4. In the fresh context, read `AGENTS.md`, run BuildRunner `validate` and `next`, inspect Git status, and load only the selected task plus relevant GitNexus context.
5. Never reconstruct task status from chat history or maintain a parallel handover ledger.

Split tasks at real dependency, risk, validation, or permission boundaries. Do not force resets at arbitrary token percentages.
