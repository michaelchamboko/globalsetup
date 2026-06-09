# Post-PRD Workflow

This document walks through the complete workflow from a confirmed PRD to a shipped feature.

## Prerequisites

- A confirmed PRD with clear requirements, success metrics, and stakeholder approval
- Access to the target codebase
- GlobalSetup files copied into the project

## Phase 1: PRD Review

Before any build planning begins, verify the PRD is actionable:

- All requirements are specific and measurable
- Success metrics are defined
- Constraints and non-goals are documented
- Stakeholders have approved the PRD
- No ambiguous language remains ("should," "might," "could consider")

Use `templates/prd/prd-review-checklist.md` to verify completeness.

## Phase 2: Build Brief

Create a build brief that translates the PRD into an implementation-focused summary:

- What will be built (in technical terms)
- What will NOT be built (explicit non-goals)
- Assumptions and risks
- Acceptance criteria for each requirement

Use `templates/build-requirements/build-brief-template.md`.

## Phase 3: Existing Codebase Discovery

Before writing any code, inspect the target project:

- Language, framework, package manager
- Test runner, linter, formatter
- Database, auth system, routing structure
- Existing patterns, naming conventions
- Deployment and CI/CD workflow
- Areas that must not be touched

Use the `repo-discovery` skill. Output goes to `build-pack/04-existing-codebase-discovery.md`.

## Phase 4: Architecture Map

Document the existing architecture and plan how the new feature integrates:

- System component diagram
- Data flow for the new feature
- Integration points with existing code
- Architecture decisions (with ADRs if needed)

Use `templates/architecture/architecture-map-template.md`.

## Phase 5: Contracts

Define contracts for all interfaces before implementation:

- **Data contract**: Schema changes, migrations, indexes
- **API contract**: Endpoints, request/response shapes, authentication
- **UI contract**: Components, states, responsive behavior
- **Permission contract**: Roles, access control, authorization rules
- **Integration contract**: Third-party service interactions

Use templates in `templates/contracts/`.

## Phase 6: Task Graph

Split the build into ordered, dependency-aware tasks:

- Foundation tasks (schema, config, setup)
- Data/schema tasks (migrations, models)
- API tasks (endpoints, middleware)
- UI tasks (components, pages)
- Integration tasks (connecting pieces)
- Testing tasks (unit, integration, E2E)
- Review tasks (specialist reviews)
- Documentation tasks
- Release tasks

Each task gets a task card with acceptance criteria.

Use `templates/tasks/task-graph-template.md` and `templates/tasks/task-card-template.md`.

## Phase 7: Fresh-Context Task Execution

For large builds, execute tasks in fresh context sessions:

- Each task card is self-contained
- The agent reads the task card, inspects relevant files, implements, tests, and verifies
- No accumulated context debt from previous tasks
- Each task is verified before the next begins

Use the `fresh-context-execution` skill.

## Phase 8: Implementation

For each task:

1. Read the task card
2. Inspect the files listed in "files likely involved"
3. Review existing patterns to follow
4. Implement the smallest correct change
5. Run tests
6. Verify acceptance criteria
7. Mark the task as complete

## Phase 9: Testing

- Unit tests for all new functions
- Integration tests for API endpoints
- UI tests for new components
- Regression tests to verify nothing broke
- Run the full test suite

## Phase 10: Specialist Review

Run relevant reviews using the reviewer profiles:

- Code review (always)
- Security review (if auth, input handling, queries)
- Performance review (if endpoints, queries, loops)
- Database review (if schema changes)
- Frontend review (if UI changes)
- Documentation review (if docs changed)

## Phase 11: Fix and Verify

- Address all review findings
- Re-run affected tests
- Re-verify acceptance criteria
- Confirm lint, typecheck, and build pass

## Phase 12: Ship

Use the pre-ship checklist and ship skill:

1. Complete the Definition of Done checklist
2. Document the rollback plan
3. Commit with meaningful message
4. Push to remote
5. Create PR with summary and test plan
6. Request human review
