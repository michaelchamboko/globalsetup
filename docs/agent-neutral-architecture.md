# Agent-Neutral Architecture

GlobalSetup separates durable repository state from the model or harness executing it.

## Portable core

- `AGENTS.md` is a short routing contract readable by any coding model.
- `build-pack/execution-state.json` is the lifecycle state; `source-manifest.json`, `requirements.json`, and `grommet-approval.json` bind it to approved product truth.
- `build-pack/capabilities.json` records required tools, GitNexus eligibility, managed-worktree policy, and safe argument arrays.
- `scripts/build-runner.py` uses only the Python standard library and has PowerShell and Bash wrappers.
- Markdown plans, task cards, rules, and reviewers remain human-readable.
- `scripts/pre-tool-hook.ps1` is an executable guard for harnesses that support pre-tool hooks; declarative safeguards remain available to all others.

The runner does not call a model API, require a vendor-specific persona system, or store reasoning transcripts. A capable model needs only file access, command execution, and the ability to follow one bounded task contract.

## One setup, two phases

Setup runs once after the source documents are approved. A fail-fast preflight validates prerequisites, UTF-8 text, local references, and declared GitNexus license eligibility; a staged transaction installs the repository contract, BuildRunner, safety files, index-only GitNexus configuration, and the initial build pack. Phase 1 hashes exact source sections, maps permanent requirement IDs, resolves contradictions, and records a Grommet approval digest. Phase 2 creates one managed worktree at a time, verifies a committed outcome, integrates it, refreshes GitNexus, and completes it.

There is no GitHub runner. GitHub remains source control and manual review only.

## GitNexus adapter

GitNexus is the required derived structural index for an eligible noncommercial workflow. GlobalSetup pins its version, uses only index-only analysis and bounded queries, and does not run GitNexus setup, hooks, skill generation, publication, wiki, or cleanup commands.

The committed `.gitnexusrc` uses index-only mode so GitNexus cannot rewrite the repository's model-agnostic instructions. BuildRunner also rejects `.gitnexus` content as product authority; graph data is limited to dependencies, execution flow, context, and impact. The generated `.gitnexus/` index stays local and ignored by Git.

## Harness adapters

A harness may add its own thin adapter, but it must not replace the JSON state, widen the returned context, weaken the risk gates, or create a second task ledger. The BuildRunner's stable JSON envelope is the adapter boundary. Local commands and hosted receipts remain distinct, and verification, independent review, and graph receipts bind to the exact source fingerprint. If an MCP integration is unavailable, the agent may use the repository-local GitNexus CLI runner. If GitNexus itself is unavailable, execution fails closed.

`scripts/evaluate-portability.py` exercises this contract against Python, TypeScript, and Go-shaped repositories. It proves deterministic contract portability only; it does not claim equal model intelligence or implementation quality.
