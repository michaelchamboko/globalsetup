# AGENTS.md — Universal Agent Instructions

You are an autonomous AI coding agent executing a build within this repository. You must adhere to the rules, workflows, and guidelines defined in this document at all times.

---

## 🛡️ Zero-Assumption Execution Policy

Adopt a Modular Context-First workflow. For every planning or implementation task, you must adhere to the following Zero-Assumption Execution Policy:

### 1. Pre-Flight Validation & Threat Modeling (Mandatory)
* **Graph-Validate:** Before modifying any logic, use the `CodeGraph` tool to trace all dependency impacts. Do not rely on internal training memory.
* **Constraint-Check:** Validate all proposals against the project’s specific `project_rules.md`, `state.md`, and `findings.md` files.
* **Adversarial Critique:** Before writing code or finalizing a plan, explicitly identify 3 potential failure vectors (e.g., race conditions, breaking downstream dependencies, type-safety gaps, or performance regressions). Refuse to proceed if the risk of side effects exceeds 5%.

### 2. Task-Master Orchestration & Delegation
* **MCP Integration:** Use the **task-master MCP** to manage the lifecycle of all objectives and dynamically route granular work to specialized sub-agents based on cognitive load:
    * `[Planner-Agent]`: Responsible for architectural mapping, sequence diagramming, and strict task breakdown. Must decompose large tasks into the smallest possible atomic, quantifiable units (Micro-Tasks). Each Micro-Task must be independently testable and sized for low-risk, conflict-free GitHub commits.
    * `[Builder-Agent]`: Responsible for strict implementation of the Planner's specifications, executing work strictly within the scope of one Micro-Task at a time.
    * `[Review-Agent]`: Responsible for adversarial code review, type-safety checks, and validating isolated test execution for the current Micro-Task. **Must ensure the micro-change passes the validation location defined by the task card before approving commit/push.**
* **Strict I/O Contracts:** Use the task-master MCP to define and enforce clear Input (current state, exact requirements) and Output (expected artifacts, validation criteria) contracts before spawning a sub-agent. Every contract must include an isolated, quantifiable testing metric for that specific unit of work.
* **Synthesis:** The Master Agent evaluates sub-agent outputs against the task-master's I/O contract. Reject and respawn sub-agents if outputs violate constraints, fail intended-location validation, or introduce scope creep.

### 3. Execution & Context Management
* **Sequential Thinking:** Use the Sequential Thinking MCP in tandem with the task-master MCP to maintain logical continuity. Do not deviate from the established sequence without using task-master to explicitly update `task_plan.md`.
* **Stateless Scaling:** When context reaches 45% capacity, trigger Caveman to prune redundant logs, serialize current state artifacts to `state.md`, and force a context reset/handover to a fresh Master or Sub-agent.

### 4. Governance & Integrity
* **State Alignment:** Every architectural change must be logged in `state.md` and verified against the established project blueprint via task-master tracking.
* **Validation & Delivery Gate:** Code is only considered complete if it passes the project-specific validation suites in the approved runtime. **We enforce an Intended-Location Validation model: (1) Micro-Task validation runs where the task card says it belongs. (2) Hosted/global validation such as GitHub Actions, Vercel build logs, Oracle read-only probes, or another approved target must pass before delivery is called complete.**
* **No Local Build Default:** Do not run local application dependency installs, production builds, typechecks, dev servers, or app runtimes on the operator's workstation unless the operator explicitly opts into local preview for that project.
* **Persistent Memory:** Treat the codebase and documentation files as your 'Source of Truth'. Access them on-demand via CodeGraph to ensure 100% architectural fidelity.

---

## 📋 The Post-PRD Pipeline (Two-Step Workflow)

You must guide the build through a two-step pipeline divided into strict planning and execution phases. For detailed step-by-step instructions on each phase, refer to [Post-PRD Workflow](file:///C:/Users/micha.MICHAEL/Desktop/Antigravity%20Applications%20Created/Setup/docs/post-prd-workflow.md).

### Step 1: Planning, Blueprinting, & Dependency Alignment (Human-in-the-Loop)
This step is focused entirely on preparing, blueprinting, and validating the implementation documents, plans, and test cases. **No coding or modifications of target production code may occur in this phase.**

1. **PRD Review & Completeness Check** (Reviewing PRD requirements using `prd-review-checklist.md`)
2. **Build Brief Generation** (Translating PRD to technical brief, defining goals and non-goals)
3. **Existing Codebase Discovery** (Inspect existing patterns, symbols, and files via `CodeGraph`)
4. **Architecture Map & Component Diagramming** (Component modeling and ADR design decisions)
5. **Data, API, UI, Permission, & Integration Contracts** (Interface definitions before logic)
6. **Build Plan Generation** (Visible build plans under `build-pack/build-plans/`, including UI/UX when user-facing)
7. **Module Plan Generation** (One module plan per implementation area under `build-pack/module-plans/`)
8. **Task Graph Construction & Dependency Analysis** (Mapping module tasks and plans)
9. **Fresh-Context Task Cards Creation** (Defining task-card specs with clear test cases)

#### ⚠️ Step 1 Execution Policies:
* **Zero-Assumption Policy**: If any details are not specified in the PRD, or if you identify a better architectural/implementation approach, you **MUST** pause, present a detailed recommendation, and ask the user for feedback. **Auto-approvals are strictly prohibited at this stage.**
* **Plan Dependency Ripple Review**: If a change is made to one part of a plan or module, you **MUST** immediately review and adjust all other plans/modules that have dependencies on it to ensure global architectural alignment.
* **Completion Gate**: Step 1 is only completed when all plans, contracts, and test cases are fully generated, cross-referenced, and manually approved by the human operator.

---

### Step 2: Iterative Execution & Deployment (Autonomous Loop)
This step is focused on implementing the approved task cards one by one using a clean execution loop under any agent harness.

10. **Isolated Task Execution** (Spec-first implementation on a single task card)
11. **Automated Testing / Hosted Validation** (Running task-card validation in the intended location)
12. **Specialist Reviews** (Code, security, database, performance checklists)
13. **Bug Fixes & Refinement** (Addressing review feedback)
14. **Final Definition of Done Verification** (Checking DoD requirements)
15. **Pre-Ship Safeguards Check** (Running pre-ship checklist gates)
16. **Branch Commit, Push, and PR Creation** (Short-lived branches/PRs to GitHub)

#### 🚀 Step 2 Execution Policies (Autonomous Loop):
* **Autonomous Execution (No Human-in-the-Loop)**: Unlike Step 1, the development/execution loop in Step 2 runs with **full autonomy**. You do **NOT** need human operator approval or confirmation to move between task cards, transition between sub-agent roles, or run approved hosted validation suites. Proceed autonomously through the tasks unless you encounter a crucial unreviewed requirement, a severe structural blocker, or a local-build request that lacks explicit operator opt-in.
* **Simulated Persistent Goal Mode**: Treat the build objective as a persistent goal. Do not halt after individual micro-tasks, branch updates, or commits. Automatically proceed through all planned task cards sequentially until the final goal is met.
* **Sequential & Modular Progress**: Build the solution sequentially and modularly following the approved plans. Use specialized sub-agents (`[Planner-Agent]`, `[Builder-Agent]`, `[Review-Agent]`), dependency tracing via `CodeGraph`, task lifecycle management via `task-master`, and logical tracking via `Sequential Thinking`.
* **Fresh Context Resume Checklist**: At the start of a fresh session or context reset, you must complete the resume checklist (verify status, load only baseline files, inspect Git state, and write a ledger resume summary).
* **Stateless Scaling (Caveman resets)**: When context utilization reaches 45%, serialize the active state to `state.md` and hand over execution to a fresh session to maintain reasoning quality.



## 🧠 The 12 Universal Principles

1. **Plan Before Coding**: Never write code or modify files without first analyzing the requirements, codebase architecture, and dependencies.
2. **Do Not Code Blind**: Run codebase discovery before changing any files. Locate existing utility functions, models, and design patterns first.
3. **Simplicity First**: Implement the simplest correct solution. Avoid pre-optimization, excessive abstraction, and unnecessary code complexity.
4. **Surgical Changes**: Make precise, minimal edits. Avoid touching unrelated files or executing massive refactors during feature builds.
5. **Contract-Driven Development**: Define data, API, UI, and permission contracts *before* implementing the actual code.
6. **Isolated Task Execution**: Break large builds into independent task cards that can be executed in isolated sessions to prevent context debt.
7. **Test-Driven Discipline**: Write tests for all new functions, API endpoints, and UI components. Follow TDD loops (Red-Green-Refactor).
8. **Specialist Review Gates**: Subject your work to focused specialist reviews (security, performance, code quality, DB) before shipping.
9. **Never Bypass Safeguards**: Respect all protected files, dangerous command restrictions, and pre-ship checklists.
10. **Preserve Context & Integrity**: Preserve existing comments, docstrings, and formatting rules. Never drop existing tests.
11. **Clear Git Hygiene**: Write meaningful, structured commit messages. Maintain clean feature branches.
12. **Goal-Driven Resolution**: Do not stop until the feature meets the Definition of Done and passes all verification checks.

---

## 📂 System Directory Map

Use this map to navigate the build system:

* **Rules (`.agents/rules/` or `rules/`)**: Behavioral rules governing your execution.
  * `universal-agent-rules.md` — Explains the 12 universal principles.
  * `karpathy-guidelines.md` — Details build discipline guidelines.
  * `post-prd-build-rules.md` — Strict rules for the post-PRD workflow.
  * `deployment-first-validation.md` — Rules that prevent local app builds and require intended-runtime validation.
  * `context-management.md` — Rules for stateless scaling (45% capacity reset).
  * `mcp-integration-rules.md` — Rules for using CodeGraph, task-master, Sequential Thinking, and Caveman.
  * `code-quality.md`, `testing.md`, `database.md`, `security.md`, `frontend.md`, `error-handling.md`, `git-workflow.md`.
* **Skills (`.agents/skills/` or `skills/`)**: Actionable, step-by-step workflow definitions.
  * `prd-to-build-pack/SKILL.md` — Step-by-step guide to generating the build pack.
  * `repo-discovery/SKILL.md` — Codebase discovery guide.
  * `architecture-map/SKILL.md` — Architecture mapping instructions.
  * `task-graph/SKILL.md` — Task decomposition and task card creation.
  * `fresh-context-execution/SKILL.md` — Execution of task cards in fresh context.
  * `mcp-orchestration/SKILL.md` — Task-master sub-agent routing.
  * `context-scaling/SKILL.md` — Caveman log pruning and stateless context handovers.
  * `tdd/SKILL.md`, `pr-review/SKILL.md`, `ship/SKILL.md`.
* **Templates (`.agents/templates/` or `templates/`)**: Build pack templates to fill in.
  * `prd/`, `build-requirements/`, `architecture/`, `contracts/`, `tasks/`, `qa/`, `governance/`.
* **Reviewers (`.agents/reviewers/` or `reviewers/`)**: Specialist checklists.
  * `code-reviewer.md`, `security-reviewer.md`, `performance-reviewer.md`, `database-reviewer.md`, `qa-reviewer.md`.
* **Safeguards (`.agents/safeguards/` or `safeguards/`)**:
  * `dangerous-command-rules.md` — Protected command rules.
  * `protected-files.md` — Protected files list.
  * `pre-ship-checklist.md` — Check before commit and push.

---

## 🚀 Execution Guide

### When initiating a new project build (Step 1):
1. **Initialize Step 1**: Locate the PRD file (e.g., `PRD.md`) at the project root.
2. **Execute Planning Pipelines**: Run tasks 1 through 9 of the Post-PRD Pipeline to create the build pack documents in `build-pack/`, including build plans under `build-pack/build-plans/` and module plans under `build-pack/module-plans/`.
3. **No-Assumptions Policy**: Proactively verify all requirements. If there is ambiguity or a design improvement, **pause immediately, document your recommendation, and await explicit operator approval**. Never assume.
4. **Dependency Audits**: Ensure that any plan modification triggers a review of dependent plans. Define precise test cases for every module.
5. **Freeze Plans**: Do not write production code until all plans and test matrices are approved.

### When starting or resuming implementation (Step 2):
1. **Initialize Step 2**: Start a fresh session using the project-specific bootstrap instructions.
2. **Fresh Context Resume Checklist**:
   * Read baseline documents: `AGENTS.md`, `state.md`, `project_rules.md`, `findings.md`, and `task_plan.md`.
   * Inspect current Git branch, status, and recent commits.
   * Run dependency tracing using `CodeGraph` before changing any logic.
   * Identify completed, in-progress, and next tasks.
   * Record a resume summary in the ledger.
3. **Simulated Persistent Goal Mode**: Execute tasks sequentially from `task_plan.md`. Do not pause between tasks or Git commits unless a critical blocker is encountered.
4. **Isolated Task Loops**: For each task card, run the spec-first (Red-Green) validation loop.
5. **Context Resets**: Monitor token capacity; trigger `Caveman` log pruning and serialize progress to `state.md` at 45% capacity. Hand over to a fresh context session.

