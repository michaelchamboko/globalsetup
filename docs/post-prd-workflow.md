# Post-PRD Workflow

GlobalSetup runs once after the PRD is confirmed. It installs planning assets and the execution runtime. The project then moves through two phases without another setup.

## Phase 1: approved build compilation

1. Confirm the PRD, scope, non-goals, assumptions, and acceptance criteria.
2. Use GitNexus to discover the existing architecture, flows, dependencies, and likely blast radius.
3. Define architecture plus data, API, UI, permission, integration, and deployment contracts.
4. Create visible build plans and one module plan per implementation area.
5. Create bounded task cards with dependencies, risk, intended validation location, and measurable completion evidence.
6. Mirror the approved graph into `build-pack/execution-state.json`.
7. Run BuildRunner `validate` and obtain operator approval for the complete plan.

No production implementation occurs before this gate.

## Phase 2: autonomous build loop

BuildRunner repeatedly selects the next dependency-ready task. The agent loads only that task, uses GitNexus context and impact analysis, claims it with `start`, implements the smallest correct change, and records risk-tiered evidence through `verify`.

High-risk tasks require full validation and an independent review. For every task, `complete` runs GitNexus analysis, verifies the index, records a fresh graph receipt, marks the task done, and unlocks dependants. If GitNexus cannot update, completion fails. The agent then immediately selects the next task.

The loop stops only for a material unapproved requirement, missing authority or runtime, unavailable GitNexus, failed required evidence, operator cancellation, or completion of the approved graph.

## Verification without ceremony

- Low risk: focused task validation.
- Medium risk: focused and affected-area validation.
- High risk: focused, affected-area, full-system validation, and independent review.

This is deliberately progressive. An MVP task is not blocked by unrelated full-suite checks, while structural or high-impact work receives stronger evidence.

## Context and task management

Repository JSON is the durable state. Conversation history, role personas, MCP task services, and arbitrary token thresholds are not required. A fresh agent can resume by running BuildRunner `validate` and `next`, then reading the selected task and GitNexus context.

## Delivery

GitHub stores and reviews source. GitHub Actions workflows and hosted runners are prohibited. Hosted applications and external systems are validated in the intended runtime named by each task contract.
