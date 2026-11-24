# Matt Pocock TypeScript workflow

GlobalSetup installs the selected official skills from `mattpocock/skills`. Before the first engineering flow in a repository, explicitly invoke `setup-matt-pocock-skills` and confirm its issue tracker and domain-document choices. The installer does not run this prompt-driven configuration skill.

Execute these gates in order:

1. Invoke `grill-with-docs`; use its `grilling` and `domain-modeling` work to sharpen requirements and vocabulary.
2. Invoke `to-spec` and reconcile the result with the approved GlobalSetup sources.
3. Invoke `to-tickets` once to create dependency-ordered vertical slices from the approved specification. Reconcile them with existing BuildRunner task state; do not duplicate approved work or create a competing lifecycle ledger.
4. Invoke `implement`; its implementation loop uses `tdd` and performs its initial `code-review`.
5. After implementation evidence is complete and before integration or release, invoke a separate final `code-review` as the release gate.
6. Invoke `retro`, then use `writing-for-agents` for any approved durable instruction improvements.

The approved documents and `build-pack/execution-state.json` remain authoritative. Skills and external tickets cannot create, reorder, complete, or reinterpret BuildRunner tasks.
