# API Contract: [Feature Name]

**Date**: [YYYY-MM-DD]  
**Base Path**: [e.g., /api/v1]  
**Authentication**: [e.g., Bearer JWT]  

## Endpoints

### [METHOD] [path]

**Description**: [What this endpoint does]  
**Auth Required**: Yes / No  
**Roles**: [e.g., user, admin]  

**Request**:
`json
{
  "[field]": "[type â€” string, number, boolean]",
  "[field]": "[type]"
}
`

**Response (200)**:
`json
{
  "data": {
    "[field]": "[type]"
  }
}
`

**Error Responses**:

| Status | Code | Message | When |
|--------|------|---------|------|
| 400 | VALIDATION_ERROR | [message] | [condition] |
| 401 | UNAUTHORIZED | [message] | [condition] |
| 404 | NOT_FOUND | [message] | [condition] |

---

<!-- Copy the endpoint block above for each endpoint -->
