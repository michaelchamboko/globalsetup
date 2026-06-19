---
name: ponytail-help
description: >
  Quick-reference card for all ponytail modes, skills, and commands as
  integrated into the Setup pipeline. One-shot display, not a persistent mode.
  Trigger: /ponytail-help, "ponytail help", "what ponytail commands",
  "how do I use ponytail".
---

# Ponytail Help

Display this reference card when invoked. One-shot: do NOT change mode,
write flag files, or persist anything.

## Levels

| Level | Trigger | What changes |
|-------|---------|-------------|
| **Lite** | `/ponytail lite` | Build what's asked, name the lazier alternative in one line. |
| **Full** | `/ponytail` | The ladder enforced: YAGNI → stdlib → native → one line → minimum. Default. |
| **Ultra** | `/ponytail ultra` | YAGNI extremist. Deletion before addition. Challenges requirements before building. |

Level sticks until changed or session end.

## Skills

| Skill | Trigger | What it does | Pipeline phase |
|-------|---------|--------------|-|
| **ponytail** | `/ponytail` | Lazy mode. Pre-build gate before every task. | Step 2: before every task card |
| **ponytail-review** | `/ponytail-review` | Over-engineering diff review: `L42: yagni: factory, one product. Inline.` | Step 2, task 12: Specialist Reviews |
| **ponytail-audit** | `/ponytail-audit` | Whole-repo bloat scan. | Step 1, task 3: Codebase Discovery |
| **ponytail-debt** | `/ponytail-debt` | Ledger of `ponytail:` shortcuts. | Step 2: fresh-context resume + pre-ship |
| **ponytail-gain** | `/ponytail-gain` | Impact scoreboard from benchmark. | On-demand |
| **ponytail-help** | `/ponytail-help` | This card. | On-demand |

## Pipeline Integration Summary

```
IDEATION
  └─ ponytail (ladder check) → is this feature even needed?

STEP 1: PLANNING
  └─ ponytail-audit (task 3, Codebase Discovery)
       → identify existing bloat before building on top of it

STEP 2: IMPLEMENTATION (each task card)
  ├─ ponytail (pre-build gate) → climb ladder before writing a line
  ├─ [build task]
  ├─ ponytail-review (task 12, Specialist Reviews) → scan diff
  └─ ponytail-debt (task 15, Pre-Ship) → ledger check before delivery

FRESH CONTEXT RESUME
  └─ ponytail-debt → surface shortcuts from previous session
```

## Deactivate

Say "stop ponytail" or "normal mode". Resume anytime with `/ponytail`.
`/ponytail off` also works.

## Configure Default Mode

Default mode = `full`, auto-active every session. Change it:

**Environment variable** (highest priority):
```bash
export PONYTAIL_DEFAULT_MODE=ultra
```

**Config file** (`~/.config/ponytail/config.json`, Windows: `%APPDATA%\ponytail\config.json`):
```json
{ "defaultMode": "lite" }
```

Resolution: env var > config file > `full`.

## More

Source: https://github.com/michaelchamboko/ponytail (fork of DietrichGebert/ponytail)
