# Database Contract: [Feature Name]

**Date**: [YYYY-MM-DD]  
**Database**: [e.g., PostgreSQL 15]  
**ORM**: [e.g., Prisma 5.x]  

## Schema Changes

### New Tables

#### [table_name]

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID / SERIAL | No | gen_random_uuid() | Primary key |
| [column] | [type] | [Yes/No] | [default] | [description] |
| created_at | TIMESTAMP | No | NOW() | Record creation time |
| updated_at | TIMESTAMP | No | NOW() | Last update time |

**Indexes**:
- idx_[table]_[column] on ([column]) â€” [reason]

**Foreign Keys**:
- k_[table]_[ref_table] references [ref_table](id) ON DELETE [CASCADE/SET NULL/RESTRICT]

### Modified Tables

#### [existing_table_name]

| Change | Column | Details |
|--------|--------|---------|
| ADD | [column] | [type, nullable, default] |
| ALTER | [column] | [what changes] |

## Migrations

- Migration 1: [filename] â€” Create [table_name]
- Migration 2: [filename] â€” Add indexes

## Rollback Plan

- Migration 1 rollback: DROP TABLE [table_name]
- Migration 2 rollback: DROP INDEX [index_name]

## Data Considerations

- Estimated initial row count: [N]
- Estimated growth rate: [N rows/day]
- Archival policy: [if applicable]
