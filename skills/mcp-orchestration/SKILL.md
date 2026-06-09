---
name: mcp-orchestration
description: Lifecycle management, task decomposition, and sub-agent routing via the task-master MCP.
---

Follow these steps to orchestrate tasks and manage sub-agent execution using the `task-master` MCP:

## Step 1: Initialize Objective
1. Run `task-master` to define the main task objective.
2. Link the objective to the PRD requirements.
3. Establish the `task_plan.md` file in your workspace to track progress.

## Step 2: Task Decomposition
1. Act as the `[Planner-Agent]` to decompose the high-level objective into the smallest possible atomic, independent units of work (**Micro-Tasks**).
2. Ensure each Micro-Task is scoped to a small set of files and maps to a clean, isolated commit.
3. Organize the Micro-Tasks in dependency order.

## Step 3: Define Input/Output Contracts
For each Micro-Task, prior to spawning a sub-agent:
1. Define the **Input Contract**:
   - The current code state.
   - The exact files to read.
   - The exact requirements to satisfy.
2. Define the **Output Contract**:
   - The expected file changes (new or modified files).
   - The specific linting, compilation, and unit verification commands.
   - The localized testing metrics.

## Step 4: Dispatch & Sub-Agent Execution
1. Route the Micro-Task to a specialized sub-agent based on the task type:
   - `[Builder-Agent]`: Performs clean code implementation.
   - `[Review-Agent]`: Performs adversarial review and checks unit test results.
2. Enforce execution strictly within the bounds of the current Micro-Task's contract.

## Step 5: Evaluate & Synthesize
1. Ingest the sub-agent's outputs.
2. Check the output against the defined contract.
3. Run the micro-validation tests locally.
4. **Reject and respawn** the sub-agent if the contract is violated, tests fail, or scope creep is detected.
5. Once verified, execute a local Git commit for this Micro-Task and move to the next task in `task_plan.md`.
