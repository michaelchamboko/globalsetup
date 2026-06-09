# Destructive Change Policy

Any change that could cause data loss, API breaks, or system downtime is classified as a **Destructive Change** and must follow this policy.

## Definitions of Destructive Changes

- **Database**: Dropping tables, dropping columns, altering column types, renaming columns, removing indexes.
- **APIs**: Removing endpoints, changing request/response parameter names, altering authentication requirements.
- **File System**: Deleting configuration directories, removing critical utility libraries.

## Enforcement Policy

1. **Verify Impact**: Assess if the change is backward-compatible.
2. **Two-Step Migration**: If dropping a database column, first deploy code that does not use the column, then run a separate migration to drop it.
3. **Rollback Verification**: Verify that the migration rollback script is functional and recovers the schema state successfully.
4. **Explicit Warning**: Preface implementation plans containing destructive changes with: **WARNING: POTENTIALLY DESTRUCTIVE CHANGE**.
