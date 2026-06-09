---
name: task-graph
description: Decomposes the build plan into an ordered task graph
---

Decompose the implementation plan into an ordered, dependency-aware task graph:

1. Create a task list where each item represents a small, logical unit of work.
2. Map the dependencies for each task (e.g. T-003 depends on T-001).
3. Draft a visual dependency graph using text arrows.
4. For each task, generate a detailed task card with objective, files involved, requirements mapped, implementation steps, testing plan, and acceptance criteria.
5. Save the graph to build-pack/11-task-graph.md and task cards in build-pack/tasks/.
