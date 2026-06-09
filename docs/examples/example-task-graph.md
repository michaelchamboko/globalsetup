# Example: Task Graph — User Notification System

This is an example task graph generated from the User Notification System build brief.

---

## Task Graph

### Foundation Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-001 | Create notifications database table and migration | None | [ ] |
| T-002 | Add notification model and data access layer | T-001 | [ ] |

### API Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-003 | Implement GET /api/notifications endpoint | T-002 | [ ] |
| T-004 | Implement PATCH /api/notifications/:id/read endpoint | T-002 | [ ] |
| T-005 | Implement PATCH /api/notifications/read-all endpoint | T-002 | [ ] |
| T-006 | Implement POST /api/notifications (admin) endpoint | T-002 | [ ] |

### Real-Time Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-007 | Set up SSE/WebSocket notification delivery channel | T-002 | [ ] |

### UI Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-008 | Create notification bell component with unread count | T-003 | [ ] |
| T-009 | Create notification panel/dropdown component | T-003, T-004, T-005 | [ ] |
| T-010 | Create admin notification creation form | T-006 | [ ] |
| T-011 | Integrate real-time updates into notification bell | T-007, T-008 | [ ] |

### Testing Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-012 | Write API endpoint tests | T-003, T-004, T-005, T-006 | [ ] |
| T-013 | Write UI component tests | T-008, T-009, T-010 | [ ] |
| T-014 | Write integration and E2E tests | T-011 | [ ] |

### Review Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-015 | Security review (auth, permissions, input validation) | T-014 | [ ] |
| T-016 | Performance review (query efficiency, real-time overhead) | T-014 | [ ] |

### Release Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-017 | Final verification and Definition of Done | T-015, T-016 | [ ] |
| T-018 | Ship PR | T-017 | [ ] |

### Dependency Graph (Visual)

```
T-001 → T-002 → T-003 → T-008 → T-011 → T-014 → T-015 → T-017 → T-018
                 ├─────→ T-004 → T-009 ──────┘      │        │
                 ├─────→ T-005 → T-009              └→ T-016 ┘
                 ├─────→ T-006 → T-010 → T-013
                 └─────→ T-007 ──────→ T-011
                                  T-012 ←── T-003..T-006
```
