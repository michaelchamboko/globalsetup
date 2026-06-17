# Architecture Reviewer Profile

Review changes for design pattern alignment, modular separation, system scalability, resilience, and long-term maintainability. Reference `rules/api-design.md`, `rules/infrastructure.md`, and `rules/observability.md` for specific standards.

## Checklist

### Structure & Boundaries
- [ ] **Modular Separation**: Component and logic boundaries are respected. No circular dependencies between modules.
- [ ] **Pattern Consistency**: New files follow the repository's established structural conventions (MVC, Clean Architecture, Hexagonal, etc.).
- [ ] **Single Responsibility**: Each module, class, and function has one clear responsibility. No "God objects" or bloated files.
- [ ] **Interface Stability**: Public APIs, exported functions, and shared types have clean, stable interfaces. Breaking changes are versioned.
- [ ] **No Premature Abstraction**: Abstractions are justified by current use cases — not anticipated future ones.

### Scalability & Resilience
- [ ] **Stateless Services**: Stateful data is stored in the database or cache — not in application memory (enables horizontal scaling).
- [ ] **Async for Heavy Work**: Operations > 200ms that don't need to return synchronously are queued as background jobs.
- [ ] **Circuit Breakers on External Calls**: Calls to external services implement circuit breaker or bulkhead patterns.
- [ ] **Idempotency**: Mutation operations that can be retried are idempotent (safe to replay without side effects).
- [ ] **Graceful Degradation**: The system has a defined behavior (fallback, partial response, queue) when dependencies are unavailable.

### Data Architecture
- [ ] **Database Schema Backward-Compatible**: Schema changes are compatible with the version of code currently in production (two-phase migration if needed).
- [ ] **Data Ownership Clear**: Each piece of data has a single authoritative source. No dual-write inconsistency risks.
- [ ] **Event Ordering Considered**: If using event queues, at-least-once delivery and out-of-order processing are handled.

### Observability Architecture
- [ ] **Trace Propagation Designed**: The change preserves distributed trace context across all service calls.
- [ ] **Failure Modes Logged**: All error paths produce structured log entries with sufficient context for incident diagnosis.
- [ ] **SLO Impact Assessed**: The change does not introduce latency, error rate, or availability regressions against defined SLOs.

### Security Architecture
- [ ] **Trust Boundaries Defined**: The change correctly identifies what is trusted (internal) vs. untrusted (external/user input).
- [ ] **Principle of Least Privilege**: New services, roles, and integrations have the minimum permissions required.
- [ ] **No New Attack Surface**: New endpoints, ports, or integrations are justified and have appropriate authentication/authorization.
