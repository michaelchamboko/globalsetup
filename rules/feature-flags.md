---
paths:
  - "**/flags/**"
  - "**/features/**"
  - "**/experiments/**"
  - "**/variants/**"
---

# Feature Flags & Experimentation Rules

Feature flags are the safety net that separates **deploy** from **release**. They enable instant kill switches, controlled rollouts, and rigorous A/B experiments. At Claude's scale, every user-facing feature must launch behind a flag.

---

## 1. The Core Principle — Decouple Deploy from Release

- **Never ship a user-facing feature without a feature flag.**
- Code merges to `main` continuously. Features turn on independently, on a defined schedule.
- This eliminates long-lived feature branches, reduces merge conflicts, and enables instant rollback without a code revert.
- A deploy is a technical event. A release is a product event. They must be independently controllable.

---

## 2. Flag Lifecycle

Every flag must progress through these states — never skip or stall:

```
development → rollout → launched → archived
```

| State | Meaning | Max Duration |
|---|---|---|
| `development` | Flag is off everywhere. Code ships dark. | Until rollout begins |
| `rollout` | Progressively enabled for a growing % of users | Until 100% or killed |
| `launched` | 100% of users. Code is stable. | 2 sprints max |
| `archived` | Flag removed from code and flag service | Within 2 sprints of `launched` |

**Flag debt is technical debt.** A flag that stays in `launched` state indefinitely clutters the codebase and becomes a hidden dependency. Treat flag cleanup as a required task — add it to the task graph alongside every feature build.

---

## 3. Kill Switches — Non-Negotiable for Critical Systems

The following integrations **must always** have a kill switch flag that can be activated instantly:

- Every **AI/LLM API call** (cost overrun or availability incident)
- Every **payment processing flow** (fraud event or provider outage)
- Every **third-party integration** that affects core user flow
- Every **experimental algorithm** replacing an established one
- Any feature that **writes to a new database table or index** in its first 30 days

Kill switches must default to `off` (the safe state). Enabling the flag enables the feature — disabling the flag disables it instantly, with no code change required.

---

## 4. Rollout Strategy

Use a progressive rollout for all user-facing features:

```
1% → 5% → 20% → 50% → 100%
```

Define **metrics gates** between each stage:
- Error rate must not exceed baseline + 0.5%
- P99 latency must not regress beyond budget
- Core business metric (conversion, engagement) must hold within acceptable confidence interval

**Hold at each gate for at least 24 hours** (full day/night traffic cycle) before advancing. Automate gate evaluation using your observability tooling.

---

## 5. Flag Naming Convention

Use a consistent hierarchical naming convention:

```
{team}.{feature}.{variant}

Examples:
  search.semantic-rerank.enabled
  onboarding.new-flow.variant
  payments.stripe-v2.enabled
  ai.streaming-responses.enabled
```

- All lowercase, dot-separated.
- No ambiguous names (`new_feature`, `test_flag`, `temp`).
- The name must communicate exactly what is being toggled without needing to read the code.

---

## 6. A/B Testing Discipline

- Test **one variable at a time**. Testing multiple differences simultaneously makes results uninterpretable.
- Calculate **minimum sample size** before starting the experiment. Use a power analysis tool (e.g., Evan Miller's A/B test calculator) with:
  - Minimum detectable effect: the smallest change worth detecting
  - Statistical power: 80% minimum
  - Significance level: p < 0.05
- Do not peek at results early — checking before statistical significance is reached leads to false conclusions.
- Run experiments for **at least one full business cycle** (typically 2 weeks minimum).
- Document every experiment: hypothesis, metric, expected effect size, start date, end date, result, decision.
- **Ship the winner or ship nothing** — never leave a losing variant running because it was easier.

---

## 7. Flag Implementation Rules

- Feature flag evaluation must be **synchronous and fast** (< 1ms). Never make network calls in flag evaluation on the hot path.
- Use a **dedicated flag service** (LaunchDarkly, Flagsmith, Unleash, GrowthBook, or open-source self-hosted). Never implement flags as database queries in the request path.
- Flags must be **type-safe** — define flag keys as constants/enums, never raw strings in business logic.
- **Never put business logic inside flag conditions.** Flags toggle features, not algorithms.

```typescript
// ✅ Correct — flag controls feature boundary
if (flags.isEnabled('search.semantic-rerank.enabled', context)) {
  return semanticSearch(query);
} else {
  return keywordSearch(query);
}

// ❌ Wrong — business logic inside flag check
if (flags.getValue('search.algorithm') === 'semantic' && user.tier !== 'free') {
  // ...
}
```

---

## 8. Flag Cleanup — Mandatory

- When a flag reaches `launched` state (100% rollout, stable), create a cleanup task card within the same sprint.
- Flag cleanup requires:
  1. Remove all flag evaluation code from the application.
  2. Delete the flag from the flag service.
  3. Remove the flag constant/enum from the codebase.
  4. Update tests (remove conditional branches that tested the flag-off path).
- **Zero tolerance for indefinitely stale flags.** Stale flags are hidden complexity, performance overhead, and a source of production incidents when they are accidentally toggled.
