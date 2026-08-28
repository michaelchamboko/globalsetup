# Build Resume: [PROJECT_NAME]

Execute the approved build end to end. Repository state, not conversation history, determines progress.

## Resume

1. Read `AGENTS.md` and run `scripts/build-runner.py --root . validate`.
2. Inspect Git status and preserve unrelated changes.
3. Run `node .gitnexus/run.cjs status`; re-index before trusting stale results.
4. Run BuildRunner `next`, read the JSON `result`, and load exactly its `context_files`.

## Task loop

For the selected task, use GitNexus context and impact analysis, run `start`, and implement the smallest correct change. Write code that reads like the surrounding code: match its comment density, naming, structure, and idiom. Record hosted or external `receipt` checks with `record-evidence`; BuildRunner runs local `command` checks during `verify`. High-risk tasks also need a source-bound independent review receipt. Run `complete`; it rejects source drift, updates GitNexus, and records a source-bound graph receipt before marking the task done. Continue with the next ready task.

Do not pause for routine task transitions or passing checks. Stop only for an unresolved approved requirement, missing authority or runtime, unavailable GitNexus, a required failing check, or completion of the full approved graph.

GitHub is source control and manual review only. Do not add or use GitHub Actions workflows or hosted runners.
