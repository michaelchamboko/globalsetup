---
name: fresh-context-execution
description: Use when implementing, resuming, verifying, reviewing, or completing one approved BuildRunner task.
argument-hint: [Task ID]
---

# Fresh-context task execution

1. Run BuildRunner `validate` and `next`; load exactly the returned `context_files`.
2. Inspect Git status, then use GitNexus context and impact analysis for existing symbols or interfaces in scope.
3. Run `start TASK_ID` and implement the smallest observable change. Write code that reads like the surrounding code: match its comment density, naming, structure, and idiom.
4. For each hosted `receipt` check, validate in the declared runtime and use `record-evidence` with its durable source.
5. Run `verify TASK_ID`; fix only task-caused or task-required failures.
6. For high-risk work, obtain an independent review and record its outcome plus receipt with `review`.
7. Run `complete TASK_ID`; completion must refresh GitNexus and record the graph receipt before the task becomes done.
8. Follow the approved delivery path, then return to the orchestration loop.

Do not manually update lifecycle status, discard unrelated changes, run unapproved local application builds, or add GitHub Actions.
