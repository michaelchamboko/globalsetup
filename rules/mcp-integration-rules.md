---
alwaysApply: true
---

# MCP Integration Rules

These rules govern the integration and use of MCP tools (CodeGraph, task-master, Sequential Thinking, and Caveman) during task execution.

## 1. CodeGraph (Dependency & Context Mapping)
* **Verify, Don't Guess**: Before modifying any logic or interface, you must run CodeGraph to trace all dependency impacts. Do not rely on internal model training data.
* **Imports Tracing**: When adding or updating imports, trace all consumer files to verify that the change does not break downstream compilation or types.
* **Persistent Memory Access**: Treat the codebase as your active physical memory. Retrieve file content and definitions dynamically via CodeGraph search rather than asking the user or assuming structure.

## 2. task-master (Lifecycle & Objective Orchestration)
* **Define I/O Contracts**: Before delegating tasks or spawning sub-agents (Planner, Builder, Reviewer), use the `task-master` MCP to establish strict input/output contracts. Contracts must specify exact input files, output files, and test commands.
* **Task Lifecycle Management**: Log all tasks and sub-tasks in `task-plan.md` via `task-master`. Update their statuses dynamically (Not Started, In Progress, Complete).
* **Granular Decompositions**: Planner-Agent must split large objectives into independent, testable Micro-Tasks sized for low-risk commits.

## 3. Sequential Thinking (Logical Continuity)
* **Maintain Linearity**: Maintain a sequential thought chain. Do not jump between distant components without logical transitions.
* **Plan Deviations**: If you discover that the task plan must be altered, use `task-master` to explicitly update `task_plan.md` first before executing the deviation.

## 4. Caveman (Stateless Scaling & Context Resets)
* **Pruning Triggers**: Track your active context size. When context reaches 45% capacity, call `Caveman` to prune redundant logs.
* **State Serialization**: Before resetting context, serialize all progress, architectural decisions, and current states into `state.md`.
* **Context Handover**: Force a context reset and hand over execution to a fresh Master or Sub-agent session, loading only the baseline files listed in `state.md`.
