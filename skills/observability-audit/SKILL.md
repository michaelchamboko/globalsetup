---
name: observability-audit
description: Audit a service for observability gaps — check structured logging, distributed tracing, metrics, alerts, and health checks against the observability.md standards.
argument-hint: [service name or directory to audit]
---

# Observability Audit Skill

Use this skill before launching a new service, or when investigating why an incident was hard to diagnose.

## Phase 1 — Logging Audit

1. **Search for unstructured logging** — find all raw `console.log`, `print()`, or `fmt.Println` calls in the service:
   ```bash
   rg "console\.log|console\.error|console\.warn" src/ --type ts
   ```
   Each occurrence must be replaced with the project's structured logger.

2. **Verify required log fields** are present in every log statement. Check a sample of log output against the schema in `rules/observability.md`. Required: `timestamp`, `level`, `service`, `trace_id`, `request_id`.

3. **Scan for PII/secrets in logs**:
   ```bash
   rg "(password|token|secret|api_key|authorization)" src/ --type ts -i
   ```
   Verify no sensitive values are logged — only keys/field names.

4. **Verify log level discipline**: Confirm `error` level is used only for unexpected failures, not for expected business logic (e.g., "user not found" is `warn` or `info`, not `error`).

## Phase 2 — Distributed Tracing Audit

5. **Check OpenTelemetry instrumentation**: Verify OTel SDK is initialized at the service entry point and that auto-instrumentation is configured for the HTTP server and database client.

6. **Trace propagation check**: Verify that `traceparent` headers are:
   - **Extracted** from all inbound HTTP requests.
   - **Injected** into all outbound HTTP calls and message queue messages.
   ```bash
   rg "traceparent|W3CTraceContextPropagator|propagation" src/ --type ts
   ```

7. **Manual span check**: For any business-critical operation not auto-instrumented (e.g., batch processing, complex background jobs), verify a manual span is created.

## Phase 3 — Metrics Audit

8. **Verify standard metrics are emitted**: Check that the service exposes (or ships via OTel Collector):
   - `http_requests_total` (counter by method, route, status)
   - `http_request_duration_seconds` (histogram)
   - `http_requests_in_flight` (gauge)
   - `errors_total` (counter by type)

9. **Check `/metrics` endpoint** (or equivalent): Does it return valid Prometheus-format metrics? Are there obvious gaps compared to the endpoints the service exposes?

10. **Verify SLO metrics availability**: Can you calculate the service's defined SLIs (availability, latency) from the emitted metrics?

## Phase 4 — Alerting & Dashboard Audit

11. **Alert coverage check**: For every item in the service's `runbook-template.md` alerting table — does a corresponding alert actually exist in the alerting system?

12. **Runbook link check**: Does every alert have a link to the relevant runbook section? Open each link and verify it resolves to actionable content.

13. **Dashboard review**: Open the service dashboard. Verify it shows:
    - Four golden signals: latency, traffic, errors, saturation.
    - Downstream dependency health panel.
    - Deployment markers (so you can correlate deploys to metric changes).

## Phase 5 — Health Check Audit

14. **Test `/health`**: `curl -s https://[service]/health` — should return `200 OK` immediately with no dependency checks.

15. **Test `/ready`**: `curl -s https://[service]/ready` — should return `200 OK` with a JSON body listing dependency statuses. Test behavior when a dependency is unavailable (should return `503`).

## Phase 6 — Findings Report

16. **Document all gaps** in a table: gap description, observability pillar (log/trace/metric/alert), severity (blocking/recommended), and recommended fix.

17. **Create task cards** for all blocking findings before the service goes to production.
