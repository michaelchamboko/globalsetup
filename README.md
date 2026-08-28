# GlobalSetup

GlobalSetup turns an approved PRD and repository documents into a model-agnostic, long-horizon build system. It runs once, installs the planning and execution contract, and then lets any capable coding agent execute the approved task graph end to end.

## What setup installs

- a compact `AGENTS.md` routing contract;
- planning rules, skills, templates, reviewers, and safeguards under `.agents/`;
- a machine-readable build pack and durable task state;
- a standard-library Python BuildRunner with PowerShell and Bash wrappers;
- the executable protected-file hook;
- GitNexus plus a local, Git-ignored repository index.

GitNexus is used under the repository's declared noncommercial scope. The committed `.gitnexusrc` keeps indexing from rewriting GlobalSetup's agent instructions.

## One setup, two phases

Phase 1 translates the approved PRD into discovery, architecture, contracts, build plans, module plans, task cards, risk tiers, and validation commands. The operator approves that complete plan.

Phase 2 is an autonomous loop: select one dependency-ready task, inspect GitNexus context and impact, implement, run proportional verification, complete the task, and continue. Completion automatically updates GitNexus and records a fresh graph receipt for every task.

Task state is stored in `build-pack/execution-state.json`, not in conversation history or a proprietary task service. Low-risk MVP tasks run focused checks; medium-risk tasks add affected-area checks; high-risk tasks add full validation and independent review.

## Quickstart

Prerequisites: Git, Python 3.10+, and a GitNexus-supported Node release (currently 22.18+ or 24.11+). npm is needed only when GitNexus is not already installed.

Windows:

```powershell
& C:\path\to\globalsetup\scripts\setup-globalsetup.ps1 -TargetDir C:\path\to\project
```

Linux or macOS:

```bash
bash /path/to/globalsetup/scripts/setup-globalsetup.sh /path/to/project
```

Setup validates the complete UTF-8 payload and prerequisites before touching the target, stages the install, and rolls target changes back if any install step fails. It initializes Git when needed, installs GitNexus when absent, indexes the repository, configures detected agent harnesses, and creates the initial build pack. Re-running it is safe: existing target files are backed up and an existing execution state is preserved. It does not install application dependencies or run the application.

Preview the operation without target or dependency mutation:

```bash
python /path/to/globalsetup/scripts/setup-globalsetup.py --target /path/to/project --dry-run
```

After the agent compiles the approved plans into execution state:

```bash
python scripts/build-runner.py --root . validate
python scripts/build-runner.py --root . next
```

Every successful command returns one JSON envelope with `ok`, `command`, and `result`; contract failures return `ok: false` on stderr. Each task names exact `context_files`. Local commands and hosted receipts are separate evidence types, and all evidence is bound to the verified source fingerprint.

See [the quickstart](docs/quickstart.md), [the workflow](docs/post-prd-workflow.md), and [the architecture](docs/agent-neutral-architecture.md).

## Delivery boundary

GitHub is used for source updates, branches, pull requests, and manual review. GlobalSetup prohibits GitHub Actions workflows and hosted runners; validation runs in the task's declared runtime.

Hosted or external validation runs in the location declared by each task. Local application installs, servers, and production builds are not the default.

## Licence and attribution

GlobalSetup is MIT-licensed. GitNexus remains separately licensed under PolyForm Noncommercial 1.0.0. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
