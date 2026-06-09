---
name: context-scaling
description: Monitor context capacity, execute log pruning via Caveman, and coordinate stateless handovers.
---

Follow these steps to manage and scale agent context dynamically:

## Step 1: Monitor Active Context Size
1. Periodically calculate the estimated token count of your active conversation session (history + loaded files).
2. Flag when the active context approaches **35% of maximum capacity** (Warning Threshold). If exceeded, evaluate if the current task needs to be split or if you need to prepare for a reset.
3. Trigger a handover when the active context reaches **45% of maximum capacity** (Critical Reset Threshold).

## Step 2: Prune Logs (Caveman)
1. Run `Caveman` to prune redundant logs, console outputs, and verbose test tracebacks from your session memory.
2. Verify that critical planning metadata remains intact.

## Step 3: Serialize State (Caveman Handover Payload)
If context size remains above 45% after pruning, serialize the session state into `state.md` at the project root using this exact template:
```markdown
## Handover State
* **Active Task**: [Task Card ID] - [Task Title]
* **Modified Files (Staged/Committed)**:
  - `[file/path/1]` (modified)
  - `[file/path/2]` (added)
* **Consolidated Context**: [2-3 sentences summarizing the exact achievements, architectural decisions, and verified logic in this session]
* **Target Files for Next Session**:
  - `[file/path/3]`
  - `[file/path/4]`
* **Next Action**: Execute [Next Task Card ID] - [Next Task Title]
```
3. Save and commit `state.md`.

## Step 4: Context Handover
1. Terminate the current session and spawn a fresh Master agent session (or reset the conversation history).
2. The fresh session must:
   - Read `state.md` and `project_rules.md` as its primary bootstrap instructions.
   - Load only the files listed under **Target Files for Next Session** in `state.md`.
   - Resume execution of the next task immediately with a clean history.

