# GlobalSetup Agent Contract

GlobalSetup converts approved documents into a verified, local execution contract. It has two phases: source intake and Grommet approval, then serial execution. Do not create a competing task ledger in Markdown.

## Authority

1. `build-pack/execution-state.json` owns task lifecycle.
2. `source-manifest.json`, `requirements.json`, and `grommet-approval.json` own product traceability and approval.
3. Approved build-pack documents provide product meaning.
4. GitNexus provides derived structural impact only. It cannot create, reinterpret, or resolve requirements.

Run `python scripts/build-runner.py --root . validate` before work. Use `next` to obtain the one allowed task and its `context_files`. Use `impact` after a source change. Use `seal-plan` before recording an approved Grommet digest. Run `--help` for the complete interface.

## Execution

- Exactly one task is active. `start` creates its managed worktree; never work in the operator checkout.
- Build dependency-ready vertical outcomes only. Verify in the task worktree, then `integrate`, and finally `complete`.
- Low risk requires focused evidence; medium adds affected-area evidence; high adds full validation and independent review.
- Risk is measured from blast radius, reversibility, authority, sensitive data, and external impact. Publication, credentials, migrations, and security or privacy work are high risk.
- Initial task context must be complete but no more than 40 percent of the model window. Retrieve specific sections when needed.
- State writes, receipts, and the operation journal are BuildRunner-owned. Never edit statuses, evidence, or locks by hand.

## GitNexus And Release

- GitNexus is pinned and index-only. Do not run its setup, publication, wiki, cleanup, skills, hooks, or document-generation commands.
- If its index is unavailable, source intake and Grommet work may continue; code-impact planning, mutation, verification, integration, and publication stop until recovery and recomputation.
- Publication requires an approved destination, artifact, idempotency identity, allowed commands, health check, and rollback. It may make three materially distinct attempts. A failing candidate can go to preview, never production.
- GitHub is source control and manual review only. GitHub Actions and hosted runners are prohibited.

## Engineering Rules

Use argument arrays with no shell. Preserve unrelated work and credentials. Make focused changes, match local style, and prove each result with declared validation. Stop only for one material, precise blocker.
