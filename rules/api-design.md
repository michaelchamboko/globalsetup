---
alwaysApply: true
---

# API Design Rules

APIs are the contracts between systems. A poorly designed API becomes a permanent liability — every consumer builds on top of it and every breaking change causes cascading failures. Design your APIs as if they will be public and permanent, even if they start internal.

---

## 1. REST Design Principles

### Resource Naming

- Use **nouns, not verbs** for resource paths. HTTP methods are the verbs.
  - ✅ `GET /users/{id}` — fetches a user
  - ❌ `GET /getUser?id=123` — verb in path
- Use **plural nouns** for collections: `/users`, `/orders`, `/messages`.
- Use **kebab-case** for multi-word resources: `/user-preferences`, not `/userPreferences` or `/user_preferences`.
- Nest resources to express ownership, but **no more than 2 levels deep**:
  - ✅ `GET /users/{userId}/orders`
  - ❌ `GET /users/{userId}/orders/{orderId}/items/{itemId}/reviews`

### HTTP Method Semantics

| Method | Use for | Idempotent | Safe |
|---|---|---|---|
| `GET` | Read resource(s) | ✅ | ✅ |
| `POST` | Create resource or trigger action | ❌ | ❌ |
| `PUT` | Replace resource entirely | ✅ | ❌ |
| `PATCH` | Partial update | ✅* | ❌ |
| `DELETE` | Remove resource | ✅ | ❌ |

*PATCH should be idempotent in practice — applying the same patch twice should produce the same result.

### Response Shapes

Use consistent, predictable response envelopes:

```json
// Success (single resource)
{ "data": { "id": "usr_01", "name": "Alice" } }

// Success (collection)
{
  "data": [...],
  "meta": { "total": 150, "page": 1, "per_page": 20 },
  "links": { "next": "/users?cursor=abc123", "prev": null }
}

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

Never return raw arrays at the top level — wrapping in `{ "data": [] }` allows adding metadata later without breaking clients.

---

## 2. API Versioning

- Choose **one versioning strategy** per API and apply it consistently:
  - **URI versioning**: `/v1/users` (recommended for most REST APIs — explicit and cacheable)
  - **Header versioning**: `API-Version: 2024-01-01` (preferred for APIs with many minor versions)
- Never make breaking changes without a version increment.
- Maintain **at least 2 major versions** simultaneously during deprecation windows.
- Send `Deprecation` and `Sunset` headers on deprecated endpoints:
  ```
  Deprecation: true
  Sunset: Sat, 31 Dec 2026 00:00:00 GMT
  Link: <https://api.example.com/v2/users>; rel="successor-version"
  ```

---

## 3. Pagination

| Strategy | Use when | Implementation |
|---|---|---|
| **Cursor-based** | Large, frequently-updated datasets | `?cursor=<opaque_token>&limit=20` |
| **Offset-based** | Small, stable datasets; admin UIs | `?page=2&per_page=20` |
| **Keyset** | Time-series, sorted by indexed field | `?after_id=usr_01XYZ&limit=20` |

- **Default to cursor-based** for any dataset > 1000 records or with real-time updates.
- Always include `meta.total` (or `meta.has_more` for cursor) and navigation `links`.
- Cap `limit` server-side — never allow `?limit=999999`. Recommended maximum: 100 items per page.

---

## 4. Filtering, Sorting, and Field Selection

```
# Filtering
GET /users?status=active&role=admin&created_after=2026-01-01

# Sorting
GET /users?sort=created_at&order=desc

# Sparse fieldsets (reduces payload size)
GET /users?fields=id,name,email
```

- Validate all filter parameters against an explicit allowlist — never pass user-supplied field names to raw database queries.
- Document all supported filter operators in the OpenAPI spec.

---

## 5. Idempotency

- All `POST` endpoints that **create resources or trigger actions** must accept an `Idempotency-Key` header.
- Store idempotency keys server-side for at least **24 hours**. Return the original response for duplicate keys.
- This is **non-negotiable** for payment flows, order creation, and any action with real-world side effects.

```
POST /payments
Idempotency-Key: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## 6. Error Design

- Use **machine-readable error codes** alongside human-readable messages:
  ```json
  {
    "error": {
      "code": "USER_NOT_FOUND",
      "message": "No user exists with the provided ID.",
      "request_id": "req_01HXYZ",
      "docs_url": "https://docs.example.com/errors/USER_NOT_FOUND"
    }
  }
  ```
- HTTP status codes must be semantically correct:
  - `400` — Client sent bad data (validation failure)
  - `401` — Not authenticated
  - `403` — Authenticated but not authorized
  - `404` — Resource not found
  - `409` — Conflict (duplicate, stale update)
  - `422` — Semantically invalid request
  - `429` — Rate limited
  - `500` — Unexpected server error (never expose internals)
  - `503` — Service temporarily unavailable (use for graceful degradation)

---

## 7. GraphQL-Specific Rules

- **Query depth limit**: enforce a maximum query depth of 5 levels to prevent deeply nested abuse.
- **Query complexity scoring**: assign complexity points to fields and reject queries exceeding a threshold.
- **DataLoader for every relationship**: never resolve related entities in a loop — always batch with DataLoader to prevent N+1 queries.
- **Persisted queries**: in production, prefer persisted query IDs over arbitrary query strings to prevent injection and enable caching.
- **Disable introspection in production** unless explicitly required (exposes schema to attackers).
- **Field-level authorization**: check permissions per field, not just per resolver.

---

## 8. API-First Development

- Write the **OpenAPI (REST)** or **GraphQL Schema** specification *before* implementing the server or client.
- Use the spec as the single source of truth — generate server stubs and client SDKs from it.
- Validate all API requests and responses against the spec in CI (use `@stoplight/spectral` or `dredd`).
- Version-control the OpenAPI spec alongside the code. Breaking changes to the spec require a version bump.

---

## 9. Rate Limiting

- Every public-facing API endpoint must have rate limiting configured.
- Return `429 Too Many Requests` with `Retry-After` and `X-RateLimit-*` headers:
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 42
  X-RateLimit-Reset: 1718640000
  Retry-After: 60
  ```
- Apply rate limits per **user + endpoint** (not just per IP, which is bypassable).
- Use a sliding window algorithm (not fixed window) to prevent burst gaming at window resets.

---

## 10. WebSocket & SSE Patterns

- Use **Server-Sent Events (SSE)** for server-to-client streaming where bidirectional communication is not needed (simpler, HTTP/2-friendly).
- Use **WebSockets** only when bidirectional real-time communication is required.
- Implement heartbeat/ping-pong for WebSocket connections to detect dead connections.
- Always authenticate WebSocket upgrade requests before the connection is established.
- Implement reconnection logic on the client with exponential backoff.
- Define and document the message schema for all WebSocket message types.
