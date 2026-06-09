---
name: repo-discovery
description: Inspects target project using CodeGraph before making code changes.
---

Inspect the target project to understand its current technology stack, routing structure, database models, conventions, and existing risks:

1. **Scan stack & structure**: Identify the languages and framework versions (e.g. check `package.json`, `go.mod`, `requirements.txt`). Map the top-level directory structure.
2. **Trace dependencies (CodeGraph)**: Use the `CodeGraph` tool to map how components, services, and modules are connected. Trace imports across module boundaries.
3. **Database discovery**: Find the database configuration, ORM, schema definitions, and migration folders. Trace how models are accessed.
4. **API discovery**: Discover routing and API structure (endpoints, controllers, routers) and their authentication middlewares.
5. **Frontend discovery**: Locate design tokens, layout patterns, and frontend component styles.
6. **Tooling discovery**: Identify the testing framework, test runners, linters, formatters, and CI/CD pipelines.
7. **Constraint Audit**: Check for existing constraints in `project_rules.md`, `state.md`, and `findings.md`.
8. **Record findings**: Save findings to `build-pack/04-existing-codebase-discovery.md` using the template.
