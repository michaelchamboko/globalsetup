# Example Task Graph — User Notification System

## Dependency Graph
```
T-001 (Schema) ──▶ T-002 (API) ──▶ T-003 (SSE Setup) ──▶ T-004 (Bell UI) ──▶ T-005 (Panel UI) ──▶ T-006 (PR)
```

## Module Plans

- `M-001`: `module-plans/M-001-notification-core.md`
- `M-002`: `module-plans/M-002-notification-ui-ux.md`
- `M-003`: `module-plans/M-003-release-validation.md`

## Tasks
- **T-001 / M-001**: Create database migration artifact and verify in approved runtime.
- **T-002 / M-001**: Implement API routes (GET/PATCH).
- **T-003 / M-001**: Set up SSE endpoints and hooks.
- **T-004 / M-002**: Create the Notification Bell UI.
- **T-005 / M-002**: Create the Notification List Dropdown Panel.
- **T-006 / M-003**: Complete hosted verification and ship.
