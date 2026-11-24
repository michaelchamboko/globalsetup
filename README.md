# GlobalSetup

GlobalSetup turns an approved PRD and repository documents into a model-agnostic, long-horizon build system. It runs once, installs the planning and execution contract, and then lets any capable coding agent execute the approved task graph end to end.

## What setup installs

- a compact `AGENTS.md` routing contract;
- planning rules, skills, templates, reviewers, and safeguards under `.agents/`;
- a machine-readable build pack and durable task state;
- a dependency-free TypeScript BuildRunner with PowerShell and Bash wrappers;
- the selected official Matt Pocock engineering skills and their ordered workflow rule;
- the executable protected-file hook;
- GitNexus plus a local, Git-ignored repository index.

GitNexus is used under the repository's declared noncommercial scope. The committed `.gitnexusrc` keeps indexing from rewriting GlobalSetup's agent instructions.

## One setup, two phases

Phase 1 translates the approved PRD into discovery, architecture, contracts, build plans, module plans, task cards, risk tiers, and validation commands. The operator approves that complete plan.

Phase 2 is an autonomous loop: select one dependency-ready task, inspect GitNexus context and impact, implement, run proportional verification, complete the task, and continue. Completion automatically updates GitNexus and records a fresh graph receipt for every task.

Task state is stored in `build-pack/execution-state.json`, not in conversation history or a proprietary task service. Low-risk MVP tasks run focused checks; medium-risk tasks add affected-area checks; high-risk tasks add full validation and independent review.

## Quickstart

Prerequisites: Git, Node.js 22.20+ or 24.11+, and npm. The runtime is Node-only even when the target project uses Python, Go, or another language.

Windows:

```powershell
& C:\path\to\globalsetup\scripts\setup-globalsetup.ps1 -TargetDir C:\path\to\project -AcknowledgeGitNexusLicense
```

Linux or macOS:

```bash
bash /path/to/globalsetup/scripts/setup-globalsetup.sh /path/to/project --acknowledge-gitnexus-license
```

Setup validates the complete UTF-8 payload, prerequisites, and declared noncommercial GitNexus eligibility before touching the target. It stages the install, rolls target changes back if any install step fails, pins GitNexus 1.6.10, installs the official Matt Pocock skills without overwriting differing custom skills, indexes only, and creates the initial build pack. It never configures agent harnesses, invokes the prompt-driven skill setup, or lets GitNexus rewrite governance files. Re-running it preserves existing execution state.

Preview the operation without target or dependency mutation:

```bash
node /path/to/globalsetup/scripts/setup-globalsetup.ts --target /path/to/project --dry-run --acknowledge-gitnexus-license
```

After the agent compiles the approved plans into execution state:

```bash
node scripts/build-runner.mts --root . validate
node scripts/build-runner.mts --root . next
```

Every successful command returns one JSON envelope with `ok`, `command`, and `result`; contract failures return `ok: false` on stderr. Each task names exact `context_files`. Local commands and hosted receipts are separate evidence types, and all evidence is bound to the verified source fingerprint.

See [the quickstart](docs/quickstart.md), [the build workflow](docs/post-prd-workflow.md), [the Matt Pocock workflow](docs/matt-pocock-workflow.md), and [the architecture](docs/agent-neutral-architecture.md).

## Delivery boundary

GitHub is used for source updates, branches, pull requests, and manual review. GlobalSetup prohibits GitHub Actions workflows and hosted runners; validation runs in the task's declared runtime.

Hosted or external validation runs in the location declared by each task. Local application installs, servers, and production builds are not the default.

## Licence and attribution

GlobalSetup is MIT-licensed. GitNexus remains separately licensed under PolyForm Noncommercial 1.0.0. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
