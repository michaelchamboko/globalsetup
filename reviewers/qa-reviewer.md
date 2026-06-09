# QA and Verification Reviewer Profile

Review changes for test coverage, verification plans, and edge-case execution under the Two-Tier Testing model.

## Checklist

- [ ] **Scenario Coverage**: The test plan covers happy paths, boundaries, error handling, and invalid inputs.
- [ ] **Test Integrity**: Assertions check real states and values. Mocks are configured correctly.
- [ ] **Two-Tier Testing (Tier 1 - Commit)**: Verify that localized unit/integration tests for the current Micro-Task pass successfully on the local environment before committing.
- [ ] **Two-Tier Testing (Tier 2 - Push)**: Ensure the holistic validation suite (linter, full typecheck, production build command, and global integration/E2E tests) passes successfully before pushing micro-commits to GitHub.
- [ ] **Integration Verification**: Endpoints and databases are tested together, simulating real network conditions where applicable.
- [ ] **Build Validation**: The production build compiles successfully without errors.
