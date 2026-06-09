# Release and Deployment Reviewer Profile

Review changes for release readiness, rollback confidence, and deployment impact.

## Checklist

- [ ] **Rollback Plan**: The rollback steps are documented, executable, and verified.
- [ ] **Environment Variables**: New environment variables are listed, and instructions are provided to configure them in staging/production.
- [ ] **Backward Compatibility**: APIs and schemas are backward-compatible, preventing downtime during rolling deploys.
- [ ] **Deployment Checklist**: The deployment steps are fully documented and ready for execution.
- [ ] **Pull Request Quality**: The PR has a clear description, a summary of changes, and evidence of successful test execution.
