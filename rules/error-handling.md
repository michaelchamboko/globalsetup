---
paths:
  - "src/api/**"
  - "src/services/**"
  - "**/controllers/**"
  - "**/routes/**"
  - "**/handlers/**"
---

# Error Handling

- Use typed or custom error classes with error codes, not generic `Error("something went wrong")`.
- Never swallow errors silently. Log or rethrow with added context about what operation failed.
- Handle every rejected promise. No floating (unhandled) async calls.
- HTTP error responses: consistent shape (`{ error: { code, message } }`), correct status codes (400 validation, 401 auth, 404 not found, 500 unexpected).
- Never expose stack traces, internal paths, or raw database errors in production responses.
- Retry transient errors (network timeouts, rate limits) with exponential backoff. Fail fast on validation and auth errors. Don't retry them.
- Include correlation or request IDs in error logs when available.

## Defensive Resiliency & Outbound I/O Bounds

Every instruction interacting with an external resource or outbound I/O boundary must wrap calls within strict resiliency boundaries.

### Outbound I/O Resiliency Guidelines

| Target Operation | Resiliency Pattern | Default Constraint | Fallback Behavior |
| :--- | :--- | :--- | :--- |
| **Outbound I/O / External API** (AI providers, payment gateways, microservices) | Try/Catch/Finally fence + Timeout limits | **Max 10 seconds** timeout (serverless boundary) | Fallback value, cached response, or user-friendly API error |
| **Transient Faults** (Network glitch, rate limits, 503 errors) | Exponential Backoff with Jitter | Initial: 100ms, Factor: 2x, Max retries: 3 | Propagated error object with custom error code |
| **Persistence / DB Operations** | Try/Catch fence + connection pools + transaction rollbacks | Session-level timeouts | Database rollback + friendly UI indicator |

### Resiliency Implementation Checklist

- [ ] **Mandatory Try/Catch/Finally**: Wrap every outbound I/O instruction or external provider integration step (database, microservice, AI provider api) in explicit try/catch/finally code blocks.
- [ ] **10-Second Serverless Timeout Limit**: Ensure all remote HTTP/TCP connections enforce a timeout constraint of 10 seconds or less (aligning with base serverless cloud margins). Never leave connections un-timeout-protected.
- [ ] **Exponential Backoff with Jitter**: When retrying transient errors, use exponential backoff and add a random jitter offset to prevent thundering herd problems on upstream systems.
- [ ] **Robust Error Fallbacks**: When a timeout or hard failure is encountered:
  - *API responses:* Return a clean, standardized error object (e.g. `{ error: { code: 'GATEWAY_TIMEOUT', message: 'The request timed out.' } }`).
  - *UI components:* Display a user-friendly error state or fallback default values rather than crashing the client interface.

