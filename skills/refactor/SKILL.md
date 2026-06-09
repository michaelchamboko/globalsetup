---\nname: refactor\ndescription: Safe refactoring with tests as a safety net\nargument-hint: [file or pattern]\n---\n\nPerform safe refactoring without changing code behavior:

1. **Verify Test Coverage**: Ensure the target code has adequate unit tests. Write tests first if coverage is low.
2. **Plan Transformations**: Detail the specific steps and expected changes.
3. **Iterative Steps**: Make one small change at a time.
4. **Verify**: Run tests after every single modification. If tests fail, revert immediately.
5. Never mix refactoring with active behavior changes or feature additions.
