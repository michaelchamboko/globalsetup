# Implementation Plan

**Status**: [Proposed / Approved / In progress / Complete]  
**Last Updated**: [YYYY-MM-DD]  

## Execution Doctrine

- Build source and plans in the repository.
- Push changes to GitHub for branch/PR tracking.
- Validate hosted applications in their intended platform, such as Vercel.
- Validate external runtimes, databases, workers, and infrastructure only in their approved target environments.
- Do not run local dependency installs, local production builds, local dev servers, or full local typechecks unless the operator explicitly opts into local preview.

## Stage 0 - Planning Approval

- [ ] PRD reviewed and confirmed.
- [ ] Build pack generated.
- [ ] Module plans generated under `build-pack/module-plans/`.
- [ ] Task graph references module plans.
- [ ] Task cards include validation location and local-build exception fields.

## Stage 1 - Repository / Delivery Setup

- [ ] GitHub repository confirmed.
- [ ] Deployment target confirmed.
- [ ] Required hosted environment variables documented without secrets.
- [ ] Branch/PR strategy confirmed.

## Stage 2 - Module Execution

| Stage | Module Plan | Entry Task | Exit Gate |
|-------|-------------|------------|-----------|
| [stage] | `build-pack/module-plans/M-001-[name].md` | [task id] | [hosted/runtime validation gate] |

## Stage 3 - Hosted / Runtime Validation

- [ ] GitHub branch pushed.
- [ ] Hosted build/deploy check passed.
- [ ] Target-runtime probes passed.
- [ ] Specialist reviews complete.

## Stage 4 - Release

- [ ] Rollback plan reviewed.
- [ ] Definition of Done complete.
- [ ] Pre-ship checklist complete.
- [ ] PR opened or deployment handoff documented.
