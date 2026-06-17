# Protected Files

The following files and directories are protected and must **NEVER** be modified or committed unless explicitly requested by the user:

## Blocked from Editing / Committing

- **Environment Configs**: .env, .env.production, .env.local
- **Secrets and Keys**: *.pem, *.key, id_rsa, credentials.json
- **Lock Files**: package-lock.json, yarn.lock, pnpm-lock.yaml (should only be updated by the package manager when installing dependencies, never edited manually).
- **Git Config**: .git/config, .gitignore (unless adding project-specific ignore rules).
- **CI/CD Workflows**: .github/workflows/**, .gitlab-ci.yml (unless modifying deployment pipeline for the feature).

## Rules for Protected Files

1. If you need to add an environment variable, add it to `.env.example` or the documentation, never edit `.env` directly.
2. If you need to add a dependency, use the package manager CLI (e.g., `npm install`, `pnpm add`, `yarn add`), never edit `package.json` manually without running installation afterwards.
