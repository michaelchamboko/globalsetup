---
name: incident-response
description: End-to-end production incident response — from initial alert to post-mortem. Supports P1 (critical), P2 (high), and P3 (medium) severity levels.
argument-hint: [incident description] [severity: P1|P2|P3]
---

# Incident Response Skill

A production incident is any event that causes unplanned degradation or outage of a user-facing system. Speed, clear communication, and blameless resolution are the goals.

---

## Phase 1 — Detect & Assess (First 5 minutes)

1. **Acknowledge the alert** in your alerting system (PagerDuty, Opsgenie) to stop escalation.
2. **Assess severity** using this matrix:

| Severity | Condition | Response Time |
|---|---|---|
| **P1 — Critical** | Full service outage, data loss, security breach, payment failure | Immediate — all hands |
| **P2 — High** | Significant degradation (> 25% error rate, major feature broken) | 30 minutes |
| **P3 — Medium** | Minor degradation, single non-critical feature affected | Next business day |

3. **Open a dedicated incident channel**: `#incident-YYYY-MM-DD-<short-desc>` in Slack / Teams.
4. **Assign roles**:
   - **Incident Commander (IC)**: Owns the incident. Coordinates the team. Does NOT debug.
   - **Technical Lead**: Investigates root cause and implements fixes.
   - **Communications Lead**: Updates stakeholders and writes status page updates.
5. **Start an incident document** (use `templates/governance/runbook-template.md` as a base) with: timeline start, initial symptoms, services affected, current status.

---

## Phase 2 — Investigate (Minutes 5–30)

1. **Check dashboards first** — before reading logs or code, look at the four golden signals: latency, traffic, errors, saturation. The signal that spiked first points to the root cause.
2. **Check recent deployments**: `git log --since="2 hours ago"`, recent CI/CD runs, infrastructure changes. The most likely cause is the most recent change.
3. **Check downstream dependencies**: Are any upstream APIs, databases, or third-party services degraded? Check provider status pages.
4. **Narrow the blast radius**:
   - What percentage of users are affected?
   - Is it isolated to a region, a user segment, or a specific API endpoint?
   - What is the exact error? Reproduce it in staging if possible.
5. **Do not guess. Do not try random fixes.** Form a hypothesis, verify it with data, then act.

---

## Phase 3 — Mitigate (As fast as possible)

Mitigation restores service. Root cause resolution happens after.

Choose the fastest path to mitigation:

| Mitigation Action | When to use |
|---|---|
| **Disable feature flag** | Feature flag controls the broken code path |
| **Rollback deployment** | Recent deploy caused the regression |
| **Increase capacity** (scale up/out) | Traffic spike is overwhelming the system |
| **Enable circuit breaker** | Upstream dependency is cascading failures |
| **Route traffic to backup region** | Single-region failure |
| **Disable non-critical features** | Shedding load to protect core flows |

- Prefer **reversible, surgical mitigations** over aggressive changes.
- Every mitigation action must be logged in the incident document with: timestamp, action taken, who took it, result.
- After mitigation: confirm that error rates have returned to baseline in your dashboards before declaring mitigation complete.

---

## Phase 4 — Communicate

### Internal (Incident Channel)
- Post a status update every **10 minutes for P1**, **30 minutes for P2**.
- Update format: `[HH:MM UTC] Status: [Investigating|Mitigating|Resolved] | Affected: [what] | Action: [what we're doing]`

### External (Status Page)
- For P1 incidents affecting users: post a status page update within **15 minutes** of incident start.
- Use plain language — no technical jargon. Focus on user impact and expected resolution time.
- Update the status page at each significant change.
- Post final resolution update with a brief explanation.

### Stakeholder Notification
- Notify your manager and relevant stakeholders for all P1 incidents within 30 minutes.
- For P1 incidents involving data loss or security: notify legal/compliance immediately.
- For P1 incidents involving GDPR-regulated data: the 72-hour regulatory notification clock may be ticking.

---

## Phase 5 — Resolve & Verify

1. **Implement the root cause fix** — this may be a proper fix or a temporary workaround.
2. **Deploy and verify**: confirm metrics return to pre-incident baseline. Watch for 30 minutes after resolution before closing.
3. **Re-enable features** disabled during mitigation.
4. **Close the incident**: declare resolution in the incident channel and update the status page.
5. **Write the incident summary** in the incident document: duration, user impact, root cause, resolution.

---

## Phase 6 — Post-Mortem (Within 48 hours)

1. Schedule a **blameless post-mortem** meeting within 48 hours of incident resolution.
2. Populate `templates/governance/post-mortem-template.md` with the full incident timeline.
3. Identify:
   - **Root cause** (the actual technical fault)
   - **Contributing factors** (process gaps, monitoring failures, alerting gaps, documentation gaps)
   - **What went well**
   - **What could be improved**
4. Define **concrete action items** with owners and due dates — not vague "we should improve monitoring."
5. Track action items to completion. Review open items in the next sprint planning.
6. Share the post-mortem with the broader engineering team. Knowledge sharing prevents recurrence.

---

## Incident Severity Escalation

If the incident worsens during investigation, immediately re-assess severity:
- P3 → P2: More users affected than initially assessed, or fix is not straightforward.
- P2 → P1: Service becomes completely unavailable, data loss confirmed, or security breach suspected.
