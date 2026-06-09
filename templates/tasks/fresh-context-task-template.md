# Fresh-Context Task Card: [T-NNN] [Title]

## Context Baseline
Before editing, retrieve and read:
- [ ] docs/architecture-map.md
- [ ] build-pack/contracts/[relevant-contract].md
- [ ] [existing-file-to-modify-or-reference]

## Execution Constraints
- Do NOT read files outside the scoped paths.
- Maintain a strict context budget (keep under 20k tokens in session).
- Limit implementation to a maximum of 3 source files and 3 discrete modifications.
- Implement changes incrementally and run tests.

## Must-Haves (Spec-Driven Assertions)
* **Observable Truths**:
  - [Truth 1: e.g., Returns 200 OK with session cookie upon valid login]
* **Target Artifacts**:
  - `[file/path]` (modified)

## Changes Required
1. [Action 1]
2. [Action 2]

## Local Verification
- **Verification Command**: `[Exact test execution command]`
- **Expected Output**: `[Expected result, exit code 0]`

## Rollback Plan
If verification fails and cannot be resolved quickly:
- Execute: `git checkout -- [changed-files]`

