---
name: mcp-orchestration
description: Execute the approved task graph through the model-agnostic BuildRunner and GitNexus.
---

# Build orchestration

1. Run BuildRunner `validate`, then `next`.
2. Read only the selected task card, referenced plans, and relevant GitNexus context.
3. Use GitNexus impact analysis for existing symbols or interfaces in scope.
4. Run `start TASK_ID` and implement only that task's input/output contract.
5. Run `verify TASK_ID`. Fix only failures caused by or required for the task.
6. For high-risk work, obtain a genuinely independent review and record it with `review TASK_ID`.
7. Run `complete TASK_ID`; it must update GitNexus and record a fresh graph receipt before marking the task done.
8. Immediately select the next ready task.

An agent harness may delegate bounded implementation or review work when useful, but role-play, sub-agents, and MCP lifecycle services are not required. BuildRunner state remains authoritative.
