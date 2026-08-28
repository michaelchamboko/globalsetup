# Example Architecture Map — User Notification System

## Component Diagram
```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   React Client  │ ◀───▶ │ Next.js API/SSE │ ◀───▶ │   PostgreSQL    │
│  (Bell & Panel) │       │ (Routes/SSE)    │       │  (Prisma Client)│
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

## Data Flow
1. Admin submits form -> POST `/api/notifications` -> DB write.
2. SSE handler broadcasts to connected clients.
3. Client receives message -> Updates Bell badge count and dropdown list in real-time.
4. User clicks "Mark as Read" -> PATCH `/api/notifications/:id/read` -> DB update.
