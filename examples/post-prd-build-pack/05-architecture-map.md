# Example Architecture Map â€” User Notification System

## Component Diagram
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   React Client  â”‚ â—€â”€â”€â”€â–¶ â”‚ Next.js API/SSE â”‚ â—€â”€â”€â”€â–¶ â”‚   PostgreSQL    â”‚
â”‚  (Bell & Panel) â”‚       â”‚ (Routes/SSE)    â”‚       â”‚  (Prisma Client)â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Data Flow
1. Admin submits form -> POST `/api/notifications` -> DB write.
2. SSE handler broadcasts to connected clients.
3. Client receives message -> Updates Bell badge count and dropdown list in real-time.
4. User clicks "Mark as Read" -> PATCH `/api/notifications/:id/read` -> DB update.
