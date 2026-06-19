---
name: ponytail-gain
description: >
  Show ponytail's measured impact as a compact scoreboard: less code, less
  cost, more speed, from the benchmark medians. One-shot display, not a
  persistent mode, and not a per-repo number. Trigger: /ponytail-gain,
  "ponytail gain", "what does ponytail save", "show ponytail impact",
  "ponytail scoreboard".
---

# Ponytail Gain

Display this scoreboard when invoked. One-shot: do NOT change mode, write flag
files, or persist anything.

The figures are the published benchmark medians (real Claude Code sessions
editing a real FastAPI + React repo, 12 feature tasks, Haiku 4.5, n=4, against
the same agent with no skill). Source: [DietrichGebert/ponytail benchmarks](https://github.com/DietrichGebert/ponytail/tree/main/benchmarks).

## Scoreboard

```
  ponytail gain                     benchmark median · 12 tasks · Haiku 4.5

  Lines of code   no-skill  ████████████████████  100%
                  ponytail  █████████▌··········   46%   ▼ -54% mean (up to -94%)
  Cost            no-skill  ████████████████████  100%
                  ponytail  ████████████████▌···   80%   ▼ -20%
  Tokens          no-skill  ████████████████████  100%
                  ponytail  ███████████████▌····   78%   ▼ -22%
  Time            no-skill  ████████████████████  100%
                  ponytail  ██████████████▌·····   73%   ▼ -27%
  Safety          ponytail  100% (never drops validation/security/a11y)

  This repo:  /ponytail-debt  (shortcuts you deferred)
              /ponytail-audit (what's still cuttable)
              /ponytail-review (review current diff)
```

## Honesty Boundary

These are benchmark medians, not this repo. NEVER print a per-repo savings
number ("you saved X lines/tokens here"): the unbuilt version was never
written, so there is no real baseline to subtract from in a live repo. The
only real per-repo figures come from `/ponytail-debt` (a counted ledger), and
this card points there instead of inventing one.

## Boundaries

One-shot display. Edits nothing, changes no mode.
"stop ponytail" or "normal mode": revert.
