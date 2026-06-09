# Example Rollback Plan â€” User Notification System

## Code Revert
```bash
git checkout main
git revert [deploy-commit-sha]
git push origin main
```

## Database Rollback
Revert the Prisma migration:
```bash
npx prisma migrate resolve --rolled-back "20250115090000_create_notification_table"
```
