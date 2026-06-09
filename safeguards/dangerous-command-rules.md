# Dangerous Command Rules

The following commands are considered dangerous and are hard-blocked or require explicit confirmation.

## Hard-Blocked Commands

The following commands must **NEVER** be executed during a standard build:

- **Git Force Push**: git push --force, git push -f (use --force-with-lease only with explicit developer approval on feature branches).
- **Git Reset Hard on Core Branches**: git reset --hard when on main, master, or production branches.
- **Production Package Publish**: 
pm publish or similar commands.
- **Arbitrary Recursive Delete**: m -rf / or recursive deletes outside your project working directory.
- **Production Database Drops**: DROP TABLE, DROP DATABASE or similar raw SQL commands targeting production.

## Commands Requiring Interactive Confirmation

The following commands must be confirmed with the user:

- git clean -fd (could delete untracked work files).
- Database migrations targeting staging/production.
- System-level configuration changes (chmod, chown).
