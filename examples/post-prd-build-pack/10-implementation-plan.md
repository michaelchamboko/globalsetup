# Example Implementation Plan â€” User Notification System

## Development Stages

### Stage 1: Database Setup
1. Define the `Notification` model in `prisma.schema`.
2. Generate and apply migration locally.
3. Verify table using Prisma Studio.

### Stage 2: Backend API
1. Implement GET `/api/notifications` with session authorization.
2. Implement PATCH `/api/notifications/:id/read` and `/api/notifications/read-all`.
3. Implement POST `/api/notifications` (admin check).
4. Set up SSE endpoint for real-time connection.

### Stage 3: Frontend components
1. Build `NotificationBell` UI.
2. Build `NotificationPanel` UI dropdown.
3. Integrate SSE listener to update React state.
