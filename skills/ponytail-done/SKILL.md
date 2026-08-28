---
name: ponytail-done
description: >
  Optional simplicity audit for the end of a coding/development/building
  session. Performs a three-part
  ponytail exit check: (1) ponytail-review on the session's diff,
  (2) ponytail-debt scan of the whole repo, (3) a pass/fail verdict.
  Use when the user says "we're done", "done coding", "ready to ship",
  "mark as complete", "done building", "finished", or "work is done".
  It is not an automatic BuildRunner or shipping gate. Produces a compact
  one-page report. If everything is clean: "Ship." only.
---

# Ponytail Done — Completion Gate

The lazy senior dev's optional exit interview. Run its three checks only when
the operator requests Ponytail completion review.

---

## Step 1 — Diff Review (`ponytail-review`)

Scan the session's git diff (or changed files) for over-engineering.
One line per finding: `L<line>: <tag> <what>. <replacement>.`

Tags: `delete:` / `stdlib:` / `native:` / `yagni:` / `shrink:`

Score: `net: -<N> lines possible.`

**Gate:** Any `delete:` or `yagni:` finding with 0 risk → **must be actioned before ship**.
`stdlib:` and `native:` findings → list for awareness, not a hard block.

---

## Step 2 — Debt Ledger (`ponytail-debt`)

Grep the repo for `ponytail:` comment markers:

`grep -rnE '(#|//) ?ponytail:' .`

Output: `<file>:<line>, ceiling: <X>. upgrade: <trigger>.`

Flag any `no-trigger` markers (those naming no upgrade path).

**Gate:** Any `no-trigger` marker → `⚠ rot risk`. Developer must add a trigger
or explicitly accept the risk before the gate passes.

---

## Step 3 — Verdict

```
PONYTAIL DONE
─────────────────────────────────────────────────────
Diff review:   <N findings> → net: -<X> lines possible
Debt ledger:   <N> markers, <M> with no trigger (⚠ rot risk)
─────────────────────────────────────────────────────
VERDICT: [SHIP. | HOLD — <reason>]
```

**SHIP** if:
- All `delete:`/`yagni:` findings with 0 risk resolved or explicitly accepted
- No `no-trigger` markers remain unreviewed
- Diff adds no net complexity without clear reason

**HOLD** if any fail — name exactly what must change.

---

## Output Rules

- Full report fits in one screen — no essays
- Clean: `PONYTAIL DONE — Ship.` and nothing more
- Issues: list them specifically, one per line, actionable

## Scope

Simplicity and debt gate ONLY. Does not replace correctness review,
security review, or performance benchmarks — those gates run in parallel.
"stop ponytail-done" or "normal mode" to revert.
