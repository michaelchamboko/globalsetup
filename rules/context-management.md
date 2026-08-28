---
alwaysApply: false
---

# Context Management Rules

- Load the root contract, execution state, active task card, and only the plans and code needed for that task.
- Use GitNexus query/context to retrieve architecture on demand instead of loading entire directories.
- Keep durable progress, evidence, blockers, and review state in `build-pack/execution-state.json`.
- Prefer a fresh context at a completed task boundary or when the active task can no longer be executed reliably in the current context.
- On resume, run BuildRunner `validate` and `next`; do not reconstruct progress from conversation history.
- Split a task when it crosses an independent dependency, risk, validation, or permission boundary. Do not split solely to satisfy an arbitrary token percentage or file count.
