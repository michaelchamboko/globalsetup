---
name: ship
description: Stage changes, commit, push, and create PR — with ponytail-done completion gate
argument-hint: [commit message]
---

Follow this secure process to commit and push changes:

1. **🪡 Ponytail Done (runs first)**: Run `ponytail-done` on the session diff. Must return `SHIP.` before proceeding. If `HOLD`, fix the listed items first.
2. **Scan**: Run `git status` and `git diff`. Summarize changes.
3. **Stage**: Select files to stage. Never stage secrets (`.env`), lockfiles, build output, or configuration files.
4. **Commit**: Write a clean, conventional commit message.
5. **Push**: Push the branch to the remote origin.
6. **Pull Request**: Create a PR targeting the correct branch. Draft a description including a summary, test plan, and rollback strategy.
