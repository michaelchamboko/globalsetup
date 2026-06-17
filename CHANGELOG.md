# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Comprehensive `security.md` rules covering OWASP Top-10, supply chain, secrets management, auth/session, CSP/headers, and audit logging.
- New `ci.yml` GitHub Actions workflow replacing the broken `hook-tests.yml` — validates setup scripts on Ubuntu, macOS, and Windows, and checks structural integrity of all required files.
- Expanded `.gitignore` to protect build-pack artifacts, backup files, state serialization files, secrets, and IDE artifacts.
- `CHANGELOG.md` (this file) — tracking notable changes in Keep a Changelog format.
- `CODE_OF_CONDUCT.md` — standard Contributor Covenant v2.1 code of conduct.

### Fixed
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
