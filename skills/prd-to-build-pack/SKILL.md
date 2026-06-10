---
name: prd-to-build-pack
description: Transforms a confirmed PRD into a complete build pack
argument-hint: [PRD file path]
---

Follow these steps to transform a confirmed Product Requirements Document (PRD) into a structured build pack:

1. **Verify the PRD**: Read the confirmed PRD and run it through the checklist in `templates/prd/prd-review-checklist.md`.
2. **Run Codebase Discovery**: Execute the `repo-discovery` skill to understand the existing technologies, architecture, deployment targets, and constraints.
3. **Draft the Build Brief**: Create the build brief using `templates/build-requirements/build-brief-template.md`.
4. **Map the Architecture**: Create `build-pack/05-architecture-map.md` using the architecture map template.
5. **Establish Contracts**: Create the database, API, UI, permission, and integration contracts using templates under `templates/contracts/`.
6. **Generate Module Plans**: Create one module plan per implementation area under `build-pack/module-plans/` using `templates/tasks/module-plan-template.md`. Module plans are mandatory.
7. **Generate the Task Graph**: Define the dependency-ordered task graph and reference every module plan.
8. **Generate Task Cards**: Create fresh-context task cards that reference module plans and declare validation location.
9. **Enforce Deployment-First Validation**: Do not include local application installs, local production builds, local dev servers, or full local typechecks unless the operator explicitly opts into local preview.
