---
name: ponytail-done
description: >
  Mandatory completion gate that runs at the end of every coding/development/
  building session before the work is declared done. Performs a three-part
  ponytail exit check: (1) ponytail-review on the session's diff,
  (2) ponytail-debt scan of the whole repo, (3) a pass/fail verdict.
  Use when the user says "we're done", "done coding", "ready to ship",
  "mark as complete", "done building", "finished", or "work is done".
  In the Setup pipeline: runs automatically at Step 2, task 14
  (Final Definition of Done Verification) and task 15 (Pre-Ship Safeguards).
  Produces a compact one-page report. If everything is clean: "Ship." only.
---

# Ponytail Done — Completion Gate

The lazy senior dev's exit interview. Three checks, one verdict.
Run this every time building / development / coding work is declared complete,
before any commit, PR, or delivery.

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

## Integration with Setup Pipeline

| Step | Role |
|------|------|
| Step 2, task 12 (Specialist Reviews) | Run ponytail-review as part of the review checklist |
| Step 2, task 14 (Definition of Done) | Run the full ponytail-done gate |
| Step 2, task 15 (Pre-Ship) | Confirm SHIP verdict before commit/push |
| Step 2, task 16 (Commit) | Only commit after SHIP verdict |

---

## Output Rules

- Full report fits in one screen — no essays
- Clean: `PONYTAIL DONE — Ship.` and nothing more
- Issues: list them specifically, one per line, actionable

## Scope

Simplicity and debt gate ONLY. Does not replace correctness review,
security review, or performance benchmarks — those gates run in parallel.
"stop ponytail-done" or "normal mode" to revert.
