---\nname: repo-discovery\ndescription: Inspects target project before making code changes\n---\n\nInspect the target project to understand its current technology stack, routing structure, database models, conventions, and existing risks:

1. Identify the languages and framework versions (e.g. check package.json, go.mod, equirements.txt).
2. Map the top-level directory structure.
3. Find the database configuration, ORM, schema definitions, and migration folders.
4. Discover routing and API structure (endpoints, controllers, routers).
5. Locate design tokens, layout patterns, and frontend component styles.
6. Identify the testing framework, test runners, linters, formatters, and CI/CD pipelines.
7. Record findings in uild-pack/04-existing-codebase-discovery.md using the template.
