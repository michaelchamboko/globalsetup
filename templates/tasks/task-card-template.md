# Task Card: [T-NNN] [Title]

**Task Graph Reference**: [Link]
**Module Plan Reference**: [build-pack/module-plans/M-NNN-module-name.md]
**Dependencies**: [T-001, T-002]
**Lifecycle State**: Managed only in `build-pack/execution-state.json`
**Risk**: [low / medium / high]
**Source Changes**: [true / false]
**Requirement Sources**: [Approved repository-local PRD, truth-document, or blueprint paths]
**Publication Destination**: [Authorized destination / N/A]

## Context Files

Mirror these exact repository-relative paths into the execution state's `context_files`. Include only the rule, skill, plan, contract, code, test, or reviewer files needed for this task.

- `[build-pack/module-plans/M-NNN-module-name.md]`
- `[build-pack/relevant-contract.md]`
- `[existing/file/to-change]`

## Objective

[One clear sentence: what this task accomplishes]

## Files Likely Involved

- `[file/path/1]` (new or modify) — [purpose]
- `[file/path/2]` (modify) — [purpose]

## Requirements Mapped

- **[R1]**: [Requirement description]
- **[R2]**: [Requirement description]

## Must-Haves (Spec-Driven Assertions)

* **Observable Truths**:
  - [Truth 1: e.g., Returns 400 Bad Request when request body is missing 'email']
  - [Truth 2: e.g., DB record is created with password hashed using bcrypt]
* **Target Artifacts**:
  - `[file/path/1]` must exist and pass the declared validation check.
  - `[file/path/2]` must be modified to include the new validation logic.

## Implementation Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Testing Plan & Verification

* **Task-Tier Validation**: `[kind: command, location: local, argv: [...]]` or `[kind: receipt, location: vercel/oracle/approved-runtime]`
* **Affected-Tier Validation**: `[Required for medium/high risk; declare kind and location, otherwise N/A]`
* **Full-Tier Validation**: `[Required for high risk; declare kind and location, otherwise N/A]`
* **Expected Output**: `[Successful exit code 0 or positive verification indicator]`
* **Manual Verification**: [Manual verification steps]
* **Local Build Exception**: `[No by default. If yes, cite explicit operator approval and commands allowed.]`
* **GitHub Boundary**: `Source control and manual review only; no GitHub Actions workflows or hosted runners.`

## Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Execution-State Mapping

- [ ] Dependencies, risk, source-change intent, `context_files`, and validation kinds/locations match this card.
- [ ] Every mapped requirement traces to `requirement_sources`, and each source is included in `context_files`.
- [ ] Any publication destination appears in `automation_authority.publication.destinations`.
- [ ] Every local `command` has an argument array; every hosted/external `receipt` names its intended runtime and durable evidence source.
- [ ] High-risk work names the independent review evidence required before completion.

