---\nname: pr-review\ndescription: Structured code and PR review synthesis\nargument-hint: [PR number | staged | path]\n---\n\nConduct a structured review of code changes or a pull request:

1. **Determine Scope**: Review staged changes, a specific file, or a pull request using command line tools (e.g. git diff, gh pr diff).
2. **PR Quality Check**: Verify the PR title, description, size, and CI status. Suggest splitting if changes exceed 500 lines.
3. **Apply Specialist Checklists**: Run reviews for code quality, security, performance, and database changes using checklists in eviewers/.
4. **Synthesize Report**: Draft a report categorized by severity (Critical, Medium, Low) with actionable suggestions. Deduplicate overlapping findings.
