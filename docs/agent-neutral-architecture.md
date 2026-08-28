# Agent-Neutral Architecture

GlobalSetup separates durable repository state from the model or harness executing it.

## Portable core

- `AGENTS.md` is a short routing contract readable by any coding model.
- `build-pack/execution-state.json` is the task lifecycle source of truth and routes exact `context_files`.
- `build-pack/capabilities.json` records required tools and safe argument arrays.
- `scripts/build-runner.py` uses only the Python standard library and has PowerShell and Bash wrappers.
- Markdown plans, task cards, rules, and reviewers remain human-readable.
- `scripts/pre-tool-hook.ps1` is an executable guard for harnesses that support pre-tool hooks; declarative safeguards remain available to all others.

The runner does not call a model API, require a vendor-specific persona system, or store reasoning transcripts. A capable model needs only file access, command execution, and the ability to follow one bounded task contract.

## One setup, two phases

Setup runs once after the PRD is approved. A fail-fast preflight validates prerequisites, UTF-8 text, and local references; a staged transaction installs the repository contract, BuildRunner, safety files, GitNexus configuration, and the initial build pack. Target mutations roll back on failure, and re-running setup preserves durable execution state. Phase 1 compiles approved documents into the task graph. Phase 2 repeatedly selects, executes, verifies, and completes tasks; completion performs and records the GitNexus update.

There is no GitHub runner. GitHub remains source control and manual review only.

## GitNexus adapter

GitNexus is the required code-intelligence layer for this noncommercial workflow. The CLI gives every harness the same status and re-index commands; MCP-aware harnesses also receive graph query, context, flow, and impact tools after `gitnexus setup`.

The committed `.gitnexusrc` uses index-only mode so GitNexus cannot rewrite the repository's model-agnostic instructions. The generated `.gitnexus/` index stays local and ignored by Git.

## Harness adapters

A harness may add its own thin adapter, but it must not replace the JSON state, widen the returned context, weaken the risk gates, or create a second task ledger. The BuildRunner's stable JSON envelope is the adapter boundary. Local commands and hosted receipts remain distinct, and verification, independent review, and graph receipts bind to the exact source fingerprint. If an MCP integration is unavailable, the agent may use the repository-local GitNexus CLI runner. If GitNexus itself is unavailable, execution fails closed.

`scripts/evaluate-portability.py` exercises this contract against Python, TypeScript, and Go-shaped repositories. It proves deterministic contract portability only; it does not claim equal model intelligence or implementation quality.
