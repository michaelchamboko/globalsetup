# Implementation Contract: [Feature Name]

**Build Brief Reference**: [Link]  
**Date**: [YYYY-MM-DD]  

## Scope Agreement

This contract binds the implementation to the confirmed PRD and build brief. Any deviation requires explicit approval.

## Source Authority and Contradictions

- **Build intent**: [Plain-language statement of what GlobalSetup will build]
- **Approved sources**: [Repository-local PRDs, product-truth documents, blueprints, and explicit decisions]
- **Contradictions**: [Resolved contradiction records / None]
- **Grommet review**: [Approved summary confirming source-to-build alignment]

GitNexus supplies derived dependency and impact evidence only. It cannot introduce, reinterpret, or override requirements.

## Automation Authority

- **Automated publication**: [Enabled / Disabled]
- **Authorized destinations**: [Exact destinations]
- **Execution rule**: An approved publication task proceeds without repeated confirmation and must produce the declared validation and publication receipts.

## Deliverables

| # | Deliverable | Acceptance Criteria | Requirement ID |
|---|------------|--------------------|-----------|
| 1 | [Deliverable] | [How to verify it works] | R1 |
| 2 | [Deliverable] | [How to verify] | R2 |

## Constraints

- [ ] No changes to files outside the scope listed in the task graph
- [ ] No new dependencies without justification
- [ ] No breaking changes to existing APIs
- [ ] All changes must pass existing tests

## Completion Criteria

- [ ] All deliverables verified
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Definition of Done satisfied
