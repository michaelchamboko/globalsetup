# Rollback Plan: [Feature Name]

**Date**: [YYYY-MM-DD]  

## Rollback Triggers
Rollback must be initiated if:
- [ ] Production deploy fails or system is unresponsive for > 2 minutes.
- [ ] Error rate increases by > 1% post-deploy.
- [ ] Critical regression in core flow (checkout, auth) is detected.

## Rollback Steps

### 1. Revert Code
`ash
git checkout main
git revert [deploy-commit-sha]
git push origin main
`

### 2. Database Rollback
If database migration was applied:
- command: [migration rollback command]
- Verification query: [SQL query to verify rollback]

### 3. Verification Post-Rollback
- [ ] Verify core services are functional
- [ ] Verify error rates have normalized
