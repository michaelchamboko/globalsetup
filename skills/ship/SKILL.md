---
name: ship
description: Stage changes, commit, push, and create PR with safety checks
argument-hint: [commit message]
---

Follow this secure process to commit and push changes:

1. **Scan**: Run git status and git diff. Summarize changes.
2. **Stage**: Select files to stage. Never stage secrets (.env), lockfiles, build output, or configuration files.
3. **Commit**: Write a clean, conventional commit message.
4. **Push**: Push the branch to the remote origin.
5. **Pull Request**: Create a PR targeting the correct branch. Draft a description including a summary, test plan, and rollback strategy.
