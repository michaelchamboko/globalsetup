---
name: ponytail-audit
description: >
  Whole-repo audit for over-engineering. Like ponytail-review, but scans the
  entire codebase instead of a diff: a ranked list of what to delete, simplify,
  or replace with stdlib/native equivalents. Use when the user says "audit this
  codebase", "audit for over-engineering", "what can I delete from this repo",
  "find bloat", "ponytail-audit", or "/ponytail-audit". Also use during Step 1
  (Existing Codebase Discovery, task 3) on brown-field projects to identify
  existing over-engineering before building on top of it. One-shot report,
  does not apply fixes.
---

# Ponytail Audit

ponytail-review, repo-wide. Scan the whole tree instead of a diff. Rank
findings biggest cut first.

## Tags

Same as ponytail-review:

- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` hand-rolled thing the standard library ships. Name the function.
- `native:` dependency or code doing what the platform already does. Name the feature.
- `yagni:` abstraction with one implementation, config nobody sets, layer with one caller.
- `shrink:` same logic, fewer lines. Show the shorter form.

## Hunt

Deps the stdlib or platform already ships, single-implementation interfaces,
factories with one product, wrappers that only delegate, files exporting one
thing, dead flags and config, hand-rolled stdlib.

## Output

One line per finding, ranked: `<tag> <what to cut>. <replacement>. [path]`.
End with `net: -<N> lines, -<M> deps possible.` Nothing to cut: `Lean already. Ship.`

## Integration with Setup Pipeline

**Step 1, task 3 (Existing Codebase Discovery):** For brown-field projects,
run ponytail-audit before architecture mapping. Any `delete:` or `yagni:` finding
with zero risk gets added to the Build Brief as explicit non-goals (things
the pipeline should not perpetuate). This prevents inheriting old over-engineering
into the new feature.

**Standalone:** Run anytime the codebase starts feeling heavy. The result feeds
directly into the Planner-Agent's architecture map as technical debt to retire.

## Boundaries

Scope: over-engineering and complexity only. Correctness bugs, security holes,
and performance are explicitly out of scope. Route them to a normal review
pass. Lists findings, applies nothing. One-shot.
"stop ponytail-audit" or "normal mode" to revert.
