# Post-PRD Workflow

GlobalSetup runs once after the PRD is confirmed. It installs planning assets and the execution runtime. The project then moves through two phases without another setup.

## Phase 1: approved build compilation

1. Register the approved PRD, product-truth documents, blueprints, and explicit decisions as source authority.
2. State what GlobalSetup will build, record all source contradictions, resolve them, and complete the mandatory Grommet source-to-build review.
3. Use GitNexus to discover existing architecture, flows, dependencies, and likely blast radius. Graph output is derived evidence and cannot become or override a requirement.
4. Define architecture plus data, API, UI, permission, integration, and deployment contracts.
5. Create visible build plans and one module plan per implementation area.
6. Create bounded task cards with approved `requirement_sources`, dependencies, risk, exact `context_files`, validation kind and location, and measurable completion evidence.
7. Mirror the approved graph into `build-pack/execution-state.json`.
8. Declare automated-publication authority and exact destinations, then run BuildRunner `validate` and obtain operator approval for the complete plan. Authorized publication does not require another confirmation during execution.

No production implementation occurs before this gate.

## Phase 2: autonomous build loop

BuildRunner repeatedly selects the next dependency-ready task. The agent loads exactly the returned `context_files`, uses GitNexus context and impact analysis, claims the task with `start`, implements the smallest correct change, and records risk-tiered evidence through `verify`. Local `command` checks run from declared argument arrays. Hosted or external `receipt` checks are recorded from their declared runtime before verification.

High-risk tasks require full validation and an independent review receipt. Verification, external evidence, review, and graph evidence must match the same source fingerprint. For every task, `complete` runs GitNexus analysis, verifies the index, records a fresh graph receipt, marks the task done, and unlocks dependants. If the source drifted or GitNexus cannot update, completion fails. The agent then immediately selects the next task.

The loop stops only for a material unapproved requirement, missing authority or runtime, unavailable GitNexus, failed required evidence, operator cancellation, or completion of the approved graph.

## Verification without ceremony

- Low risk: focused task validation.
- Medium risk: focused and affected-area validation.
- High risk: focused, affected-area, full-system validation, and independent review.

This is deliberately progressive. An MVP task is not blocked by unrelated full-suite checks, while structural or high-impact work receives stronger evidence.

## Context and task management

Repository JSON is the durable state. Conversation history, role personas, MCP task services, and arbitrary token thresholds are not required. A fresh agent can resume by running BuildRunner `validate` and `next`, reading `result.context_files`, and then requesting only relevant GitNexus context. All BuildRunner commands use the same JSON envelope so different agent harnesses can consume them consistently.

## Delivery

GitHub stores and reviews source. GitHub Actions workflows and hosted runners are prohibited. Hosted applications and external systems are validated in the intended runtime named by each task contract.
