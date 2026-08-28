# Task Graph: [Feature Name]

**Build Brief Reference**: [Link]
**Module Plan Directory**: `build-pack/module-plans/`
**Total Tasks**: [N]
**Estimated Effort**: [Low / Medium / High]

BuildRunner state in `build-pack/execution-state.json` is authoritative. Status columns in this document are planning snapshots only and must not be updated during execution.

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

Split a task when it crosses an independent dependency, risk, validation, or permission boundary, or cannot be completed and verified as one coherent change. Do not split solely to satisfy an arbitrary file or step count.

## Validation Rule

Every task must declare a validation location through its task card. Hosted applications validate in their intended platform; local application builds are prohibited unless explicitly approved by the operator.

Before execution, mirror every approved task into `build-pack/execution-state.json` and run BuildRunner `validate`.
