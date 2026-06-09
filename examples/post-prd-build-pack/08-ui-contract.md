# Example UI Contract â€” User Notification System

## Components

### `NotificationBell`
- **Purpose**: Displays the bell icon with an unread badge.
- **Props**:
  - `userId: string`
- **States**:
  - `unreadCount: number`

### `NotificationPanel`
- **Purpose**: Dropdown list of notifications.
- **States**:
  - `notifications: Notification[]`
  - `isLoading: boolean`
  - `error: string | null`
- **Responsive**: Overlay takes full screen on mobile viewports (< 768px).
