# Observability Reviewer Profile

Review changes for structured logging compliance, distributed trace instrumentation, metrics emission, alert coverage, and health check implementation.

## Checklist

### Structured Logging
- [ ] **No `console.log` in Production**: All logging uses the project's structured logger (Winston, Pino, structlog, etc.) — never raw `console.log` or `print`.
- [ ] **Required Fields Present**: Every log line includes `timestamp`, `level`, `service`, `trace_id`, `request_id`. No missing required fields.
- [ ] **No Secrets Logged**: Passwords, tokens, API keys, session IDs, and PII are not present in log output.
- [ ] **Correct Log Levels**: `error` for unexpected failures, `warn` for degraded operation, `info` for business events, `debug` disabled in production.
- [ ] **Error Logs Include Context**: Error log entries include enough context to understand what operation failed, not just the error message.

### Distributed Tracing
- [ ] **All Network Calls Instrumented**: Every inbound HTTP/gRPC call and outbound API call creates an OpenTelemetry span.
- [ ] **Trace Context Propagated**: W3C `traceparent` headers are forwarded on all outbound HTTP calls and message queue messages.
- [ ] **Required Span Attributes Present**: Spans include `http.method`, `http.url`, `http.status_code` (HTTP) or `db.system`, `db.statement`, `db.operation` (database).
- [ ] **Error Spans Marked**: Failed spans have `error.type` and `exception.stacktrace` attributes. Error status is set via `span.setStatus(SpanStatusCode.ERROR)`.

### Metrics
- [ ] **Standard Metrics Emitted**: Service emits `http_requests_total`, `http_request_duration_seconds`, `http_requests_in_flight`, `errors_total`.
- [ ] **Business Metrics Defined**: Key business events (e.g., signups, payments, AI completions) are tracked as metrics or counters.
- [ ] **SLO Metrics Available**: Metrics required to calculate the service's defined SLIs are being emitted.

### Alerting & Dashboards
- [ ] **Runbook Linked**: Every alert has a runbook URL in the alert body.
- [ ] **Dashboard Updated**: The service dashboard reflects new metrics or changed behavior introduced by this change.
- [ ] **Alert Thresholds Appropriate**: New or modified alerts fire at meaningful thresholds (not too sensitive, not too loose).

### Health Checks
- [ ] **`/health` Endpoint**: Returns `200 OK` if the process is alive. No dependency checks.
- [ ] **`/ready` Endpoint**: Returns `200 OK` only when the service is ready to handle traffic (dependencies connected, migrations applied). Returns `503` otherwise.
- [ ] **`/ready` Response Includes Dependency Status**: The readiness response body lists the health of each dependency.
