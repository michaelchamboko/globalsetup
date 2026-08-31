# Quickstart

## 1. Prepare the target

Place the approved PRD, product-truth documents, blueprints, and explicit decisions in the target repository. Install Git, Python 3.10+, and a GitNexus-supported Node release. npm is required only when setup must install GitNexus.

## 2. Run GlobalSetup once

Windows:

```powershell
.\globalsetup\scripts\setup-globalsetup.ps1 -TargetDir C:\path\to\project -AcknowledgeGitNexusLicense
```

Linux or macOS:

```bash
bash globalsetup/scripts/setup-globalsetup.sh /path/to/project --acknowledge-gitnexus-license
```

Preview the validated install plan without changing the target or installing GitNexus:

```powershell
.\globalsetup\scripts\setup-globalsetup.ps1 -TargetDir C:\path\to\project -DryRun -AcknowledgeGitNexusLicense
```

The script validates its UTF-8 payload, prerequisites, and GitNexus eligibility before target mutation, stages the complete payload, and rolls target changes back if installation fails. It installs a pinned, index-only GitNexus configuration and never configures agent harnesses. It does not run application builds.

## 3. Compile the approved plans

Ask the agent to read `AGENTS.md` and run the `prd-to-build-pack` workflow. Initial source intake registers approved file sections and hashes in `source-manifest.json`, maps permanent requirements in `requirements.json`, records contradictions, and seals the mandatory Grommet digest. The agent then creates `execution-state.json` with requirement IDs, dependencies, measured risk, model route, context-packet budget, exact `context_files`, and validations.

Declare publication authority once in `automation_authority.publication`: enable or disable it and list exact destinations. After build-pack approval, publication tasks targeting those destinations proceed automatically and record their receipts. Undeclared destinations fail closed.

Run:

```bash
python scripts/build-runner.py --root . validate
```

Planning is complete only after this passes and the operator approves the pack.

BuildRunner emits a stable JSON envelope. Read task data from `result`, for example `{"ok":true,"command":"next","result":{...}}`.

## 4. Execute end to end

Start or resume with:

```bash
python scripts/build-runner.py --root . next
```

For each returned task, load its mapped requirement sections and exact `context_files`, use GitNexus only for structural context and impact analysis, then use BuildRunner `start`, `verify`, `integrate`, optional high-risk `review`, and `complete`. The runner creates an isolated task worktree and records immutable receipts. Publication tasks use `publish` only after integration and run no more than three approved, idempotent attempts.

To verify that this contract remains stack-neutral, run `python scripts/evaluate-portability.py`. It exercises the same lifecycle against small Python, TypeScript, and Go-shaped repositories; it measures contract portability, not model quality.

## 5. Deliver

Run the pre-ship safeguards and validation required by the task graph. Push source to GitHub and validate hosted systems in their declared runtime. Do not add GitHub Actions workflows or runners.
