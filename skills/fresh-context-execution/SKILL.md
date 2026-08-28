---
name: fresh-context-execution
description: Execute one BuildRunner task from durable state with bounded GitNexus context.
argument-hint: [Task ID]
---

# Fresh-context task execution

1. Run BuildRunner `validate` and confirm the requested task is the task returned by `next`.
2. Read the task card, module plan, relevant contracts, and current Git status.
3. Run `gitnexus status`; retrieve graph context and impact for existing symbols or interfaces in scope.
4. Run `start TASK_ID`.
5. Implement the smallest change that satisfies the task's observable requirements. Add a focused spec check first when needed.
6. Run `verify TASK_ID`; fix only task-caused or task-required failures.
7. For high-risk work, obtain and record the independent review required by the task.
8. Run `complete TASK_ID`. Completion must update GitNexus and record a fresh receipt before the task becomes done.
9. Commit or push only through the repository's approved delivery path, then continue with `next`.

Do not manually update lifecycle status, discard unrelated changes, run unapproved local application builds, or add GitHub Actions.
