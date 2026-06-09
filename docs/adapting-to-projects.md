# Adapting GlobalSetup to Your Project

GlobalSetup provides generic templates and rules. Here is how to customize them for different project types.

## Customizing Rules

Rules in `rules/` are starting points. Adapt them to your project:

### For a Python Project
- Update `rules/code-quality.md` naming conventions (snake_case, PascalCase classes)
- Update `rules/testing.md` to reference pytest conventions
- Update `rules/database.md` for Alembic or Django migrations
- Frontend rules may not apply — remove or scope them

### For a Go Project
- Update naming conventions to Go standards (CamelCase exports, lowercase unexported)
- Testing references should use `go test` conventions
- Error handling should reference Go error patterns (error returns, not exceptions)
- Remove frontend rules if not applicable

### For a Full-Stack Project
- All rules likely apply
- Consider adding path-scoping metadata to rules (e.g., security rules apply to `src/api/**`)
- Frontend rules apply to component files

## Customizing Templates

Not every template applies to every project:

- **API-only service**: Skip `templates/contracts/ui-contract-template.md`
- **Static site**: Skip database and API contracts
- **Mobile app**: Adapt UI contract for mobile patterns
- **CLI tool**: Skip UI and possibly API contracts

## Customizing Reviewers

Include only the reviewers relevant to your project:

- **Backend API**: code-reviewer, security-reviewer, performance-reviewer, database-reviewer
- **Frontend app**: code-reviewer, frontend-reviewer, performance-reviewer
- **Full-stack**: All reviewers
- **Library/SDK**: code-reviewer, documentation-reviewer, architecture-reviewer

## Adding Project-Specific Skills

Create new skills in `skills/` following the SKILL.md pattern:

```yaml
---
name: your-skill-name
description: What this skill does and when to use it
---

[Step-by-step instructions]
```

## Scoping Rules by Path

To reduce noise, scope rules to relevant files using metadata:

```yaml
---
paths:
  - "src/api/**"
  - "**/controllers/**"
---
```

This tells agents to apply the rule only when working near those file patterns.

## Project-Specific Safeguards

Add project-specific protected files and dangerous commands to `safeguards/`:

- Add your production database credentials files to `safeguards/protected-files.md`
- Add your production deployment commands to `safeguards/dangerous-command-rules.md`
- Customize the pre-ship checklist for your CI/CD pipeline
