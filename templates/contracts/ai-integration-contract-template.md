# AI Integration Contract: [Feature Name]

**Date**: [YYYY-MM-DD]
**Feature**: [What this AI feature does]
**Owner**: [Team / Engineer]
**Status**: [Draft | Approved | Implemented]

---

## Model Configuration

| Parameter | Value | Rationale |
|---|---|---|
| **Primary Provider** | [e.g., Anthropic / OpenAI / Google] | [Why this provider] |
| **Primary Model** | [e.g., claude-3-5-sonnet, gpt-4o] | [Why this model] |
| **Fallback Provider** | [e.g., OpenAI] | [Why this fallback] |
| **Fallback Model** | [e.g., gpt-4o-mini] | |
| **Max Input Tokens** | [e.g., 8,000] | [Budget reasoning] |
| **Max Output Tokens** | [e.g., 2,000] | [Budget reasoning] |
| **Temperature** | [e.g., 0.2] | [Lower = more deterministic] |
| **Response Format** | [Streaming SSE / Non-streaming JSON] | |
| **Timeout** | [e.g., 10s non-streaming / 30s streaming] | |

---

## Prompt Design

### System Prompt Location
`prompts/[feature-name]/system-v[N].md`

### User Prompt Template

```
[Describe the user prompt structure — include markers for injection points]

Example:
You are answering based on the following document:

<document>
{{SANITIZED_DOCUMENT_CONTENT}}
</document>

User question: {{SANITIZED_USER_QUESTION}}
```

### Injection Points & Sanitization

| Variable | Source | Sanitization Applied |
|---|---|---|
| `{{SANITIZED_DOCUMENT_CONTENT}}` | [Retrieved from DB] | [HTML strip, length truncation at 6,000 tokens] |
| `{{SANITIZED_USER_QUESTION}}` | [User input] | [HTML strip, prompt injection pattern filter, max 500 chars] |

---

## Output Contract

**Output Format**: [Free text / JSON / Markdown]

**Schema** (if structured output):
```json
{
  "answer": "string",
  "confidence": "high | medium | low",
  "citations": ["string"]
}
```

**Validation**: Output validated with [Zod schema / Pydantic model] before use in business logic.

**Fallback on Invalid Output**: [e.g., Return error to user / Use rule-based fallback / Retry once]

---

## Cost & Quota Controls

| Control | Value |
|---|---|
| **Estimated cost per request** | [e.g., ~$0.002 at current token usage] |
| **Per-user rate limit** | [e.g., 20 requests/minute] |
| **Per-user daily token quota** | [e.g., 500,000 tokens/day] |
| **Monthly budget alert threshold** | [70% and 90% of $X/month] |
| **Caching strategy** | [None / Cache identical prompts for TTL=X minutes] |

---

## Resilience Design

| Concern | Approach |
|---|---|
| **Provider timeout** | Hard timeout: [10s / 30s]. Return fallback response. |
| **Provider rate limit (429)** | Exponential backoff: 100ms, 200ms, 400ms (3 retries max) |
| **Provider outage** | Fallback to [secondary provider / cached response / rule-based response] |
| **Kill switch** | Feature flag: `[team].[feature].enabled` — disables AI call, returns static fallback |
| **Circuit breaker** | Open after [5] consecutive failures for [60 seconds] |

---

## Evaluation Criteria (Evals)

| Eval Type | Count | Passing Threshold | Location |
|---|---|---|---|
| **Unit evals** (fixed input → expected pattern) | [20+] | [100% pass] | `evals/[feature]/unit/` |
| **Regression evals** (representative inputs) | [50+] | [≥ 95% pass] | `evals/[feature]/regression/` |
| **Adversarial evals** (injection, jailbreak, edge cases) | [10+] | [100% blocked/handled] | `evals/[feature]/adversarial/` |

**Eval CI gate**: Evals run on every PR modifying this feature's prompt or pipeline. PR blocks on failure.

---

## Responsible AI Checklist

- [ ] Content moderation on user input (input filtering configured)
- [ ] Content moderation on model output (output filtering configured)
- [ ] AI-generated content labeled in UI
- [ ] User feedback mechanism (thumbs up/down) implemented
- [ ] No PII sent to provider beyond what is disclosed in privacy notice and covered by DPA
- [ ] Bias testing conducted across demographic groups / languages / regions
- [ ] Opt-out of training data use honored (if applicable)

---

## Monitoring Post-Launch

| Metric | Alert Threshold | Dashboard Link |
|---|---|---|
| Error rate | > 1% for 5 minutes | [Link] |
| P99 latency | > [timeout × 0.8] | [Link] |
| Token cost per day | > 120% of baseline | [Link] |
| User thumbs-down rate | > 10% on 50+ responses | [Link] |
