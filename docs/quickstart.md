# Quickstart

## 1. Prepare the target

Place the approved PRD and supporting documents in the target repository. Install Git, Python 3, npm, and a GitNexus-supported Node release.

## 2. Run GlobalSetup once

Windows:

```powershell
.\globalsetup\scripts\setup-globalsetup.ps1 -TargetDir C:\path\to\project
```

Linux or macOS:

```bash
bash globalsetup/scripts/setup-globalsetup.sh /path/to/project
```

The script backs up an existing root agent contract and existing `.agents` sections, then installs the BuildRunner, safety hook, GitNexus configuration, and initial build pack. It installs and indexes GitNexus and configures detected agent harnesses. It does not run application builds.

## 3. Compile the approved plans

Ask the agent to read `AGENTS.md`, run the `prd-to-build-pack` workflow, and fill every applicable build-pack document. The agent must then translate the approved task graph into `build-pack/execution-state.json` with dependencies, risk, source-change intent, and argument-array validation commands.

Run:

```bash
python scripts/build-runner.py --root . validate
```

Planning is complete only after this passes and the operator approves the pack.

## 4. Execute end to end

Start or resume with:

```bash
python scripts/build-runner.py --root . next
```

For each returned task, use GitNexus for context and impact analysis, then use BuildRunner `start`, `verify`, optional high-risk `review`, and `complete`. Completion automatically updates GitNexus and records the receipt. Continue until the approved task graph is done.

## 5. Deliver

Run the pre-ship safeguards and validation required by the task graph. Push source to GitHub and validate hosted systems in their declared runtime. Do not add GitHub Actions workflows or runners.
