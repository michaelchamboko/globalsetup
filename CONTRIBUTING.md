# Contributing to GlobalSetup

Thank you for contributing to GlobalSetup! This project aims to be a harness-neutral post-PRD agentic build system that helps developers and coding agents build software with discipline and high quality.

## Guidelines for Contributions

We welcome contributions across all areas of the project:

### 1. Rules (`rules/`)
* Keep rules general and framework-agnostic. Use concrete examples (like React, Go, Python) only to illustrate patterns.
* Avoid referring to specific coding agents or harnesses as first-class targets.
* Ensure each rule focuses on actionable, verifiable standards.

### 2. Skills (`skills/`)
* Skills must represent clear, step-by-step workflows.
* Keep frontmatter clean with only `name` and `description` fields.
* Instructions should be actionable for any LLM or coding agent.

### 3. Templates (`templates/`)
* Templates must be generic and easy to fill in.
* Use clear placeholder tags like `[Feature Name]` or `[TODO]`.

### 4. Reviewers (`reviewers/`)
* Reviewer profiles must be structured as checklist-driven markdown documents.
* Do not assume any automated subagent execution flow; write checklists that any agent or human can execute.

### 5. Safeguards (`safeguards/`)
* Safeguards must remain declarative rules and checklists rather than executable script hooks.

## Process
1. Create a feature branch (`feat/your-improvement`).
2. Make surgical, clean changes.
3. Commit with conventional commit messages.
4. Open a Pull Request with a clear description of your changes and why they are beneficial.
