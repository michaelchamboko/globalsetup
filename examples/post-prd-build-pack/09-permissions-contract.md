# Example Permissions Contract — User Notification System

## Roles
- `USER`: Can view and read their own notifications.
- `ADMIN`: Can send notifications to any user or broadcast system-wide.

## Permissions Matrix
| Action | USER | ADMIN | Guest |
|--------|------|-------|-------|
| GET /api/notifications | ✅ | ✅ | ❌ |
| PATCH /api/notifications/:id/read | ✅ | ✅ | ❌ |
| POST /api/notifications (broadcast) | ❌ | ✅ | ❌ |
