# Permissions Contract: [Feature Name]

**Date**: [YYYY-MM-DD]  
**Auth System**: [e.g., JWT with role-based access control]  

## Roles

| Role | Description | New? |
|------|------------|------|
| [role] | [What this role can do] | Yes / No |

## Permissions Matrix

| Action | [Role 1] | [Role 2] | [Role 3] | Unauthenticated |
|--------|----------|----------|----------|------------------|
| [Action 1] | âœ… | âœ… | âŒ | âŒ |
| [Action 2] | âœ… | âŒ | âŒ | âŒ |

## Authorization Rules

1. [Rule 1 â€” e.g., Users can only access their own data]
2. [Rule 2 â€” e.g., Admins can access all data]

## Implementation

- Middleware: [Where authorization is checked]
- Guard pattern: [How authorization is enforced]
