---
name: ship
description: Use when an approved task authorizes staging, committing, pushing, publication, or opening a pull request.
argument-hint: [commit message]
---

Follow this secure process to commit and push changes:

1. **Scan**: Run `git status` and inspect the complete scoped diff.
2. **Verify**: Run the active task's required evidence and repository safeguards.
3. **Stage**: Stage only task-owned files. Never stage secrets or generated output unless the repository contract explicitly requires it.
4. **Commit**: Follow the repository's identity, signing, trailer, and message conventions.
5. **Push or Publish**: Execute automatically when the approved task declares the repository or publication destination. Do not request a second confirmation. Verify the remote ref or publication receipt.
6. **Pull Request**: When required by the repository contract, target the correct branch and report the scoped summary, evidence, and rollback.
