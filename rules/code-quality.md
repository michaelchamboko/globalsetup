---
alwaysApply: false
---

# Code quality

## Local style

- Write code that reads like the surrounding code: match its comment density, naming, structure, and idiom.
- Use the nearest maintained code, repository formatters, and tests as the convention source of truth.
- Preserve established public interfaces and file organization unless the active task changes them explicitly.
- When nearby code is inconsistent, follow the pattern used by the closest tested path and record a material ambiguity in the task rather than inventing a new standard.

## Scope

- Implement only the active task's observable requirements.
- Prefer direct code over a helper used once, and existing dependencies over new infrastructure.
- Keep unrelated formatting and refactors out of the diff.
- Remove only dead code created by the active change.

## Comments

- Match surrounding comment and docstring density.
- Explain non-obvious reasons, constraints, or workarounds; let clear names and structure explain mechanics.
- Use the repository's existing TODO or issue-reference format.
