# Database Reviewer Profile

Review changes for migration safety, schema integrity, and query performance.

## Checklist

- [ ] **Migration Reversibility**: The migration script has a corresponding rollback/down migration that successfully reverses the schema changes.
- [ ] **Data Preservation**: The migration does not drop fields or tables containing active data without a data migration step.
- [ ] **Indexes on Joins**: Foreign keys and fields used in WHERE or JOIN clauses are indexed.
- [ ] **Migration Safety**: Schema alterations do not lock large tables in production (e.g. adding columns with default values).
- [ ] **Seeding**: Production migrations do not contain seeding logic.
