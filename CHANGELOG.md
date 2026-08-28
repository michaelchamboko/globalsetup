# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Model-agnostic BuildRunner** — durable JSON task state, dependency-aware selection, risk-tiered verification, source-bound evidence, one active task, and fail-closed GitNexus refresh on every completed task.
- **Mandatory GitNexus integration** — noncommercial licence acknowledgement, repository-local runner commands, initial indexing during setup, and fresh graph evidence at each completion boundary.
- **Repository pre-commit guard** — setup installs a model-agnostic hook that blocks GitHub workflow files and likely secrets from being committed.
- **Transactional cross-platform installer** — a shared Python implementation validates UTF-8 text and local references, stages the payload before target mutation, supports dry-run, preserves existing execution state, and rolls target changes back on failure.
- **Formal execution contracts** — JSON Schemas, exact per-task `context_files`, stable BuildRunner JSON envelopes, distinct local `command` and hosted `receipt` evidence, and source fingerprints covering verification, independent review, and GitNexus receipts.
- **Contract portability evaluation** — deterministic lifecycle checks across Python, TypeScript, and Go-shaped repositories without making model-quality claims.
- **Optional Ponytail skills** — simplicity, review, audit, debt, completion, benchmark, and help workflows remain progressively loadable when requested, but no longer impose automatic planning, resume, review, or shipping gates.
- Comprehensive `security.md` rules covering OWASP Top-10, supply chain, secrets management, auth/session, CSP/headers, and audit logging.
- Expanded `.gitignore` to protect build-pack artifacts, backup files, state serialization files, secrets, and IDE artifacts.
- `CHANGELOG.md` (this file) — tracking notable changes in Keep a Changelog format.
- `CODE_OF_CONDUCT.md` — standard Contributor Covenant v2.1 code of conduct.

### Fixed
- Repaired mojibake and control-character corruption across the installed examples, templates, and skills; the pre-commit hook now rejects regressions and broken local Markdown references.
- Replaced generic language naming mandates with the instruction to mirror the nearest maintained code, formatter, and tests.
- Removed legacy competing planning and mandatory simplicity ceremonies from the execution lifecycle; BuildRunner state is the sole task ledger.
- Removed GitHub Actions workflows and made GitHub source-control-only; workflows and hosted runners are prohibited, and deployment validation belongs to the intended hosting runtime.
- Hardcoded absolute Windows path (`file:///C:/Users/micha.MICHAEL/...`) in `AGENTS.md` replaced with portable relative path `docs/post-prd-workflow.md`.
- Raw BEL control character (`\007`) in `reviewers/frontend-reviewer.md` `aria-label` text — corrected to literal `aria-label`.
- Broken `npm install` rendering in `safeguards/protected-files.md` — reformatted with proper inline code backticks.
- Double-backslash PowerShell path escaping errors in `docs/quickstart.md` — corrected to single backslash.
- Missing `---` horizontal rule separator before "12 Universal Principles" section in `AGENTS.md`.

---

## [1.0.0] — 2026-06-01

### Added
- Initial release of GlobalSetup — harness-neutral, post-PRD agentic build system.
- `AGENTS.md` — Universal agent instruction contract.
- `rules/` — 13 rule files covering universal principles, code quality, security, testing, error handling, frontend, database, git workflow, deployment-first validation, context management, MCP integration, post-PRD build rules, and Karpathy guidelines.
- `skills/` — 16 skill directories: `prd-to-build-pack`, `repo-discovery`, `architecture-map`, `task-graph`, `fresh-context-execution`, `tdd`, `pr-review`, `ship`, `debug-fix`, `refactor`, `implementation-plan`, `mcp-orchestration`, `context-budget`, `context-scaling`, `karpathy-guidelines`, `test-writer`.
- `templates/` — 8 template directories covering PRD, build requirements, architecture, contracts, build plans, tasks, QA, and governance.
- `reviewers/` — 10 specialist reviewer profiles: code, security, performance, database, frontend, architecture, documentation, QA, product requirements, release.
- `safeguards/` — 4 safeguard files: dangerous command rules, destructive change policy, pre-ship checklist, protected files.
- `scripts/` — Cross-platform setup, build-pack generation, and validation scripts (Bash + PowerShell).
- `examples/post-prd-build-pack/` — 17 example build pack documents with build-plans and module-plans directories.
- `docs/` — Overview, quickstart, post-PRD workflow, and adapting-to-projects guides.
- MIT License, CONTRIBUTING.md, THIRD_PARTY_NOTICES.md.

[Unreleased]: https://github.com/michaelchamboko/globalsetup/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/michaelchamboko/globalsetup/releases/tag/v1.0.0
