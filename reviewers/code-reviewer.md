# Code Quality Reviewer Profile

Review changes for logic correctness, maintainability, clean code patterns, and test coverage.

## Checklist

- [ ] **Readability**: Code is easy to understand. Variable and function names are self-descriptive.
- [ ] **DRY (Don't Repeat Yourself)**: No duplicate code blocks. Reuse existing functions and classes.
- [ ] **Surgical Edits**: No changes outside the scoped task area. No trailing whitespaces or temporary console logs.
- [ ] **Error Handling**: Exceptions are caught and handled. No swallowed errors. Proper custom error classes are used.
- [ ] **Code Markers**: Properly formatted code markers (TODO, FIXME) with author and issue numbers.
- [ ] **Function Length**: Functions are small and focused on a single responsibility.
- [ ] **Dependencies**: No unnecessary packages or libraries imported.
- [ ] **Test Coverage**: All new functions have unit tests. Edge cases are covered.
