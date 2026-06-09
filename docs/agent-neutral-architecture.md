# Agent-Neutral Architecture

GlobalSetup is designed to work with any capable coding agent. This document explains the architectural decisions that make this possible.

## Why Harness-Neutral?

The software industry has multiple coding agents and harnesses:

- IDE-integrated agents
- CLI-based agents
- Cloud-hosted agents
- Custom agent frameworks

Tying a build system to a specific harness limits adoption and creates vendor lock-in. GlobalSetup avoids this by:

1. Using only plain markdown files for instructions
2. Defining workflows as human-readable processes, not harness-specific commands
3. Using templates that any agent can fill in
4. Defining reviewer profiles as checklists, not tool-specific invocations
5. Expressing safeguards as rules, not executable hooks

## The AGENTS.md Contract

`AGENTS.md` is the single root instruction file. Any agent that can read markdown can follow its instructions. It contains:

- The complete workflow from PRD to ship
- Universal principles
- A directory map pointing to rules, skills, templates, reviewers, and safeguards

## How Different Agents Use GlobalSetup

### Agents with Skill Systems

If your agent supports skills or plugins, the `skills/` directory contains SKILL.md files with YAML frontmatter that many agent systems can parse natively.

### Agents with Rule Systems

If your agent supports rule files, the `rules/` directory contains standalone rule files that can be loaded as behavioral constraints.

### Agents Without Specialized Systems

If your agent is a general-purpose LLM with file access, it can:

1. Read `AGENTS.md` for the overall workflow
2. Read individual skill files for step-by-step processes
3. Read templates and fill them in
4. Read reviewer profiles and apply them as checklists
5. Read safeguard rules and follow them as constraints

## Adapting for Specific Harnesses

If you want to optimize GlobalSetup for a specific agent:

1. Keep the generic files as-is
2. Add a harness-specific wrapper in a separate directory (e.g., `.claude/`, `.cursor/`)
3. The wrapper can reference the generic files and add harness-specific features
4. The generic files remain the source of truth

This approach allows teams using different agents to share the same build system.

## File Format Conventions

- **Rules**: Markdown files. May include YAML frontmatter for metadata.
- **Skills**: `SKILL.md` files in named directories. YAML frontmatter with `name` and `description`.
- **Templates**: Markdown files with placeholders in `[brackets]` or `<!-- TODO -->` comments.
- **Reviewers**: Markdown files with checklists and review criteria.
- **Safeguards**: Markdown files with declarative rules.
