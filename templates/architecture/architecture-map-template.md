# Architecture Map: [Feature Name]

**Date**: [YYYY-MM-DD]  
**Based on**: [Link to codebase discovery document]  

## System Overview

[High-level description of how the new feature fits into the existing architecture]

## Component Diagram

`
[Text-based component diagram showing the new feature's components and their relationships to existing components]

Example:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Client    â”‚â”€â”€â”€â”€â–¶â”‚   API Layer  â”‚â”€â”€â”€â”€â–¶â”‚  Database   â”‚
â”‚  (Browser)  â”‚â—€â”€â”€â”€â”€â”‚  (Express)   â”‚â—€â”€â”€â”€â”€â”‚ (PostgreSQL)â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
        â”‚                  â”‚
        â”‚           â”Œâ”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”
        â”‚           â”‚  New Feature â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶â”‚  Component   â”‚
                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
`

## Data Flow

[Describe how data flows through the system for the new feature]

1. [Step 1: User action]
2. [Step 2: Client sends request]
3. [Step 4: API processes request]
4. [Step 5: Database query]
5. [Step 6: Response returned]

## Integration Points

| Integration Point | Existing Component | New Component | Interface Type |
|------------------|-------------------|---------------|----------------|
| [Point 1] | [Existing] | [New] | [API / Event / Import] |

## New Components

| Component | Responsibility | Location |
|-----------|---------------|----------|
| [Component 1] | [What it does] | [File path] |

## Modified Components

| Component | Change | Reason |
|-----------|--------|--------|
| [Component 1] | [What changes] | [Why] |
