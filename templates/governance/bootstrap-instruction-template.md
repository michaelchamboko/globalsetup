# Build Resume: [PROJECT_NAME]

Execute the approved build end to end. Repository state, not conversation history, determines progress.

## Resume

1. Read `AGENTS.md` and run `scripts/build-runner.py --root . validate`.
2. Inspect Git status and preserve unrelated changes.
3. Run `gitnexus status`; re-index before trusting stale results.
4. Run BuildRunner `next` and load only that task card, its module plan, and relevant contracts.

## Task loop

For the selected task, use GitNexus context and impact analysis, run `start`, implement the smallest correct change, and run `verify`. High-risk tasks also need recorded independent review. Run `complete`; it automatically updates GitNexus and records the fresh graph receipt before marking the task done. Continue with the next ready task.

Do not pause for routine task transitions or passing checks. Stop only for an unresolved approved requirement, missing authority or runtime, unavailable GitNexus, a required failing check, or completion of the full approved graph.

GitHub is source control and manual review only. Do not add or use GitHub Actions workflows or hosted runners.
