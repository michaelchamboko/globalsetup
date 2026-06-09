# Fresh-Context Task Card: [T-NNN] [Title]

## Context Baseline
Before editing, retrieve and read:
- [ ] docs/architecture-map.md
- [ ] uild-pack/contracts/[relevant-contract].md
- [ ] [existing-file-to-modify-or-reference]

## Execution Constraints
- Do NOT read files outside the scoped paths.
- Maintain a strict context budget (keep under 20k tokens in session).
- Implement changes incrementally and run tests.

## Changes Required
1. [Action 1]
2. [Action 2]

## Local Verification
- Run: [test execution command]
- Expected output: [expected result]

## Rollback Plan
If verification fails and cannot be resolved quickly:
- Execute: git checkout -- [changed-files]
"@

# 21. test-plan-template.md
Write-Template "qa/test-plan-template.md" @"
# Test Plan: [Feature Name]

**Date**: [YYYY-MM-DD]  
**Test Runner**: [e.g., Vitest / Jest / Pytest]  

## Strategy

[High-level testing strategy. How will unit, integration, and E2E tests combine to verify the feature?]

## Test Levels

### Unit Tests
- Scope: [What functions, components, and classes will be unit tested]
- Tooling: [Vitest / Pytest]

### Integration Tests
- Scope: [Which API endpoints and database flows will be integration tested]
- Tooling: [Supertest / Pytest-Django]

### End-to-End Tests
- Scope: [Which user journeys will be tested end-to-end]
- Tooling: [Playwright / Cypress]

## Scenarios Matrix

| ID | Scenario | Level | Preconditions | Input | Expected Output |
|----|----------|-------|---------------|-------|-----------------|
| TS-001 | [Scenario] | Unit/Int/E2E | [Given] | [When] | [Then] |

## Coverage Targets

- Statement Coverage: [e.g., 90%]
- Branch Coverage: [e.g., 85%]
- Critical Path Coverage: 100%
