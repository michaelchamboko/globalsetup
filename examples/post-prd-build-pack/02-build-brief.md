# Example Build Brief â€” User Notification System

**Feature**: User Notification System  
**Estimated Complexity**: Medium (7 task cards)  

### What Will Be Built
1. A `notifications` database table with columns: id, user_id, title, body, is_read, created_at, type, source_user_id.
2. REST API endpoints: GET /api/notifications, PATCH /api/notifications/:id/read, PATCH /api/notifications/read-all, POST /api/notifications (admin only).
3. A real-time delivery channel using Server-Sent Events (SSE).
4. A notification bell UI component with unread count badge.
5. A notification panel/dropdown listing all notifications.
6. Admin notification creation form.

### What Will NOT Be Built
- Email or SMS delivery.
- User preference settings.
- Push notifications.

### Acceptance Criteria
- [ ] Authenticated user can view their notifications list.
- [ ] Notifications show title, body, timestamp, read/unread status.
- [ ] User can mark a notification as read (PATCH returns 200).
- [ ] User can mark all as read (PATCH returns 200, all is_read = true).
- [ ] Notification bell shows correct unread count.
- [ ] Admin can create a notification visible to all users.
- [ ] New notifications appear without page refresh (within 2 seconds).
