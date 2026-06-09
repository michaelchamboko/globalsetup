---
alwaysApply: true
---

# Context Management Rules

Managing your context budget is critical to maintaining accuracy, preventing hallucinations, and avoiding cost bloat.

## Context Budget Discipline
* Keep the turn context size as small as possible.
* Do not read entire folders or run broad recursive lists unless executing codebase discovery.
* Read only the files scoped to the current task card.

## Context Debt Prevention
* Context Debt accumulates when you maintain a long, multi-turn history with extensive file reads and tool outputs.
* To reset context debt:
  1. Commit your current work.
  2. Complete the current task card.
  3. Start a new session (fresh context) for the next task card.
  4. Only retrieve files specified in the next task card's context baseline.

## When to Split a Task
* Split a task card into smaller cards if:
  - The list of files likely involved exceeds 5 files.
  - The implementation steps require more than 3 distinct code modifications.
  - The testing plan requires setting up complex test fixtures across multiple boundaries.
