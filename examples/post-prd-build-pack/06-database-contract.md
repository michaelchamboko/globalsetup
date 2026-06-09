# Example Database Contract â€” User Notification System

## Schema Changes

### New Table: `Notification`
```prisma
model Notification {
  id             String   @id @default(uuid())
  userId         String
  title          String
  body           String
  isRead         Boolean  @default(false)
  createdAt      DateTime @default(now())
  type           String   // "SYSTEM", "MESSAGE", "ALERT"
  sourceUserId   String?
  
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}
```

## Migrations
- Prisma Migration: `20250115090000_create_notification_table`
