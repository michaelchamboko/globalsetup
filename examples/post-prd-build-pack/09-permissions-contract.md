# Example Permissions Contract â€” User Notification System

## Roles
- `USER`: Can view and read their own notifications.
- `ADMIN`: Can send notifications to any user or broadcast system-wide.

## Permissions Matrix
| Action | USER | ADMIN | Guest |
|--------|------|-------|-------|
| GET /api/notifications | âœ… | âœ… | âŒ |
| PATCH /api/notifications/:id/read | âœ… | âœ… | âŒ |
| POST /api/notifications (broadcast) | âŒ | âœ… | âŒ |
