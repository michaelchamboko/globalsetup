# Pre-Ship Checklist

Execute this checklist before shipping changes, committing locally, or pushing to GitHub.

## 1. Local Commit Readiness (Tier 1 Check)
- [ ] **Surgical Changes**: All modifications are strictly within the Micro-Task scope.
- [ ] **Constraint Check**: Code conforms to `project_rules.md`, `state.md`, and `findings.md`.
- [ ] **Micro-Task Tests**: Localized tests for the changed modules pass successfully.
- [ ] **Code Quality review**: Checked against `reviewers/code-reviewer.md` checklist.

## 2. GitHub Push Readiness (Tier 2 Check)
- [ ] **Lint and Formatting**: Linter runs with 0 errors. Formatter has been executed.
- [ ] **Build Validation**: The production build compiles successfully (e.g. `npm run build` or equivalent).
- [ ] **Holistic Verification**: Full test suite passes successfully (both unit and integration/E2E).
- [ ] **Specialist Reviews**: Relevant reviews (security, performance, database) have passed and signed off.
- [ ] **Protected Files check**: Confirm no secrets, credentials, `.env` files, or lockfiles are staged.
- [ ] **Rollback Plan**: Rollback steps are verified and documented.
- [ ] **State Alignment**: All architectural changes are logged in `state.md` and verified.
