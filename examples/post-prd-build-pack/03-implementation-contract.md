# Example Implementation Contract â€” User Notification System

## Scope Agreement
This contract binds the implementation to the confirmed PRD and build brief. Any deviation requires explicit approval.

## Deliverables
| # | Deliverable | Acceptance Criteria | Requirement ID |
|---|------------|--------------------|-----------|
| 1 | DB Schema | `notifications` table created with correct fields and indexes | R1, R2 |
| 2 | REST API | GET and PATCH endpoints functional and secure | R1, R3, R4, R6 |
| 3 | SSE Service | Real-time notifications pushed to client within 2 seconds | R7 |
| 4 | Notification Bell | Bell component displays correct unread badge count | R5 |
| 5 | Dropdown Panel | Panel displays list of notifications in reverse chronological order | R1, R2 |
| 6 | Admin Panel | Admin page allows creation of system-wide notifications | R6 |

## Constraints
- [x] No changes to files outside the scope listed in the task graph
- [x] No new dependencies without justification
- [x] No breaking changes to existing APIs
- [x] All changes must pass existing tests
