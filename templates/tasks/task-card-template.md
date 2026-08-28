# Task Card: [T-NNN] [Title]

**Task Graph Reference**: [Link]
**Module Plan Reference**: [build-pack/module-plans/M-NNN-module-name.md]
**Dependencies**: [T-001, T-002]
**Lifecycle State**: Managed only in `build-pack/execution-state.json`
**Risk**: [low / medium / high]
**Source Changes**: [true / false]

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

* **Validation Location**: `[vercel / oracle / approved-runtime / local-docs-only]`
* **Task-Tier Command or Hosted Check**: `[Exact focused check]`
* **Affected-Tier Check**: `[Required for medium/high risk; otherwise N/A]`
* **Full-Tier Check**: `[Required for high risk; otherwise N/A]`
* **Expected Output**: `[Successful exit code 0 or positive verification indicator]`
* **Manual Verification**: [Manual verification steps]
* **Local Build Exception**: `[No by default. If yes, cite explicit operator approval and commands allowed.]`
* **GitHub Boundary**: `Source control and manual review only; no GitHub Actions workflows or hosted runners.`

## Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Execution-State Mapping

- [ ] Dependencies, risk, source-change intent, and validation argument arrays match this card.
- [ ] High-risk work names the independent review evidence required before completion.

