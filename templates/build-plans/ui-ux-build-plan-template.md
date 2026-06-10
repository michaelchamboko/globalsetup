# 02 - UI/UX Build Plan

## Purpose

Define the user experience before UI implementation starts. This plan expands the UI contract into screen-level workflows, interaction rules, design posture, validation gates, and task ownership.

## Product UX Posture

[Describe the product's UX posture. Examples: operational console, public marketplace, editorial landing experience, creator tool, internal workflow system.]

For operational tools, prefer:

- Dense but organized layouts.
- Clear status and risk language.
- Fast scanning.
- Repeated-workflow efficiency.
- Minimal decoration.

For public websites or landing pages, define:

- Brand signal.
- First-viewport objective.
- Conversion or comprehension path.
- Trust and disclosure requirements.

## Primary User Groups

| User | Need | UI Implication |
| --- | --- | --- |
| [user] | [need] | [implication] |

## Information Architecture

### [Screen / Area 1]

Purpose: [what this screen enables]

Must show:

- [required element]
- [required element]

UX rules:

- [rule]
- [rule]

### [Screen / Area 2]

Purpose: [what this screen enables]

Must show:

- [required element]

UX rules:

- [rule]

## Core Workflows

| Workflow | Entry Point | Success State | Blocked State |
| --- | --- | --- | --- |
| [workflow] | [entry] | [success] | [blocker] |

## Visual System Direction

### Admin / App UI

- Layout density: [compact / moderate / spacious]
- Navigation model: [sidebar / top nav / tabs / command palette]
- Data display: [tables / timelines / cards / split panes]
- State language: [draft, blocked, approved, etc.]
- Color semantics: [success, warning, blocked, neutral]

### Public UI

- Page type(s): [landing, dashboard, profile, tool, etc.]
- Required first-viewport signal: [brand/product/place/person/object]
- Media/assets: [real/generative/none with reason]
- Motion posture: [none / subtle / expressive], with reduced-motion behavior

## Accessibility and Trust Requirements

- Semantic headings.
- Keyboard-accessible controls.
- Visible focus states.
- Error text tied to form fields.
- Sufficient contrast.
- Reduced-motion support.
- No manipulative dark patterns.

## Validation Location

UI/UX validation is deployment-first:

- Source changes: GitHub branch/PR review.
- Hosted app build/render: intended hosting platform such as Vercel.
- Public page visual review: preview/production deployment URL.
- Data-backed flows: approved runtime checks.
- No local app install/build/typecheck unless explicitly approved.

## Task Mapping

| UX Area | Module | Task Cards |
| --- | --- | --- |
| [area] | [Mxx] | [Txx] |

## Open UX Decisions

- [decision]
- [decision]
