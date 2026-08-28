---
alwaysApply: false
---

# GitNexus and BuildRunner Integration Rules

## GitNexus is required

- The declared provider in `build-pack/capabilities.json` must be `gitnexus` with acknowledged noncommercial use.
- Run `gitnexus status` before starting a task. Re-index if the index is absent or stale.
- Use graph query/context for unfamiliar flows and impact analysis before editing an existing symbol or interface.
- Run change detection before commit when supported. Every `complete` call must update GitNexus and record a fresh receipt; completion fails closed if the update fails.
- Never invent graph results or silently fall back to text search when GitNexus is unavailable.

Text search remains appropriate for exact strings and filenames after the relevant graph context is known.

## BuildRunner is authoritative

- `build-pack/execution-state.json` is the only lifecycle ledger.
- Use `validate`, `next`, `start`, `record-evidence`, `verify`, `review`, `complete`, `block`, and `unblock` for transitions and evidence. `graph-sync` remains available for an explicit mid-task refresh, but `complete` always performs the final update.
- Consume the stable JSON envelope (`ok`, `command`, `result` or `error`) instead of scraping prose output.
- Load only the active task's validated `context_files`; harness discovery must not widen them by default.
- Commands stored in state must be argument arrays. The runner executes them without a shell.
- Hosted or external checks are `receipt` validations recorded from their declared runtime; they are never impersonated by a local command.
- Exactly one task may be `in_progress`; dependencies must be done before a task becomes ready.

## Harnesses are adapters

MCP, skills, plugins, or sub-agents may help execute a bounded task, but none are mandatory lifecycle dependencies. They must not create a second task graph, weaken verification, or claim state not recorded by BuildRunner.
