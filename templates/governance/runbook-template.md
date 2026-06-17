# Runbook: [Service Name]

**Version**: 1.0  
**Owner**: [Team Name]  
**Last Updated**: [YYYY-MM-DD]  
**On-Call Rotation**: [Link to PagerDuty / Opsgenie schedule]  

---

## Service Overview

**What it does**: [One paragraph describing what this service does and why it matters]  
**Users affected if down**: [Internal only | External users | % of traffic]  
**SLO**: [e.g., 99.9% availability, P99 latency < 500ms]  
**Error Budget**: [e.g., 43.8 minutes of downtime per month]  

### Dependencies

| Dependency | Type | Impact if unavailable |
|---|---|---|
| [PostgreSQL DB] | Hard | [Service fully down] |
| [Redis Cache] | Soft | [Degraded performance, cache misses] |
| [Stripe API] | Hard | [Payment flow broken] |
| [OpenAI API] | Soft | [AI feature disabled, fallback active] |

---

## Deployment

### How to Deploy

```bash
# Standard deployment (uses CI/CD)
# 1. Merge PR to main
# 2. CI/CD pipeline triggers automatically
# 3. Monitor deployment: [link to CI/CD dashboard]

# Manual deployment (emergency only — document why in the incident)
[deployment command here]
```

### Environment Variables Required

| Variable | Description | Where to find |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | [Vault path / Secret Manager key] |
| `REDIS_URL` | Redis connection string | [Vault path / Secret Manager key] |
| `API_KEY` | [Third-party service] API key | [Vault path / Secret Manager key] |

### Rollback Procedure

```bash
# 1. Identify the last stable release tag
git tag --sort=-creatordate | head -5

# 2. Trigger rollback to previous version
[rollback command — e.g., kubectl set image, vercel rollback, etc.]

# 3. Verify rollback succeeded
curl -s https://[service-url]/ready | jq '.version'

# 4. Monitor error rate for 10 minutes post-rollback
# [Link to dashboard]
```

**Rollback Decision Criteria**: Rollback immediately if:
- Error rate > 5% sustained for > 2 minutes after deploy
- P99 latency > 2x pre-deploy baseline
- Any data integrity issue is detected

---

## Alerting

| Alert Name | Severity | Condition | Action |
|---|---|---|---|
| `HighErrorRate` | P1 | Error rate > 1% for 5 min | See: [High Error Rate](#high-error-rate) |
| `HighLatency` | P2 | P99 > 1s for 10 min | See: [High Latency](#high-latency) |
| `DBConnectionPoolExhausted` | P1 | Pool usage > 95% | See: [DB Connection Issues](#db-connection-issues) |
| `ServiceDown` | P1 | `/health` returning non-200 | See: [Service Down](#service-down) |

---

## Runbook Procedures

### Service Down

**Symptoms**: `/health` returns non-200 or times out. Load balancer health check failing.

```bash
# 1. Check process status
[kubectl get pods -n production | grep service-name]
# or
[systemctl status service-name]

# 2. Check recent logs
[kubectl logs -n production -l app=service-name --tail=100]

# 3. Check resource limits (OOMKilled?)
[kubectl describe pod -n production pod-name]

# 4. Restart if necessary (document why)
[kubectl rollout restart deployment/service-name -n production]
```

**Escalate if**: Restart does not resolve within 5 minutes. Check for dependency failures.

---

### High Error Rate

**Symptoms**: Error rate alert firing. Users reporting failures.

```bash
# 1. Check which endpoint is erroring
# [Link to dashboard filtered to error rate by route]

# 2. Check logs for error patterns
[kubectl logs ... | grep '"level":"error"' | jq '.message' | sort | uniq -c | sort -rn]

# 3. Check if correlated with a recent deploy
git log --since="1 hour ago" --oneline

# 4. Check downstream dependency status
curl -s [dependency-health-url] | jq .
```

**Common causes**:
- Recent deploy introduced a bug → **Rollback**
- Database query timeout → See [DB Connection Issues](#db-connection-issues)
- Upstream API degraded → **Enable circuit breaker / feature flag kill switch**

---

### High Latency

**Symptoms**: P99 latency alert firing. Users experiencing slow responses.

```bash
# 1. Check if traffic spike is the cause
# [Link to traffic dashboard]

# 2. Check database slow query log
# [Database query: SELECT * FROM pg_stat_activity WHERE duration > interval '1 second']

# 3. Check cache hit rate
# [Link to Redis dashboard — look for hit rate drop]

# 4. Check if a specific endpoint is the bottleneck
# [Link to latency-by-route dashboard]
```

**Common causes**:
- DB slow queries → Identify and kill long-running queries, add missing index
- Cache miss storm (cold cache after restart) → Wait for cache to warm, or manually pre-warm
- Traffic spike → Scale horizontally

---

### DB Connection Issues

**Symptoms**: `connection pool exhausted` errors. Service timing out on DB operations.

```bash
# 1. Check current active connections
# SQL: SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

# 2. Check for long-running transactions (blocking connections)
# SQL: SELECT pid, duration, query FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC;

# 3. Kill blocking queries if needed (document which and why)
# SQL: SELECT pg_terminate_backend(pid) WHERE pid = [blocking_pid];

# 4. If pool is exhausted: temporarily scale up replicas to spread connections
```

---

## Known Issues & Workarounds

| Issue | Workaround | Permanent Fix |
|---|---|---|
| [Describe known failure mode] | [Immediate workaround] | [Link to GitHub issue] |

---

## Contacts

| Role | Name | Contact |
|---|---|---|
| Service Owner | [Name] | [Slack handle] |
| On-Call Engineer | [Rotation] | [PagerDuty link] |
| Database Admin | [Name/Team] | [Slack handle] |
| Security | [Name/Team] | [Slack handle] |
