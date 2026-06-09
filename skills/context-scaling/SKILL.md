---
name: context-scaling
description: Monitor context capacity, execute log pruning via Caveman, and coordinate stateless handovers.
---

Follow these steps to manage and scale agent context dynamically:

## Step 1: Monitor Active Context Size
1. Periodically calculate the estimated token count of your active conversation session (history + loaded files).
2. Flag when the active context approaches **45% of maximum capacity**.

## Step 2: Prune Logs (Caveman)
1. Run `Caveman` to prune redundant logs, console outputs, and verbose test tracebacks from your session memory.
2. Verify that critical planning metadata remains intact.

## Step 3: Serialize State to state.md
If context size remains above 45% after pruning, prepare for a stateless handover:
1. Open or create `state.md` at the project root.
2. Document the **Current State Baseline**:
   - Current git branch and last commit hash.
   - Architectural decisions made during this session.
   - Completed Micro-Tasks.
   - The exact next Micro-Task to execute.
   - List of baseline files required for the next task.
3. Save and commit `state.md`.

## Step 4: Context Handover
1. Instruct the system to reset the conversation history (or terminate the current session and spawn a fresh Master agent).
2. The fresh session must:
   - Read `state.md` as its primary bootstrap instruction.
   - Load only the baseline files listed in `state.md`.
   - Resume execution of the next Micro-Task without loading old context history.
