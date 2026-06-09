# Example Test Plan â€” User Notification System

## Test Scenarios

### TS-001: GET /api/notifications requires Authentication
- **Given**: An unauthenticated user.
- **When**: Requests `/api/notifications`.
- **Then**: Returns 401 Unauthorized.

### TS-002: Mark single notification as read
- **Given**: An authenticated user with 1 unread notification.
- **When**: PATCH `/api/notifications/:id/read` is called.
- **Then**: Notification is marked as read in database.

### TS-003: Real-time broadcast (SSE)
- **Given**: Connected SSE client.
- **When**: Admin creates a system-wide alert.
- **Then**: Client receives event with notification details.
