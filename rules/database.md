---
paths:
  - "**/migrations/**"
  - "**/migrate/**"
  - "**/db/migrate/**"
  - "**/alembic/**"
  - "**/alembic/versions/**"
  - "**/prisma/migrations/**"
  - "**/drizzle/**"
  - "**/knex/migrations/**"
  - "**/sequelize/migrations/**"
  - "**/typeorm/migrations/**"
  - "**/flyway/**"
  - "**/liquibase/**"
---

# Database Migrations

- **Never modify an existing migration.** Always create a new migration for changes. Existing migrations may have already run in production.
- Every migration must be reversible. Implement both up/forward and down/rollback.
- Test migrations in both directions before committing.
- Migration filenames are ordered by timestamp prefix. New migrations go at the end.
- Never use raw SQL when the ORM or migration tool provides a method for the operation.
- Never seed production data in migration files. Use dedicated seed files.
- Never drop columns or tables without first confirming the data is no longer needed.
- Add indexes in their own migration, not bundled with schema changes. Easier to roll back independently.

## Database Queries & Caching Contract

Any database access layer or API endpoint interacting with persistence layers must satisfy strict query optimization and caching patterns.

### Query and Cache Optimization Guidelines

| Optimization Vector | Anti-Pattern (Outlawed) | Required Engineering Pattern | Validation Rule |
| :--- | :--- | :--- | :--- |
| **N+1 Query Loops** | Looping over a collection and executing individual sub-resource queries inside the loop. | Batch pre-fetching, batch joins, or eager-loading relations (e.g., `include`, `populate`, `join`). | Flag sequential queries executed within loop contexts. |
| **High-Traffic GET Endpoints** | Direct database queries for every request on endpoints with high read traffic. | Key-value micro-caching layer (e.g., Vercel KV, Redis, or local memory cache). | Mandate caching wrapper around GET controllers. |
| **Cache Horizon & Invalidation** | Infinite cache lifespan (missing TTL) or missing invalidation triggers upon data update. | Explicit short-lived Time-To-Live (TTL) horizons + cache eviction hooks mapped to mutations. | Check for `ttl` param and cache clear calls on POST/PATCH/DELETE. |

### Implementation Checklist

- [ ] **No N+1 Queries**: If object schemas require related sub-resource data inside a loop, pre-fetch/eager-load all relations in a single, combined database lookup.
- [ ] **Micro-Caching for High-Traffic Read Routes**: Wrap read-heavy GET API controllers in a caching utility matching the hosting specification.
- [ ] **Short-Lived TTL**: Declare an explicit, short-lived TTL (e.g., 60 seconds or less for dynamic data) to keep caches fresh.
- [ ] **Explicit Invalidation**: Pair caching with explicit invalidation triggers. Any mutation (POST, PUT, PATCH, DELETE) affecting the cached resource must immediately evict the corresponding cache keys.

