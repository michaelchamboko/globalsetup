---
alwaysApply: true
---

# Karpathy Workspace Norms — Agent Operating Architecture

> Extends `karpathy-guidelines.md`. These norms enforce structured intent, explicit verification
> loops, and environment safety guardrails across all agent sessions in this repository.

## Development Philosophy: Modern Engineering

- **You can outsource execution, but you cannot outsource understanding.**
- Prioritize clear architectural intent and upfront verification over immediate code generation.
- Never write multi-step loops or feature builds without an explicitly approved low-level specification.
- Understanding the *why* behind a change is a prerequisite for writing the *what*.

---

## Core Behavioral Directives

### 1. The Spec Interview (Before Broad Tasks)

If a task scope is broad, ambiguous, or lacks crisp architectural definitions, you **must** interview the user before writing code:

- Prompt the user to uncover the **true high-level decision or goal** driving the request.
- Ask targeted questions to expose constraints, edge cases, and success criteria.
- Bias heavily toward **small, isolated, highly compartmentalized specifications**.
- Document the final agreed specification before proceeding.

**Trigger condition**: Task involves more than one module, touches a core config file, or has no measurable acceptance criteria defined.

### 2. Upfront Verification Gate (Before Writing Code)

Before writing a single line of execution or implementation code, explicitly define:

1. **Evaluation criteria**: What measurable metrics define a high-quality result?
2. **Success definition**: What does "done" look like in precise, observable terms?
3. **Failure modes**: What would a broken or incomplete result look like?
4. **Validation method**: How will the output be verified (dual-model consensus, schema validation, test suite, CI pass, etc.)?

Document these in the task card or as a comment block at the top of the relevant build plan before implementation begins.

### 3. Explicit Decision Checkpoints (Guarded Architectural Changes)

Force explicit user confirmation before proceeding with any of the following:

- Structural database schema modifications
- Dependency additions or removals
- Core configuration architecture edits
- External system writes (API calls that mutate remote state)
- Changes to files listed in `safeguards/protected-files.md`

**Never let changes drift through assumptions.** If confirmation cannot be obtained, treat the action as blocked and log it in `state.md`.

---

## Workspace Action Boundaries

### ✅ Always Do [Autopilot]
These actions are safe to perform without user confirmation:

- Isolated lint fixes and formatting corrections
- Localized documentation corrections (typos, grammar, broken links)
- Simple data file reads and inspection
- Adding or updating code comments and docstrings
- Running read-only validation scripts (`validate-build-pack.ps1`, dry runs)

### ⚠️ Ask First [Guarded]
These actions require explicit user confirmation before execution:

- Adding or upgrading dependencies (any package manager operation)
- Modifying structural database schemas (migrations, table definitions)
- Editing core configuration architectures (`AGENTS.md`, any `rules/*.md`, CI/CD workflows)
- Executing external system writes (POST/PUT/DELETE to remote APIs)
- Creating or removing directories at the repo root level

### 🚫 Never Do [Forbidden]
These actions are absolutely prohibited under all circumstances:

- Bypassing pre-tool verification checks defined in `scripts/pre-tool-hook.ps1`
- Sweeping untracked changes across multiple unrelated directories simultaneously
- Modifying files listed in `safeguards/protected-files.md` without explicit operator instruction
- Silently suppressing validation errors or test failures to make a task appear complete
- Auto-approving Step 1 (Planning) decisions without human-in-the-loop confirmation

---

## Integration with Existing Architecture

| Norm | Cross-Referenced File |
|------|-----------------------|
| Spec Interview triggers | `rules/universal-agent-rules.md` § Plan Before Coding |
| Upfront Verification Gate | `templates/governance/verification-schema.json` |
| Explicit Decision Checkpoints | `safeguards/protected-files.md`, `safeguards/dangerous-command-rules.md` |
| Autopilot boundary | `safeguards/pre-ship-checklist.md` |
| Forbidden actions | `safeguards/destructive-change-policy.md` |
| Pre-tool hook | `scripts/pre-tool-hook.ps1` |
