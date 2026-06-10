# GlobalSetup Overview

GlobalSetup is a harness-neutral post-PRD agentic build system. It provides a structured approach to converting confirmed Product Requirements Documents (PRDs) into implementable build packs that any capable coding agent can execute.

## What Problem Does This Solve?

Coding agents often receive vague requirements and jump straight to implementation. This leads to:

- Misunderstood requirements
- Architecture that conflicts with existing code
- Missing acceptance criteria
- No rollback plan
- Scope creep during implementation
- Incomplete testing
- No review gates before shipping

GlobalSetup solves this by inserting a structured planning phase between PRD confirmation and implementation.

## The Post-PRD Pipeline

Every build follows this pipeline:

```
Confirmed PRD
→ PRD Review
→ Build Brief
→ Existing Codebase Discovery
→ Architecture Map
→ Data/API/UI/Permission Contracts
→ Module Plans
→ Task Graph
→ Fresh-Context Task Cards
→ Intended-Location Implementation
→ Hosted / Runtime Validation
→ Specialist Review
→ Fixes
→ Final Verification
→ Ship / PR
```

## Components

### Rules

Rules define behavioral constraints and quality standards. They cover code quality, testing, security, database operations, frontend development, error handling, git workflow, and Karpathy-inspired build discipline.

### Skills

Skills are reusable workflow definitions that guide an agent through a specific process. Key skills include:

- **prd-to-build-pack**: Transforms a confirmed PRD into a complete build pack
- **repo-discovery**: Inspects a target project before any code changes
- **architecture-map**: Generates an architecture map from discovery output
- **task-graph**: Splits work into dependency-ordered tasks
- **fresh-context-execution**: Executes a single task card in isolation
- **tdd**: Test-Driven Development workflow
- **pr-review**: Structured code review with specialist reviewers
- **ship**: Commit, push, and PR creation with safety checks

### Templates

Templates provide fill-in-the-blank structures for every document in the build pack. Categories include PRD, build requirements, architecture, contracts, module plans, tasks, and QA.

### Reviewers

Specialist reviewer profiles define focused review perspectives: code quality, security, performance, documentation, frontend, architecture, database, QA, product requirements, and release readiness.

### Safeguards

Safeguards define protective rules against dangerous operations: destructive commands, protected files, destructive change policies, and pre-ship checklists.

## Design Principles

1. **Harness-neutral**: Works with any coding agent, IDE, or execution environment
2. **Post-PRD focused**: Assumes requirements are confirmed before the system engages
3. **Discovery before implementation**: Always inspect the existing codebase first
4. **Contract-driven**: Define data, API, UI, and permission contracts before coding
5. **Module-planned**: Every implementation area gets a module plan before task cards
6. **Deployment-first**: Hosted apps validate in their intended platform, not through local builds by default
7. **Fresh-context friendly**: Large builds split into independent, self-contained tasks
8. **Review-gated**: Specialist reviews at defined checkpoints before shipping
