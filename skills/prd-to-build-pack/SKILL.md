---\nname: prd-to-build-pack\ndescription: Transforms a confirmed PRD into a complete build pack\nargument-hint: [PRD file path]\n---\n\nFollow these steps to transform a confirmed Product Requirements Document (PRD) into a structured build pack:

1. **Verify the PRD**: Read the confirmed PRD and run it through the checklist in 	emplates/prd/prd-review-checklist.md.
2. **Run Codebase Discovery**: Execute the epo-discovery skill to understand the existing technologies and architecture.
3. **Draft the Build Brief**: Create the build brief using 	emplates/build-requirements/build-brief-template.md.
4. **Map the Architecture**: Create uild-pack/05-architecture-map.md using the architecture map template.
5. **Establish Contracts**: Create the database, API, UI, and permission contracts using templates under 	emplates/contracts/.
6. **Generate the Task Graph**: Define the dependency-ordered task graph and individual task cards.
