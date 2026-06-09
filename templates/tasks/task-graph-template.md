# Task Graph: [Feature Name]

**Build Brief Reference**: [Link]  
**Total Tasks**: [N]  
**Estimated Effort**: [Low / Medium / High]  

## Foundation Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-001 | [Task title] | None | [ ] |

## Data / Schema Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-00N | [Task title] | [T-001] | [ ] |

## API Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-00N | [Task title] | [deps] | [ ] |

## UI Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-00N | [Task title] | [deps] | [ ] |

## Integration Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-00N | [Task title] | [deps] | [ ] |

## Testing Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-00N | [Task title] | [deps] | [ ] |

## Review Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-00N | [Task title] | [deps] | [ ] |

## Documentation Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-00N | [Task title] | [deps] | [ ] |

## Release Tasks

| ID | Title | Dependencies | Status |
|----|-------|-------------|--------|
| T-00N | [Task title] | [deps] | [ ] |

## Dependency Diagram

`
[Text-based dependency diagram]
`
"@

# 18. task-card-template.md
Write-Template "tasks/task-card-template.md" @"
# Task Card: [T-NNN] [Title]

**Task Graph Reference**: [Link]  
**Dependencies**: [T-001, T-002]  
**Status**: [ ] Not started / [/] In progress / [x] Complete  

## Objective

[One clear sentence: what this task accomplishes]

## Files Likely Involved

- [file/path/1] (new or modify) â€” [purpose]
- [file/path/2] (modify) â€” [purpose]

## Requirements Mapped

- **[R1]**: [Requirement description]
- **[R2]**: [Requirement description]

## Implementation Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Testing Plan

- **Automated**: Run [test command] to verify the changes.
- **Manual**: [Manual verification steps]

## Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
