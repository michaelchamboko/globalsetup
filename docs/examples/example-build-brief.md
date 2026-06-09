# Example: Build Brief — User Notification System

This is an example build brief generated from the User Notification System PRD.

---

## Build Brief

**Feature**: User Notification System  
**PRD Reference**: `docs/examples/example-confirmed-prd.md`  
**Estimated Complexity**: Medium (7 task cards)  

### What Will Be Built

1. A `notifications` database table with columns: id, user_id, title, body, is_read, created_at, type, source_user_id
2. REST API endpoints: GET /api/notifications, PATCH /api/notifications/:id/read, PATCH /api/notifications/read-all, POST /api/notifications (admin only)
3. A real-time delivery channel using WebSocket or Server-Sent Events
4. A notification bell UI component with unread count badge
5. A notification panel/dropdown listing all notifications
6. Admin notification creation form

### What Will NOT Be Built

- Email or SMS delivery
- User preference settings
- Push notifications
- Notification grouping or threading
- Rich media in notifications (images, buttons)

### Assumptions

- The existing WebSocket infrastructure (if any) can be extended, or SSE is acceptable
- The existing user table has a reliable `id` column for foreign key reference
- Admin role is already implemented in the auth system

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| WebSocket scaling under high user count | Medium | High | Use SSE as fallback; add connection pooling |
| Notification table grows unbounded | Low | Medium | Add archival policy; index on user_id + created_at |
| Real-time delivery adds latency to page load | Medium | Medium | Lazy-load WebSocket connection after initial render |

### Acceptance Criteria

- [ ] Authenticated user can view their notifications list
- [ ] Notifications show title, body, timestamp, read/unread status
- [ ] User can mark a notification as read (PATCH returns 200)
- [ ] User can mark all as read (PATCH returns 200, all is_read = true)
- [ ] Notification bell shows correct unread count
- [ ] Admin can create a notification visible to all users
- [ ] New notifications appear without page refresh (within 2 seconds)
- [ ] Page load time increase is under 100ms
- [ ] Mobile viewport displays correctly
