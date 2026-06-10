# 01 - Build Plan Index

## Purpose

Make the notification system build visible at a modular level before task cards are executed.

## Build Modules

| Module | Build Area | Runtime Owner | Validation Location | Primary Tasks |
| --- | --- | --- | --- | --- |
| M-001 | Notification Core | GitHub / approved database runtime | GitHub / approved runtime | T-001, T-002, T-003 |
| M-002 | Notification UI/UX | Vercel / GitHub | Vercel / GitHub | T-004, T-005 |
| M-003 | Release Validation | GitHub / hosting platform | GitHub / hosting platform | T-006 |

## Required Plan Cross-References

- `build-pack/build-plans/02-ui-ux-build-plan.md`
- `build-pack/module-plans/M-001-notification-core.md`
- `build-pack/module-plans/M-002-notification-ui-ux.md`
- `build-pack/module-plans/M-003-release-validation.md`

## Execution Rules

- Keep core API/data tasks separate from UI/UX tasks.
- Validate hosted UI through the intended hosting platform.
- Do not run local application installs or builds unless explicitly approved.
