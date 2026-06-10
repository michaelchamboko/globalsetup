# GlobalSetup

A harness-neutral, post-PRD agentic build system for structured, disciplined software development. 

GlobalSetup provides a robust set of rules, skills, templates, reviewers, and safeguards designed to guide **any capable coding agent** (or human developer) through the transition from a confirmed Product Requirements Document (PRD) to a fully verified, production-ready implementation.

---

## 🚀 The Core Problem it Solves

Traditional AI coding agents often suffer from **Context Debt** and **Architecture Drift**:
* They jump straight to coding from vague prompts, leading to broken APIs and mismatched UI.
* They lack a systematic codebase discovery phase, rewriting existing utils rather than reusing them.
* They struggle with large features, accumulating token/session bloat until they lose the thread.
* They bypass testing, verification, and dedicated code quality reviews before shipping.

**GlobalSetup** solves this by inserting a structured planning and verification pipeline directly between PRD confirmation and the first line of code.

---

## 📋 The Post-PRD Pipeline

Every feature or build pack follows a rigorous 15-step workflow:

```
Confirmed PRD
  ├── 1. PRD Review & Completeness Check
  ├── 2. Build Brief Generation
  ├── 3. Existing Codebase Discovery (Never write code blind)
  ├── 4. Architecture Map & Component Diagramming
  ├── 5. Data, API, UI, Permission, & Integration Contracts
  ├── 6. Module Plan Generation (one plan per implementation module)
  ├── 7. Task Graph Construction & Dependency Analysis
  ├── 8. Fresh-Context Task Cards Creation
  ├── 9. Intended-Location Task Execution
  ├── 10. Automated Testing / Hosted Validation
  ├── 11. Specialist Reviews (Security, Performance, DB, UI)
  ├── 12. Bug Fixes & Refinement
  ├── 13. Final Definition of Done Verification
  ├── 14. Pre-Ship Safeguards Check
  └── 15. Branch Commit, Push, and PR Creation
```

GlobalSetup is deployment-first by default. Agents must not install dependencies or build applications on the operator's workstation unless the operator explicitly opts into local preview. Source changes are committed to GitHub, and build/deploy verification happens in the intended runtime such as Vercel, GitHub Actions, Oracle, Render, or another approved target.

---

## 🛠️ Repository Structure

GlobalSetup is completely modular, flat, and agent-neutral. The universal source of truth is [AGENTS.md](AGENTS.md):

```
globalsetup/
├── AGENTS.md                    # Root agent instructions (universal contract)
├── README.md                    # This file
├── LICENSE                     # MIT License
├── THIRD_PARTY_NOTICES.md       # Attribution to upstream sources (dotclaude, Karpathy)
├── rules/                      # Core behavioral guidelines
│   ├── universal-agent-rules.md # Master 12 principles
│   ├── karpathy-guidelines.md   # Karpathy build discipline
│   ├── post-prd-build-rules.md  # Rules governing the build pack pipeline
│   ├── deployment-first-validation.md # No local app builds; validate in intended runtime
│   ├── code-quality.md          # Clean code, naming conventions, formatting
│   ├── testing.md               # Arrange-Act-Assert, TDD guidelines
│   ├── database.md              # Migration safety, indexing rules
│   ├── frontend.md              # Responsive layout, accessibility rules
│   ├── error-handling.md        # Resilient error propagation patterns
│   └── git-workflow.md          # Branch naming, clean commits, and PR standards
├── skills/                     # Reusable step-by-step workflow definitions
│   ├── prd-to-build-pack/       # Translates confirmed PRDs to build packs
│   ├── repo-discovery/          # Codebase mapping and technology detection
│   ├── architecture-map/        # Component structure mapping
│   ├── task-graph/              # Splitting builds into task graphs
│   ├── fresh-context-execution/ # Isolated task execution guidelines
│   ├── tdd/                     # Red-Green-Refactor execution loops
│   ├── pr-review/               # Structured PR review synthesis
│   └── ship/                    # Safe branch shipping workflow
├── templates/                  # Fill-in-the-blank markdown build templates
│   ├── prd/                     # PRD templates and checklists
│   ├── build-requirements/      # Build briefs, implementation contracts
│   ├── architecture/            # Architecture map, ADRs, discovery reports
│   ├── contracts/               # API, database, UI, and permission contracts
│   ├── tasks/                   # Task graph and individual task card templates
│   └── qa/                      # Test plans, DoD, rollback plans
├── reviewers/                  # Specialist checklists (formerly subagents)
│   ├── code-reviewer.md         # General logic, structure, and test coverage
│   ├── security-reviewer.md     # OWASP top-10, sanitization, access control
│   ├── performance-reviewer.md  # N+1 queries, leaks, render bottlenecks
│   └── database-reviewer.md     # Indexing, schema migrations, lock prevention
├── safeguards/                 # Declarative safety policies and checklists
│   ├── dangerous-command-rules.md # CLI guardrails (e.g., rm, drop table, force push)
│   └── protected-files.md       # Hard-blocked file edits (e.g., lockfiles, env)
└── scripts/                    # Platform scripts to automate workspace setup
    ├── setup-globalsetup.ps1    # PowerShell setup script for Windows
    └── setup-globalsetup.sh     # Bash setup script for Linux/macOS
```

---

## ⚡ Quickstart

Get started with GlobalSetup in 3 steps:

### 1. Copy GlobalSetup Into Your Target Project
Run the setup script from the root of your target project:

**Linux / macOS (Bash):**
```bash
bash /path/to/globalsetup/scripts/setup-globalsetup.sh .
```

**Windows (PowerShell):**
```powershell
& C:\path\to\globalsetup\scripts\setup-globalsetup.ps1 -TargetDir .
```

This creates a local `.agents/` folder containing the rules, skills, templates, reviewers, and safeguards, and copies [AGENTS.md](AGENTS.md) to your root.

This setup step copies planning assets only. It must not install application dependencies, run application builds, or start local application runtimes.

### 2. Put Your Confirmed PRD in Your Project
Place your confirmed PRD at `docs/confirmed-prd.md` (or the project root).

### 3. Let Your Agent Build the Pack
Instruct your agent:
> *"Read [AGENTS.md](file:///path/to/project/AGENTS.md) and execute the `prd-to-build-pack` skill to generate the complete build pack for our confirmed PRD."*

The generated build pack must include module-level plans under `build-pack/module-plans/` before task cards are approved.

---

## 🧠 Design Principles

1. **Harness-Neutral**: Does not use proprietary formatting. Works out-of-the-box with Claude Code, Cursor, Gemini, Codex, OpenCode, Qoder, or any other agentic environment.
2. **Post-PRD Focused**: Engaging only after requirements are fully locked to eliminate scope creep.
3. **Discovery Before Action**: Force codebase inspection before any code modifications.
4. **Contract-Driven**: APIs, Schemas, and UI layouts are agreed upon in markdown contracts *before* code is written.
5. **Module-Planned**: Large systems are first split into module plans, then dependency-ordered task cards.
6. **Fresh-Context Friendly**: Large features are split into task cards small enough to be executed by an agent in a brand-new, clean shell session.
7. **Deployment-First**: Build and deployment validation runs where the application is intended to live, not on the operator's machine by default.

---

## 📜 Credits and Upstream Sources

GlobalSetup is built on top of and inspired by:
* **dotclaude** (MIT): Upstream rules, skills structure, templates, and hook-derived safeguard designs.
* **andrej-karpathy-skills** (MIT): Karpathy-inspired build discipline.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for full attribution.

---

## 📄 License

MIT. See [LICENSE](LICENSE).
