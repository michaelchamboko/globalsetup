---
alwaysApply: false
---

# Karpathy workspace norms

Use these norms when a task has consequential assumptions, unclear success criteria, or pressure to broaden the change.

## Before implementation

1. Read the active task and its `context_files`.
2. State only assumptions that could change scope, architecture, permissions, risk, or validation.
3. Resolve cheap facts from code, approved documents, and GitNexus.
4. Return to phase 1 only when an unresolved choice would materially change the approved build.

## During implementation

- Write code that reads like the surrounding code: match its comment density, naming, structure, and idiom.
- Make the smallest change that satisfies the observable task contract.
- Keep one BuildRunner task active and preserve unrelated work.
- Treat dependency, schema, core configuration, and external-write decisions according to the task's declared authority and risk; do not create a second confirmation gate.

## Verification

- Low risk runs the task check.
- Medium risk adds affected-area checks.
- High risk adds full checks and a source-bound independent review receipt.
- Record hosted evidence as a receipt from its declared runtime; record local commands as command evidence.

The task is complete only after BuildRunner accepts the evidence, refreshes GitNexus, and records the completion. A failed required check, unavailable authority, or material contract contradiction is a blocker; routine transitions are not.
