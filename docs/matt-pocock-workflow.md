# TypeScript workflow

GlobalSetup setup downloads the selected official skills from `mattpocock/skills` into the target repository. It does not invoke or reimplement them.

During the staged transaction, setup runs the official non-interactive installer with `npx skills@latest add mattpocock/skills`, the selected `--skill` arguments, `--agent universal`, `--copy`, and `--yes`. It preserves unrelated custom skills and refuses to replace a differing custom skill with the same name.

After installation, explicitly invoke `setup-matt-pocock-skills` once and confirm its repository-specific configuration. Then follow the six ordered gates in [the installed workflow rule](../rules/matt-pocock-workflow.md):

1. `grill-with-docs`, using `grilling` and `domain-modeling`
2. `to-spec`
3. `to-tickets`
4. `implement`, using `tdd` and its initial `code-review`
5. a separate final `code-review`
6. `retro`, followed by `writing-for-agents`

GlobalSetup's approved documents and `build-pack/execution-state.json` remain authoritative throughout.
