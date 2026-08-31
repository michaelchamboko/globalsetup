# Quickstart

## 1. Prepare the target

Place the approved PRD, product-truth documents, blueprints, and explicit decisions in the target repository. Install Git, Python 3.10+, and a GitNexus-supported Node release. npm is required only when setup must install GitNexus.

## 2. Run GlobalSetup once

Windows:

```powershell
.\globalsetup\scripts\setup-globalsetup.ps1 -TargetDir C:\path\to\project
```

Linux or macOS:

```bash
bash globalsetup/scripts/setup-globalsetup.sh /path/to/project
```

Preview the validated install plan without changing the target or installing GitNexus:

```powershell
.\globalsetup\scripts\setup-globalsetup.ps1 -TargetDir C:\path\to\project -DryRun
```

The script validates its UTF-8 payload and prerequisites before target mutation, stages the complete payload, and rolls target changes back if installation fails. It backs up an existing root agent contract and `.agents` tree, then installs the BuildRunner, safety hook, GitNexus configuration, and initial build pack. Re-running setup preserves an existing execution state. It installs and indexes GitNexus and configures detected agent harnesses. It does not run application builds.

## 3. Compile the approved plans

Ask the agent to read `AGENTS.md` and run the `prd-to-build-pack` workflow. Initial source intake registers approved files, states the build intent, records and resolves contradictions, and completes the mandatory Grommet review. The agent then translates the approved graph into `build-pack/execution-state.json` with per-task `requirement_sources`, dependencies, risk, source-change intent, exact `context_files`, and validations declared as either a local `command` or hosted/external `receipt`.

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

For each returned task, load exactly its approved `requirement_sources` and `context_files`, use GitNexus only for structural context and impact analysis, then use BuildRunner `start`, `verify`, optional high-risk `review`, and `complete`. Record each hosted result first with `record-evidence`; local `command` checks run directly. Verification, external receipts, independent review, and the final GitNexus receipt are bound to the same source fingerprint. Continue until the approved task graph is done.

To verify that this contract remains stack-neutral, run `python scripts/evaluate-portability.py`. It exercises the same lifecycle against small Python, TypeScript, and Go-shaped repositories; it measures contract portability, not model quality.

## 5. Deliver

Run the pre-ship safeguards and validation required by the task graph. Push source to GitHub and validate hosted systems in their declared runtime. Do not add GitHub Actions workflows or runners.
