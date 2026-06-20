# Pre-Ship Checklist

Execute this checklist before shipping changes, pushing to GitHub, or calling intended-location validation complete.

## 0. 🪡 Ponytail Done Gate (Mandatory — runs first)
Run `ponytail-done` on the session's full diff. This gate must return **SHIP** before any tier below is checked.

- [ ] **Step 1 — Diff review**: Run `ponytail-review` on session diff. All `delete:` and `yagni:` findings with 0 risk actioned.
- [ ] **Step 2 — Debt ledger**: Run `ponytail-debt`. All `ponytail:` comments have an upgrade trigger. No `no-trigger` markers remain unreviewed.
- [ ] **Step 3 — Verdict**: `ponytail-done` verdict is **SHIP**. If HOLD, resolve the listed items first.

> Trigger: `ponytail-done` → must output `SHIP.` before proceeding.

---

## 1. Micro-Task Readiness (Tier 1 Check)
- [ ] **Surgical Changes**: All modifications are strictly within the Micro-Task scope.
- [ ] **Constraint Check**: Code conforms to `project_rules.md`, `state.md`, and `findings.md`.
- [ ] **Module Plan Link**: Each task maps to an approved module plan.
- [ ] **Micro-Task Validation**: The declared validation location/check for the changed module passes.
- [ ] **Code Quality review**: Checked against `reviewers/code-reviewer.md` checklist (includes ponytail-review pass).

## 2. GitHub / Intended-Location Readiness (Tier 2 Check)
- [ ] **Lint and Formatting**: Lint/format checks pass in the approved validation location.
- [ ] **Build Validation**: Hosted production build compiles successfully in the intended platform, such as Vercel or CI.
- [ ] **Holistic Verification**: Hosted/global validation passes in the approved runtime.
- [ ] **Specialist Reviews**: Relevant reviews (security, performance, database) have passed and signed off.
- [ ] **Protected Files check**: Confirm no secrets, credentials, `.env` files, or lockfiles are staged.
- [ ] **Rollback Plan**: Rollback steps are verified and documented.
- [ ] **State Alignment**: All architectural changes are logged in `state.md` and verified.
- [ ] **No Local Build Drift**: No local install/build artifacts are required for delivery unless explicitly approved.
