# Example Task Graph â€” User Notification System

## Dependency Graph
```
T-001 (Schema) â”€â”€â–¶ T-002 (API) â”€â”€â–¶ T-003 (SSE Setup) â”€â”€â–¶ T-004 (Bell UI) â”€â”€â–¶ T-005 (Panel UI) â”€â”€â–¶ T-006 (PR)
```

## Tasks
- **T-001**: Create database table and run migrations.
- **T-002**: Implement API routes (GET/PATCH).
- **T-003**: Set up SSE endpoints and hooks.
- **T-004**: Create the Notification Bell UI.
- **T-005**: Create the Notification List Dropdown Panel.
- **T-006**: Complete PR verification and ship.
