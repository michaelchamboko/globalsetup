# Fresh-Context Task Card: [T-NNN] [Title]

## Context Baseline
Before editing, retrieve and read:
- [ ] docs/architecture-map.md
- [ ] build-pack/contracts/[relevant-contract].md
- [ ] [existing-file-to-modify-or-reference]

## Execution Constraints
- Do NOT read files outside the scoped paths.
- Keep context bounded to this task. Resume from BuildRunner state in a fresh context when this task completes or the current context can no longer execute it reliably.
- Keep the task coherent and independently verifiable; split only at a real dependency, risk, validation, or permission boundary.
- Implement changes incrementally and run tests.

## Must-Haves (Spec-Driven Assertions)
* **Observable Truths**:
  - [Truth 1: e.g., Returns 200 OK with session cookie upon valid login]
* **Target Artifacts**:
  - `[file/path]` (modified)

## Changes Required
1. [Action 1]
2. [Action 2]

## Intended-Location Verification
- **Task-Tier Command or Hosted Check**: `[Exact focused validation]`
- **Affected/Full Checks**: `[Add only when required by risk]`
- **Expected Output**: `[Expected result, exit code 0]`

## Rollback Plan
Describe a targeted, recoverable reversal that preserves unrelated and user-owned changes. Do not use a blanket checkout or reset.

