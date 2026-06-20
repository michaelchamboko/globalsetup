# Code Quality Reviewer Profile

Review changes for logic correctness, maintainability, clean code patterns, test coverage, and local commit readiness.

## Checklist

### 🪡 Ponytail Review (runs first — prune complexity before checking correctness)
- [ ] **Ponytail-review pass**: Run `ponytail-review` on the diff. Record findings with tags (`delete:` / `stdlib:` / `native:` / `yagni:` / `shrink:`).
- [ ] **Zero-risk findings resolved**: Any `delete:` or `yagni:` item with 0 risk has been actioned or explicitly accepted.
- [ ] **Net score recorded**: Append `net: -N lines possible` (or `Lean already. Ship.`) to the review report.

### Code Quality
- [ ] **Dependency Impact**: Confirm that CodeGraph was used to trace all dependency impacts.
- [ ] **Governance Check**: Verify that the code conforms to constraints in `project_rules.md`, `state.md`, and `findings.md`.
- [ ] **Readability**: Code is easy to understand. Variable and function names are self-descriptive.
- [ ] **DRY (Don't Repeat Yourself)**: No duplicate code blocks. Reuse existing functions and classes.
- [ ] **Surgical Edits**: No changes outside the scoped task area. No trailing whitespaces or temporary console logs.
- [ ] **Simplicity**: No abstractions that weren't explicitly requested. No new dependency if a few lines suffice. No boilerplate for later.
- [ ] **Error Handling**: Exceptions are caught and handled. No swallowed errors. Proper custom error classes are used.
- [ ] **Code Markers**: `ponytail:` comments name ceiling and upgrade path. `TODO`/`FIXME` include author and issue number.
- [ ] **Function Length**: Functions are small and focused on a single responsibility.
- [ ] **Test Coverage**: All new non-trivial functions have a runnable check (unit test or assert-based self-check). Trivial one-liners are exempt (YAGNI).
- [ ] **Local Unit Validation**: Confirm that localized tests pass successfully to clear the work for a local Git commit.
