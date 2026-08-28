# Project Rules & Architecture Guardrails

## 🛠️ Technology Stack & Constraints
- Language: [e.g. TypeScript 5.x]
- Framework: [e.g. Next.js 14 (App Router)]
- Database/ORM: [e.g. PostgreSQL / Prisma]
- Core Constraints: [e.g. No external UI libraries without approval]

## 📐 Architecture Principles
1. [Principle 1 — e.g. Domain-driven folder structure]
2. [Principle 2 — e.g. Strictly separated database and API service layers]
3. [Principle 3 — e.g. Unidirectional data flow in state components]

## ✍️ Coding Conventions
- **Naming**: [observed repository conventions and the representative files that establish them]
- **Imports**: [e.g. Absolute paths using `@/*`]
- **Error Handling**: [e.g. No generic errors; use CustomException subclasses]

## 🛡️ Security Guidelines
- [e.g. Validate all API parameters using Zod schemas at route entry]
- [e.g. Enforce RBAC middleware on all routes under `/api/admin/**`]

## 🧪 Testing Rules
- Unit Tests: Required for all business logic helpers (target: 90% coverage).
- Intended-location validation enforced. Hosted apps build in their hosting platform, not locally by default.
- Local dependency installs, local production builds, local dev servers, and full local typechecks require explicit operator opt-in.
