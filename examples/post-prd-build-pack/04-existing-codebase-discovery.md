# Example Codebase Discovery â€” User Notification System

## Technology Stack
- **Language**: TypeScript 5.x
- **Framework**: React 18 / Next.js 14 (App Router)
- **Database**: PostgreSQL 15 via Prisma 5.x
- **Auth**: NextAuth.js with JWT
- **CSS**: Tailwind CSS

## Existing Patterns to Follow
- All API routes must use the standard NextAuth `getServerSession` for session verification.
- Database queries should be handled via standard Prisma Client instance located at `src/lib/prisma.ts`.
- Component styles must use Tailwind utility classes.
- Unit testing is run via Vitest.
