# Task Plan & Micro-Task Tracking

**Objective**: `[task-master high-level objective]`  
**Last Updated**: `[YYYY-MM-DD]`  

## Micro-Task List

| Task ID | Module | Micro-Task Title | Dependencies | Sub-Agent | Validation Location | Status |
|---------|--------|------------------|--------------|-----------|---------------------|--------|
| T-001 | M-001 | [e.g. Add migration for users table] | None | Builder | [github/vercel/oracle/local-docs-only] | [ ] / [/] / [x] |
| T-002 | M-001 | [e.g. Define User type and schema] | T-001 | Builder | [github/vercel/oracle/local-docs-only] | [ ] |
| T-003 | M-002 | [e.g. Implement GET /api/users] | T-002 | Builder | [github/vercel/oracle/local-docs-only] | [ ] |

## Module Plan References

- `M-001`: `build-pack/module-plans/[module-file].md`
- `M-002`: `build-pack/module-plans/[module-file].md`

## Sub-Agent Contracts

### Contract: `[Task ID]`
- **Input Contract**:
  - Files to read: `[paths]`
  - Requirements: `[description]`
- **Output Contract**:
  - Files to modify/create: `[paths]`
  - Validation Location: `[github/vercel/oracle/local-docs-only/approved-runtime]`
  - Validation Command or Hosted Check: `[command, PR check, deployment log, read-only runtime probe]`
  - Test Metric: `[e.g. hosted check passes, Vercel build succeeds, Oracle read-only query succeeds]`
  - Local Build Exception: `[No / explicit operator approval reference]`
