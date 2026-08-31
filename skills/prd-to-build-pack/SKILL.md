---
name: prd-to-build-pack
description: Use when an approved PRD must be compiled into plans, contracts, tasks, and executable state before implementation.
argument-hint: [PRD file path]
---

Follow these steps to transform a confirmed Product Requirements Document (PRD) into a structured build pack:

1. **Register Source Authority**: Inventory every approved PRD, product-truth document, blueprint, and explicit decision in `source_authority.approved_sources`. State the exact build intent, record contradictions, and resolve them with the operator.
2. **Run Mandatory Grommet Review**: Use `reviewers/grommet.md` to compare the proposed build with the approved documents. GitNexus may supply dependency and impact evidence, but never requirements. Do not approve while any contradiction remains unresolved.
3. **Verify the PRD**: Read the confirmed PRD and run it through the checklist in `templates/prd/prd-review-checklist.md`.
4. **Run Codebase Discovery**: Execute the `repo-discovery` skill to understand the existing technologies, architecture, deployment targets, and constraints.
5. **Draft the Build Brief**: Create the build brief using `templates/build-requirements/build-brief-template.md`.
6. **Map the Architecture**: Create `build-pack/05-architecture-map.md` using the architecture map template.
7. **Establish Contracts**: Create the database, API, UI, permission, and integration contracts using templates under `templates/contracts/`.
8. **Generate Build Plans**: Create `build-pack/build-plans/01-build-plan-index.md` and, for user-facing products, `build-pack/build-plans/02-ui-ux-build-plan.md`.
9. **Generate Module Plans**: Create one module plan per implementation area under `build-pack/module-plans/` using `templates/tasks/module-plan-template.md`. User-facing products must include a UI/UX module plan using `templates/tasks/ui-ux-module-plan-template.md`.
10. **Generate the Task Graph**: Define the dependency-ordered task graph and reference every module plan.
11. **Generate Task Cards**: Create fresh-context task cards that reference module plans and declare risk plus validation location.
12. **Compile Execution State**: Mirror the approved graph into `build-pack/execution-state.json`. Every task declares approved `requirement_sources` and includes them in `context_files`; every check declares a risk tier, `command` or `receipt` kind, and validation location.
13. **Declare Automation Authority**: Record whether automated publication is enabled and list every authorized destination. An approved publication task proceeds without another confirmation; undeclared destinations fail closed.
14. **Validate the Contract**: Run BuildRunner `validate` and resolve every structural error before requesting operator approval.
15. **Enforce Deployment-First Validation**: Do not include local application installs, local production builds, local dev servers, or full local typechecks unless the operator explicitly opts into local preview.
