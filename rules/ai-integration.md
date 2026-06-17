---
alwaysApply: true
---

# AI / LLM Integration Rules

Building AI-powered features is fundamentally different from traditional software. LLMs are non-deterministic, expensive, and can produce harmful or incorrect outputs. These rules apply to every component that interacts with an AI model.

---

## 1. Prompt Engineering Discipline

- Treat prompts as **first-class code artifacts** — version-control them, review them, test them.
- Always separate the **system prompt** (instructions/persona), **user prompt** (dynamic input), and **assistant turn** (examples or continuations) clearly. Never mix roles.
- **Never concatenate raw user input directly into a system prompt.** Use a structured template with clearly delimited injection points.
- Validate and sanitize user-supplied content before it enters any prompt. Apply the same rules as SQL injection prevention.
- Detect and block **prompt injection attacks**: attempts by user input to override system instructions (e.g., "Ignore all previous instructions and...").
- Store prompts in a **prompt registry** (e.g., a `prompts/` directory or database table) with name, version, description, and last-modified fields.

```
// ✅ Safe: structured injection with clear delimiters
const prompt = `
You are a helpful assistant. Answer only based on the context below.

<context>
${sanitize(retrievedContext)}
</context>

User question: ${sanitize(userQuestion)}
`;

// ❌ Unsafe: raw concatenation
const prompt = systemPrompt + userInput;
```

---

## 2. Streaming Response Handling

- Use **Server-Sent Events (SSE)** or **WebSocket streaming** for responses > 1 second to avoid user-perceived latency.
- Implement a streaming state machine: `idle → streaming → complete | error`. Never leave the UI in an ambiguous state.
- Buffer incomplete tokens before rendering — never display partial Unicode characters or broken markdown.
- Implement a **stop/cancel** mechanism: users must be able to abort a running LLM request. Use `AbortController` on the client and propagate cancellation to the provider API.
- Handle partial stream failures gracefully: if a stream drops mid-response, show what was received and offer a retry — don't show nothing.

---

## 3. Token Budget Management

- Define a **token budget** for every prompt: `max_input_tokens + max_output_tokens ≤ model_context_limit`.
- Never allow user-supplied content to consume more than **60%** of the context window without truncation logic.
- Implement a **context window management strategy**:
  - **Sliding window**: drop oldest messages when context exceeds budget.
  - **Summarization**: compress earlier turns into a summary before appending new turns.
  - **RAG (Retrieval-Augmented Generation)**: retrieve only the most semantically relevant chunks.
- Always log `prompt_tokens`, `completion_tokens`, and `total_tokens` per request for cost attribution.

---

## 4. Cost Control & Budget Enforcement

- Set **per-user and per-tenant token quotas** enforced server-side (never client-side).
- Implement a **cost-tracking middleware** that logs estimated cost per request: `tokens × $/token`.
- Configure **budget alerts** at 70% and 90% of monthly LLM spend — never discover overruns at billing time.
- Use **model tiering**: route simple/classification tasks to cheaper models (e.g., GPT-4o-mini, Claude Haiku) and reserve expensive models for tasks that require it.
- Cache LLM responses for **identical, deterministic inputs** (e.g., static prompt + static input = cacheable for TTL of minutes to hours). Use a hash of the full prompt as the cache key.
- Rate-limit LLM API calls per user: `N requests/minute` with exponential backoff and a graceful degradation fallback.

---

## 5. AI Output Validation — Never Trust Raw Output

- **Never pass raw LLM output directly into:**
  - Database queries or ORM calls
  - Shell command execution
  - HTML rendering without sanitization
  - Financial calculations or any arithmetic
  - Security decisions (authorization, access control)
- Validate structured outputs against a schema (JSON Schema, Zod, Pydantic) before use.
- For code generation outputs: execute in a **sandboxed environment** — never `eval()` or `exec()` raw LLM-generated code in a production process.
- Implement **output confidence thresholds**: if the model signals uncertainty (or if you detect high perplexity), fall back to a rule-based path or surface the uncertainty to the user.

---

## 6. Evaluation (Evals) Framework — Ship No AI Feature Without It

- Every AI feature must have a **documented eval suite** before shipping to production.
- Eval types required:
  - **Unit evals**: fixed input → expected output patterns (regex, exact match, or LLM-as-judge).
  - **Regression evals**: run against golden dataset of 50+ real production examples before every release.
  - **Adversarial evals**: red-team prompts — jailbreaks, injections, edge cases, competitor mentions.
- Evals run in CI on every PR that modifies a prompt or AI pipeline.
- Track **eval scores over time** as metrics — set a minimum passing score (e.g., ≥ 95% accuracy on golden set).
- Use **LLM-as-a-judge** for open-ended quality scoring, but validate the judge with human agreement scores first.

---

## 7. Hallucination Detection & Grounding

- For factual tasks: implement **Retrieval-Augmented Generation (RAG)** — always ground the model in verified source documents.
- Add a **citation requirement**: instruct the model to cite the source chunk for every factual claim. Verify citations server-side.
- Implement a **confidence signal**: if the model cannot find relevant context in retrieved documents, it must say so — never confabulate.
- For high-stakes outputs (medical, legal, financial): add a **human-in-the-loop** review gate before surfacing to the user.
- Log every case where the model's output contradicts retrieved source material — these are hallucination incidents.

---

## 8. Provider Resilience & Multi-Provider Fallback

- Wrap every LLM API call in a **circuit breaker**:
  - **Closed** (normal): requests pass through.
  - **Open** (failing): fail fast with fallback response for 30–60 seconds.
  - **Half-open** (recovering): probe with limited traffic.
- Implement a **provider fallback chain**: primary provider (e.g., Anthropic) → secondary (e.g., OpenAI) → tertiary (cached response or rule-based fallback).
- Set **hard timeout limits**: 30 seconds for streaming, 10 seconds for non-streaming completions. Never leave a request open indefinitely.
- Use exponential backoff with jitter for rate limit errors (HTTP 429): initial 100ms, factor 2×, max 3 retries, max backoff 8 seconds.

---

## 9. Responsible AI

- Every AI feature must include a **Content Moderation layer** at both input and output:
  - Input: block harmful, illegal, or policy-violating requests before hitting the model.
  - Output: scan for harmful content before surfacing to users.
- Implement **bias testing** as part of the eval suite: test across demographic groups, languages, and regional contexts.
- Log all **refusals** and **policy violations** for review — they reveal both user intent and model failures.
- Provide users with **AI disclosure**: clearly label AI-generated content in the UI.
- Implement a **feedback mechanism**: thumbs up/down on AI outputs. Route negative feedback to the eval improvement pipeline.
- Honor user **opt-out of data use for training** signals — never use opted-out data for model improvement.
