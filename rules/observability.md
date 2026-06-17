---
alwaysApply: true
---

# Observability Rules

You cannot operate what you cannot observe. Observability is not a nice-to-have — it is the difference between a production incident that takes 3 minutes to resolve and one that takes 3 hours. Apply these rules to every service before it goes to production.

---

## 1. The Three Pillars — Logs, Traces, Metrics

Every service must implement all three:

| Pillar | What it tells you | Tooling |
|---|---|---|
| **Structured Logs** | What happened and when | Winston, Pino, structlog, zap |
| **Distributed Traces** | Where time was spent across services | OpenTelemetry + Jaeger / Datadog APM |
| **Metrics** | Aggregated system health over time | OpenTelemetry + Prometheus / Datadog Metrics |

- Use **OpenTelemetry (OTel)** as the vendor-neutral standard for all three pillars. Never instrument directly against a vendor SDK.
- Export telemetry to your observability backend via an **OTel Collector** — never direct from the application.

---

## 2. Structured Logging Standards

**All log entries must be valid JSON.** Never use unstructured `console.log()` or `print()` in production code.

### Required Fields on Every Log Line

```json
{
  "timestamp": "2026-06-17T18:00:00.000Z",
  "level": "info",
  "service": "api-gateway",
  "version": "1.4.2",
  "environment": "production",
  "trace_id": "abc123def456",
  "span_id": "789ghi",
  "request_id": "req_01HXYZ",
  "user_id": "usr_01HABC",
  "message": "User authentication succeeded"
}
```

### Log Levels — Use Them Correctly

| Level | When to use |
|---|---|
| `error` | Unexpected failures requiring immediate attention — always page on-call |
| `warn` | Degraded operation, recoverable failure, approaching limits |
| `info` | Normal business events (login, payment processed, job completed) |
| `debug` | Developer-facing detail — disabled in production by default |
| `trace` | Extremely verbose; never enabled in production |

### What to Never Log

- Passwords, tokens, API keys, session IDs
- Full credit card numbers or CVVs (log only last 4 digits with masking)
- PII beyond what is strictly necessary for the log's purpose (prefer pseudonymous `user_id` over email)
- Full request/response bodies containing user content unless explicitly needed for debugging a critical incident — and then only with PII stripped

---

## 3. Distributed Tracing

- Instrument every **inbound and outbound network call** with OpenTelemetry spans.
- Propagate **W3C TraceContext headers** (`traceparent`, `tracestate`) across all service boundaries — including outbound HTTP calls, message queue producers/consumers, and gRPC.
- Every span must include:
  - `service.name`, `service.version`
  - HTTP attributes: `http.method`, `http.url`, `http.status_code`
  - Database attributes: `db.system`, `db.statement` (sanitized — no user values), `db.operation`
  - Error attributes: `error.type`, `error.message`, `exception.stacktrace`
- Set **sampling strategy** by environment:
  - Production: 100% for errors and slow requests (> P95 threshold), tail-based 5–10% for healthy traffic
  - Staging: 100% always
- Never sample away errors — every error must produce a complete trace.

---

## 4. Metrics & SLOs

### SLI/SLO Definitions — Write Before You Ship

Define these for every user-facing service:

| SLI (Service Level Indicator) | Example Target SLO |
|---|---|
| **Availability** | % of successful requests | ≥ 99.9% over 30 days |
| **Latency** | % of requests faster than threshold | P99 < 500ms |
| **Error Rate** | % of requests returning 5xx | < 0.1% |
| **Throughput** | Requests per second capacity | Defined per service |

- Publish SLOs in `docs/slos.md` before go-live. Keep them updated.
- Calculate **Error Budget** = `(1 - SLO) × time window`. Stop new feature work when error budget is exhausted.
- Expose a `/metrics` endpoint (Prometheus format) or ship metrics via OTel Collector.

### Required Application Metrics

Every service must emit:
- `http_requests_total{method, route, status_code}` — counter
- `http_request_duration_seconds{method, route}` — histogram (with P50, P95, P99 buckets)
- `http_requests_in_flight` — gauge
- `db_query_duration_seconds{operation, table}` — histogram
- `cache_hits_total` / `cache_misses_total` — counters
- `errors_total{type}` — counter

---

## 5. Alerting Standards

### Alert Severity Tiers

| Tier | Condition | Response Time | Channel |
|---|---|---|---|
| **P1 — Critical** | Service down, data loss, security breach | 5 minutes | PagerDuty + Slack #incidents |
| **P2 — High** | Degraded performance, error rate spike | 30 minutes | PagerDuty (off-hours) + Slack |
| **P3 — Medium** | Approaching limits, non-critical failures | Next business day | Slack #alerts |
| **P4 — Low** | Informational, trends, capacity planning | Weekly review | Dashboard |

### Alert Design Rules

- Every alert must have a **runbook link** in the alert body — on-call engineers must not be left guessing.
- Alerts must be **actionable** — if an on-call engineer cannot take a specific action in response to the alert, it should not page.
- Implement **alert deduplication** and **grouping** to prevent alert storms during cascading failures.
- Test alerts regularly — a silent alert system is worse than no alerting.
- Set **alert thresholds above noise floor** — flapping alerts that resolve themselves train engineers to ignore them.

---

## 6. Dashboards

- Every service must ship with a **dashboard-as-code** definition (Grafana JSON, Datadog monitor YAML, etc.) committed to the repository.
- Dashboard must show the four golden signals: **latency, traffic, errors, saturation**.
- Include a **dependency health panel**: status of all downstream services and databases.
- Dashboards are reviewed and updated as part of every major feature release.

---

## 7. Health Check Endpoints

Every service must expose:

- `GET /health` — **Liveness**: returns `200 OK` if the process is running. No dependency checks.
- `GET /ready` — **Readiness**: returns `200 OK` only if the service can handle traffic (DB connected, cache warmed, migrations applied). Returns `503` otherwise.

```json
// GET /ready — example response
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "cache": "ok",
    "upstream_api": "ok"
  },
  "version": "1.4.2",
  "uptime_seconds": 3600
}
```

Kubernetes liveness probes use `/health`. Readiness probes use `/ready`. Load balancers drain traffic when `/ready` returns non-200.
