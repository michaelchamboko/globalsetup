---
name: ponytail-help
description: >
  Quick-reference card for the optional ponytail modes, skills, and commands.
  One-shot display, not a persistent mode or BuildRunner dependency.
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

| Skill | Trigger | What it does |
|-------|---------|--------------|
| **ponytail** | `/ponytail` | Activates the simplicity ladder for the current task or session. |
| **ponytail-review** | `/ponytail-review` | Reviews a diff only for over-engineering. |
| **ponytail-audit** | `/ponytail-audit` | Scans a whole repository for removable complexity. |
| **ponytail-debt** | `/ponytail-debt` | Lists deliberate `ponytail:` shortcuts. |
| **ponytail-gain** | `/ponytail-gain` | Shows the external benchmark scoreboard. |
| **ponytail-help** | `/ponytail-help` | Displays this card. |

## BuildRunner Boundary

BuildRunner task state, required evidence, and GitNexus completion remain
authoritative. Ponytail adds no automatic planning, review, resume, or shipping
gate; invoke the specific skill only when its review is wanted.

## Deactivate

Say "stop ponytail" or "normal mode". Resume anytime with `/ponytail`.
`/ponytail off` also works.

## Configure Default Mode

If Ponytail is activated without a level, the default is `full`. Change it:

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
