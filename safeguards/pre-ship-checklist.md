# Pre-Ship Checklist

Execute this checklist before shipping changes or creating a Pull Request.

## Verification Checklist

- [ ] **Lint and Formatting**: Linter runs with 0 errors. Formatter has been executed.
- [ ] **Build Check**: The production build compiles successfully (
pm run build or equivalent).
- [ ] **Unit Tests**: All unit tests pass.
- [ ] **Integration Tests**: All integration tests pass.
- [ ] **Acceptance Criteria**: All criteria from the task cards are met.
- [ ] **Specialist Reviews**: Relevant specialist reviews (code, security, performance, DB) have passed.
- [ ] **Protected Files check**: Confirm no secrets, .env files, or lockfiles are staged.
- [ ] **Rollback Plan**: Rollback steps are verified and documented.
