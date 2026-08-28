---
name: pr-review
description: Use when reviewing a scoped diff, staged changes, or a pull request.
argument-hint: [PR number | staged | path]
---

Conduct a structured review of code changes or a pull request:

1. **Determine Scope**: Review staged changes, a specific file, or a pull request using command line tools (e.g. `git diff`, `gh pr diff`).
2. **PR Quality Check**: Verify the title, description, scope, and declared validation receipts. Size alone is not a defect; identify a real review or rollback boundary before suggesting a split.
3. **Apply Relevant Checklists**: Load only reviewers named by the task's risk and affected boundaries. Run Ponytail review only when explicitly requested.
4. **Synthesize Report**: Lead with actionable findings ordered by severity, each with concrete file evidence. Deduplicate overlapping findings and state when none remain.
