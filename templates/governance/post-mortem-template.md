# Post-Mortem: [Incident Title]

**Date**: [YYYY-MM-DD]  
**Severity**: [P1 / P2 / P3]  
**Duration**: [HH:MM — total time from first alert to full resolution]  
**Author(s)**: [Names]  
**Status**: [Draft | In Review | Final]  

> **Blameless Principle**: This post-mortem is a learning exercise. The goal is to understand what happened and prevent recurrence — not to assign blame. Systems fail; we improve them.

---

## Impact Summary

| Dimension | Details |
|---|---|
| **User Impact** | [e.g., 12% of users unable to complete checkout for 47 minutes] |
| **Revenue Impact** | [e.g., Estimated $X in lost transactions] |
| **Data Loss** | [None / Describe if any] |
| **Services Affected** | [List of services] |
| **Start Time** | [ISO 8601 timestamp — when the incident actually began, not when it was detected] |
| **Detection Time** | [ISO 8601 — when alert fired or team noticed] |
| **Mitigation Time** | [ISO 8601 — when service was restored] |
| **Resolution Time** | [ISO 8601 — when root cause was fixed] |
| **MTTD** (Mean Time to Detect) | [minutes] |
| **MTTR** (Mean Time to Restore) | [minutes] |

---

## Timeline

*All times in UTC.*

| Time (UTC) | Event |
|---|---|
| `HH:MM` | [Earliest signs of issue — e.g., error rate begins rising] |
| `HH:MM` | [Alert fires in PagerDuty] |
| `HH:MM` | [On-call engineer acknowledged] |
| `HH:MM` | [Incident channel opened, IC assigned] |
| `HH:MM` | [Investigation begins — first hypothesis] |
| `HH:MM` | [First hypothesis ruled out] |
| `HH:MM` | [Root cause identified] |
| `HH:MM` | [Mitigation applied — e.g., feature flag disabled, rollback initiated] |
| `HH:MM` | [Service restored — error rate returns to baseline] |
| `HH:MM` | [Incident declared resolved] |
| `HH:MM` | [Status page updated to resolved] |

---

## Root Cause

*Describe the technical root cause clearly and specifically. Avoid vague language like "human error" — describe what the human did and why the system allowed it.*

**Root Cause**: [Specific technical description of what failed and why]

**Example (good)**: "A missing database index on `orders.user_id` caused a sequential scan on the orders table. A spike in traffic at 14:30 UTC resulted in query times exceeding the 10-second application timeout, causing cascading connection pool exhaustion."

**Example (bad)**: "The database was slow."

---

## Contributing Factors

*These are the systemic conditions that made the root cause possible or made the incident worse. These are the most actionable items.*

- [ ] **Monitoring gap**: [e.g., No alert was configured for DB query duration > 1s]
- [ ] **Missing safeguard**: [e.g., The deployment process did not include a query performance check]
- [ ] **Documentation gap**: [e.g., The runbook did not include DB connection pool exhaustion procedures]
- [ ] **Process gap**: [e.g., The code reviewer did not check for missing indexes on the new query]
- [ ] [Add additional contributing factors]

---

## What Went Well

*Be genuinely positive here — acknowledging what worked helps reinforce good practices.*

- [e.g., The on-call engineer acknowledged the alert within 3 minutes]
- [e.g., The feature flag system allowed instant mitigation without a code deploy]
- [e.g., Clear communication kept stakeholders informed throughout]

---

## What Could Be Improved

- [e.g., Detection took 18 minutes — alert threshold was too conservative]
- [e.g., Investigation was slowed by lack of query-level tracing in the APM tool]
- [e.g., Runbook did not exist for this failure mode]

---

## Action Items

| # | Action | Owner | Due Date | Status |
|---|---|---|---|---|
| 1 | [Add DB query duration alert (P95 > 500ms triggers P2)] | [Name] | [YYYY-MM-DD] | Open |
| 2 | [Add missing index on `orders.user_id`] | [Name] | [YYYY-MM-DD] | Open |
| 3 | [Update runbook with DB connection exhaustion procedure] | [Name] | [YYYY-MM-DD] | Open |
| 4 | [Add query performance regression check to PR review checklist] | [Name] | [YYYY-MM-DD] | Open |

*Action items must be concrete and owned. "Improve monitoring" is not an action item. "Add P95 DB query duration alert at 500ms threshold to the production dashboard" is.*

---

## Detection & Alerting Review

| Question | Answer |
|---|---|
| How was the incident detected? | [Alert / Customer report / Internal observation] |
| Was detection automated? | [Yes / No] |
| Was the alert threshold appropriate? | [Yes / Too sensitive / Not sensitive enough] |
| Should a new alert be added? | [Yes — describe it / No] |
| How long between issue start and detection? | [X minutes] |

---

## Communication Review

| Question | Answer |
|---|---|
| Was the status page updated promptly (< 15 min for P1)? | [Yes / No — actual time: X min] |
| Were stakeholders notified appropriately? | [Yes / No] |
| Was the incident channel communication clear? | [Yes / No] |
| Improvements to communication process? | [Describe] |
