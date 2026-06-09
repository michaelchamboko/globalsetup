# Project Rules & Architecture Guardrails

## ðŸ› ï¸ Technology Stack & Constraints
- Language: [e.g. TypeScript 5.x]
- Framework: [e.g. Next.js 14 (App Router)]
- Database/ORM: [e.g. PostgreSQL / Prisma]
- Core Constraints: [e.g. No external UI libraries without approval]

## ðŸ“ Architecture Principles
1. [Principle 1 â€” e.g. Domain-driven folder structure]
2. [Principle 2 â€” e.g. Strictly separated database and API service layers]
3. [Principle 3 â€” e.g. Unidirectional data flow in state components]

## âœï¸ Coding Conventions
- **Naming**: [e.g. camelCase functions, PascalCase classes, kebab-case directories]
- **Imports**: [e.g. Absolute paths using `@/*`]
- **Error Handling**: [e.g. No generic errors; use CustomException subclasses]

## ðŸ›¡ï¸ Security Guidelines
- [e.g. Validate all API parameters using Zod schemas at route entry]
- [e.g. Enforce RBAC middleware on all routes under `/api/admin/**`]

## ðŸ§ª Testing Rules
- Unit Tests: Required for all business logic helpers (target: 90% coverage).
- Two-Tier Testing model enforced (localized unit checks for commit, full build for push).
