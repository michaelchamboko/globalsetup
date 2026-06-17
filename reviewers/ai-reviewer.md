# AI Integration Reviewer Profile

Review all changes that introduce or modify LLM/AI integrations, prompt logic, AI pipelines, or AI-powered features.

## Checklist

### Prompt Safety
- [ ] **No Raw Input Injection**: User-supplied content is sanitized and injected via structured templates with clear delimiters — never string concatenated directly into system prompts.
- [ ] **Prompt Injection Defense**: The system prompt explicitly instructs the model to ignore user attempts to override instructions.
- [ ] **Prompt Registry**: Prompts are versioned in a `prompts/` directory or registry — not inline strings in business logic.

### Cost & Token Management
- [ ] **Token Budget Defined**: Every prompt has a defined `max_input_tokens` + `max_output_tokens` that fits within the model's context window.
- [ ] **Cost Attribution**: Token usage is logged per request (`prompt_tokens`, `completion_tokens`, `total_tokens`, estimated cost).
- [ ] **Per-User Quota**: User or tenant-level token quotas are enforced server-side.
- [ ] **Model Tiering**: Simple tasks use cheaper models. Expensive models are reserved for tasks that require them.
- [ ] **Response Caching**: Deterministic prompts with static inputs are cached with an explicit TTL.

### Output Validation
- [ ] **Schema Validation**: Structured LLM outputs are validated against a schema (Zod, Pydantic, JSON Schema) before use.
- [ ] **No Raw Output in Critical Paths**: LLM output is never passed directly to DB queries, shell commands, or HTML rendering without validation/sanitization.
- [ ] **Eval Suite Exists**: A documented eval suite (unit evals, regression evals, adversarial evals) exists for this feature.

### Resilience
- [ ] **Timeout Enforced**: Hard timeout of ≤ 30s for streaming, ≤ 10s for non-streaming requests.
- [ ] **Retry with Backoff**: Transient errors (rate limits, 5xx) use exponential backoff with jitter (max 3 retries).
- [ ] **Fallback Defined**: A provider fallback chain or graceful degradation path exists for when the primary LLM provider fails.
- [ ] **Circuit Breaker**: A circuit breaker or kill switch flag wraps the AI integration.

### Streaming
- [ ] **State Machine**: The UI streaming state (idle → streaming → complete | error) is explicitly managed.
- [ ] **Cancel Support**: Users can abort a running LLM request via `AbortController` or equivalent.
- [ ] **Partial Failure Handling**: If the stream drops mid-response, the UI shows what was received and offers a retry.

### Responsible AI
- [ ] **Content Moderation**: Input and output moderation layers are present for user-facing features.
- [ ] **AI Disclosure**: Generated content is clearly labeled as AI-generated in the UI.
- [ ] **Feedback Mechanism**: Users can provide thumbs up/down feedback on AI outputs.
- [ ] **No PII in Prompts**: PII is not sent to external LLM providers beyond what is consented and documented in the privacy notice.
