---
alwaysApply: true
---

# Context Management & Stateless Scaling Rules

Managing your context budget is critical to maintaining accuracy, preventing hallucinations, and avoiding token cost/session bloat.

## 1. Context Budget Discipline
* Keep the turn context size as small as possible.
* Do not read entire folders or run broad recursive lists unless executing codebase discovery.
* Read only the files scoped to the current task card.

## 2. Stateless Scaling (Monitoring & Reset Thresholds)
* **Monitor Capacity**: Actively monitor the token capacity of your active session.
* **Warning Threshold (35% capacity)**: Check if the current task card is going to exceed the context budget. If so, immediately plan a context split or prepare for serialization.
* **Critical Reset Threshold (45% capacity)**: When context reaches **45% of maximum capacity**, you must:
  1. Trigger the `Caveman` utility/MCP to prune redundant logs and thought history.
  2. Serialize the current active state, architecture decisions, and remaining tasks to `state.md` (following the standardized Caveman Handover Payload).
  3. Force a context handover to a fresh Master or Sub-agent session.
* **Fresh Handovers**: The new agent session must boot with a clean history and load only the baseline files documented in `state.md`.

## 3. Context Debt Prevention
* Context Debt accumulates when you maintain a long, multi-turn history with extensive file reads and tool outputs.
* To reset context debt:
  1. Commit your current work.
  2. Complete the current task card.
  3. Start a new session (fresh context) for the next task card.
  4. Only retrieve files specified in the next task card's context baseline.

## 4. When to Split a Task (Auto-Sizing Heuristics)
* To ensure tasks remain small enough to conserve context, you must split a task card into smaller, independent cards if:
  - The list of source files likely modified exceeds **3 files** (excluding tests).
  - The implementation steps require more than **3 discrete code modifications** (across any files).
  - The testing plan requires setting up complex fixtures or external boundaries (databases, mock APIs). Any complex test/infrastructure setup must be isolated into its own "Foundation" task card.

