# Integration Contract: [Feature Name]

**Date**: [YYYY-MM-DD]  

## External Services

### [Service Name]

**Purpose**: [Why this service is needed]  
**API Documentation**: [Link]  
**Authentication**: [API key / OAuth / etc.]  

**Endpoints Used**:
| Method | Endpoint | Purpose |
|--------|---------|----------|
| [GET/POST] | [URL] | [What it does] |

**Rate Limits**: [e.g., 100 req/min]  
**Timeout**: [e.g., 5s]  
**Retry Policy**: [e.g., 3 retries with exponential backoff]  

**Failure Handling**:
- If service is down: [fallback behavior]
- If rate limited: [retry strategy]
- If response is invalid: [validation and error handling]

## Internal Integrations

### [Internal System Name]

**Interface**: [API / Event / Shared database / Import]  
**Contract**: [What data is exchanged and in what format]  
**Owner**: [Team or person responsible]
