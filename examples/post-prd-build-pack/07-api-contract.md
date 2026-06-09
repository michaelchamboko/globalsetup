# Example API Contract â€” User Notification System

## Endpoints

### GET `/api/notifications`
* **Description**: Retrieve notifications for the authenticated user.
* **Response (200)**:
```json
{
  "notifications": [
    {
      "id": "e6a1172a-4bc7-4e9b-b0b2-32a210ff4a9b",
      "title": "New Alert",
      "body": "Your order has shipped.",
      "isRead": false,
      "createdAt": "2025-01-15T12:00:00Z"
    }
  ]
}
```

### PATCH `/api/notifications/:id/read`
* **Description**: Mark a single notification as read.
* **Response (200)**: `{ "success": true }`

### PATCH `/api/notifications/read-all`
* **Description**: Mark all notifications as read for the user.
* **Response (200)**: `{ "success": true }`
