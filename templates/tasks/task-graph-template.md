# Task Graph: [Feature Name]

**Build Brief Reference**: [Link]
**Module Plan Directory**: `build-pack/module-plans/`
**Total Tasks**: [N]
**Estimated Effort**: [Low / Medium / High]

## Module Coverage

| Module ID | Module Plan | Responsibility | Validation Location |
|-----------|-------------|----------------|---------------------|
| M-001 | `build-pack/module-plans/M-001-[name].md` | [responsibility] | [github/vercel/oracle/local-docs-only] |

## Foundation Tasks

| ID | Module | Title | Dependencies | Status |
|----|--------|-------|--------------|--------|
| T-001 | M-001 | [Task title] | None | [ ] |

## Data / Schema Tasks

| ID | Module | Title | Dependencies | Status |
|----|--------|-------|--------------|--------|
| T-00N | M-00N | [Task title] | [T-001] | [ ] |

## API Tasks

| ID | Module | Title | Dependencies | Status |
|----|--------|-------|--------------|--------|
| T-00N | M-00N | [Task title] | [deps] | [ ] |

## UI Tasks

| ID | Module | Title | Dependencies | Status |
|----|--------|-------|--------------|--------|
| T-00N | M-00N | [Task title] | [deps] | [ ] |

## Integration Tasks

| ID | Module | Title | Dependencies | Status |
|----|--------|-------|--------------|--------|
| T-00N | M-00N | [Task title] | [deps] | [ ] |

## Testing / Validation Tasks

| ID | Module | Title | Dependencies | Status |
|----|--------|-------|--------------|--------|
| T-00N | M-00N | [Task title] | [deps] | [ ] |

## Review Tasks

| ID | Module | Title | Dependencies | Status |
|----|--------|-------|--------------|--------|
| T-00N | M-00N | [Task title] | [deps] | [ ] |

## Documentation Tasks

| ID | Module | Title | Dependencies | Status |
|----|--------|-------|--------------|--------|
| T-00N | M-00N | [Task title] | [deps] | [ ] |

## Release Tasks

| ID | Module | Title | Dependencies | Status |
|----|--------|-------|--------------|--------|
| T-00N | M-00N | [Task title] | [deps] | [ ] |

## Dependency Diagram

```text
[Text-based dependency diagram]
```

## Sizing Rule

No single task card may modify more than three source files or require more than three implementation steps. If a task exceeds that size, split it before Step 2 execution.

## Validation Rule

Every task must declare a validation location through its task card. Hosted applications validate in their intended platform; local application builds are prohibited unless explicitly approved by the operator.
