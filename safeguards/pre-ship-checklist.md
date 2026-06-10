# Pre-Ship Checklist

Execute this checklist before shipping changes, pushing to GitHub, or calling intended-location validation complete.

## 1. Micro-Task Readiness (Tier 1 Check)
- [ ] **Surgical Changes**: All modifications are strictly within the Micro-Task scope.
- [ ] **Constraint Check**: Code conforms to `project_rules.md`, `state.md`, and `findings.md`.
- [ ] **Module Plan Link**: Each task maps to an approved module plan.
- [ ] **Micro-Task Validation**: The declared validation location/check for the changed module passes.
- [ ] **Code Quality review**: Checked against `reviewers/code-reviewer.md` checklist.

## 2. GitHub / Intended-Location Readiness (Tier 2 Check)
- [ ] **Lint and Formatting**: Lint/format checks pass in the approved validation location.
- [ ] **Build Validation**: Hosted production build compiles successfully in the intended platform, such as Vercel or CI.
- [ ] **Holistic Verification**: Hosted/global validation passes in the approved runtime.
- [ ] **Specialist Reviews**: Relevant reviews (security, performance, database) have passed and signed off.
- [ ] **Protected Files check**: Confirm no secrets, credentials, `.env` files, or lockfiles are staged.
- [ ] **Rollback Plan**: Rollback steps are verified and documented.
- [ ] **State Alignment**: All architectural changes are logged in `state.md` and verified.
- [ ] **No Local Build Drift**: No local install/build artifacts are required for delivery unless explicitly approved.
