---
name: ponytail-debt
description: >
  Harvest every `ponytail:` comment in the codebase into a debt ledger, so the
  deliberate shortcuts and deferrals ponytail leaves behind get tracked instead
  of rotting into "later means never". Use when the user says "ponytail debt",
  "/ponytail-debt", "what did ponytail defer", "list the shortcuts", "ponytail
  ledger", or "what did we mark to do later". In the Setup pipeline, invoke
  this at the start of every Step 2 fresh-context resume to surface any
  shortcuts from the previous session before writing new code. One-shot report,
  changes nothing.
---

# Ponytail Debt

Every deliberate ponytail shortcut is marked with a `ponytail:` comment naming
its ceiling and upgrade path. This collects them into one ledger so a deferral
can't quietly become permanent.

## Scan

Grep the repo for comment markers, skipping `node_modules`, `.git`, and build
output:

`grep -rnE '(#|//) ?ponytail:' .`  (add other comment prefixes if your stack uses them)

Each hit is one ledger row. The comment prefix keeps prose that merely mentions
the convention out of the ledger.

## Output

One row per marker, grouped by file:

`<file>:<line>, <what was simplified>. ceiling: <the limit named>. upgrade: <the trigger to revisit>.`

The convention is `ponytail: <ceiling>, <upgrade path>`, so pull the ceiling
and the trigger straight from the comment. Want an owner per row too? add
`git blame -L<line>,<line>`.

Flag the rot risk: any `ponytail:` comment that names no upgrade path or
trigger gets a `no-trigger` tag — those are the ones that silently rot.

End with `<N> markers, <M> with no trigger.` Nothing found: `No ponytail: debt. Clean ledger.`

## Integration with Setup Pipeline

**Fresh-Context Resume (Step 2):** At the start of every new context session
during Step 2, run ponytail-debt as part of the Fresh Context Resume Checklist
(alongside reading `state.md`, `AGENTS.md`, and `task_plan.md`). This surfaces
any `ponytail:` shortcuts left in-progress before writing new code.

**Pre-Ship Safeguards (Step 2, task 15):** Run ponytail-debt before the
pre-ship checklist gate. Any `no-trigger` marker must be resolved or
explicitly accepted by the operator before delivery.

To persist the ledger: ask and it writes to `PONYTAIL-DEBT.md`.

## Boundaries

Reads and reports only, changes nothing. One-shot. "stop ponytail-debt" or
"normal mode" to revert.
