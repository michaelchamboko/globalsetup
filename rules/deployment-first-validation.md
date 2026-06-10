---
alwaysApply: true
---

# Deployment-First Validation Rules

GlobalSetup must build toward the intended runtime, not the operator's workstation.

## Non-Negotiable Default

Agents must not run local application dependency installs, local production builds, local dev servers, or local full-project typechecks on the operator's machine unless the operator explicitly opts into local preview for that project.

Examples of prohibited local defaults:

- `npm install`, `npm ci`, `pnpm install`, `yarn install`
- `npm run build`, `pnpm build`, `yarn build`
- `npm run dev`, `next dev`, `vite --host`
- Full local project typecheck commands for hosted apps when the approved build target is Vercel/GitHub Actions

## Intended-Location Rule

Task cards must declare where validation runs:

- `github`: source checks, PR checks, repository policies
- `vercel`: install/build/deploy logs for Vercel-hosted applications
- `oracle`: Oracle database, Hermes, and worker checks
- `render`, `supabase`, `neon`, or another explicitly approved runtime
- `local-docs-only`: markdown/template validation that does not install dependencies or build an app

## Allowed Local Work

Without extra approval, agents may still:

- Read, search, and patch source files.
- Run git status/diff/log/fetch/add/commit/push as needed.
- Run markdown/template validation scripts that do not install dependencies or build the application.
- Run static searches such as `rg`.
- Update plans, task cards, contracts, and deployment documentation.

## Explicit Opt-In Exception

If local preview is needed, the task card and operator approval must state:

- Why local preview is required.
- Which commands will run.
- Expected CPU/RAM/disk impact.
- How local artifacts will be ignored or removed.

No agent may infer this opt-in from ordinary Step 2 approval.
