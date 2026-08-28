---
---
name: task-graph
description: Decomposes the build plan into an ordered task graph
---

Decompose the implementation plan into an ordered, dependency-aware task graph:

1. Create a task list where each item represents an atomic, logical unit of work.
2. Split at real dependency, risk, validation, or permission boundaries. Keep each task coherent and independently verifiable; do not impose arbitrary file or step limits.
3. Map the dependencies for each task (e.g., T-003 depends on T-001).
4. Draft a visual dependency graph using text arrows.
5. For each task, generate a detailed task card with objective, files involved, requirements mapped, Must-Haves (observable truths, target artifacts), implementation steps, verification command, and acceptance criteria.
6. Save the graph to `build-pack/11-task-graph.md` and task cards in `build-pack/tasks/`.
7. Compile the same ids, dependencies, risk tiers, source-change intent, and argument-array validation commands into `build-pack/execution-state.json`.
8. Run BuildRunner `validate` and resolve every contract error before requesting planning approval.
