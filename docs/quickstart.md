# Quickstart

Get started with GlobalSetup in 5 minutes.

## Step 1: Clone GlobalSetup

```bash
git clone https://github.com/michaelchamboko/globalsetup.git
```

## Step 2: Copy Into Your Target Project

Use the setup script to copy GlobalSetup files into your project:

**Linux / macOS:**
```bash
bash globalsetup/scripts/setup-globalsetup.sh /path/to/your/project
```

**Windows (PowerShell):**
```powershell
.\\globalsetup\\scripts\\setup-globalsetup.ps1 -TargetDir C:\\path\\to\\your\\project
```

This copies the following into your project:
- `AGENTS.md` — Universal agent instructions
- `docs/` — Documentation
- `templates/` — All build pack templates
- `rules/` — Agent behavior rules
- `skills/` — Reusable workflow definitions
- `reviewers/` — Specialist reviewer profiles
- `safeguards/` — Protective rules and checklists

Existing files in your project are never overwritten. If a conflict is detected, the setup script creates a `.bak` backup first.

## Step 3: Add Your Confirmed PRD

Place your confirmed PRD in the project root or a `docs/` directory. Use the template at `templates/prd/confirmed-prd-template.md` as a starting point.

## Step 4: Generate the Build Pack

**Linux / macOS:**
```bash
bash scripts/generate-build-pack.sh
```

**Windows (PowerShell):**
```powershell
.\\scripts\\generate-build-pack.ps1
```

This creates a `build-pack/` directory with blank templates for all 17 build pack documents.

## Step 5: Fill In the Build Pack

Use the `prd-to-build-pack` skill to guide your agent through transforming the confirmed PRD into a complete build pack. The agent should:

1. Read the confirmed PRD
2. Run the `repo-discovery` skill to inspect the existing codebase
3. Fill in each build pack document using the templates
4. Review the build pack for completeness

## Step 6: Execute the Task Graph

Once the build pack is complete:

1. Review the task graph (`build-pack/11-task-graph.md`)
2. Execute tasks in dependency order using the `fresh-context-execution` skill
3. Each task is self-contained with its own acceptance criteria
4. Verify each task before moving to the next

## Step 7: Run Review Gates

Before shipping:

1. Run relevant specialist reviews using the reviewer profiles in `reviewers/`
2. Address all findings
3. Complete the pre-ship checklist in `safeguards/pre-ship-checklist.md`
4. Verify the Definition of Done (`build-pack/16-definition-of-done.md`)

## Step 8: Ship

Use the `ship` skill to commit, push, and create a PR with safety checks at every step.

## Next Steps

- Read `docs/post-prd-workflow.md` for a detailed workflow walkthrough
- Read `docs/adapting-to-projects.md` for project-specific customization
- Review `rules/` for agent behavior rules
- Explore `examples/post-prd-build-pack/` for a complete example build pack
