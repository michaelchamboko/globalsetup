---
name: ai-feature
description: End-to-end workflow for safely implementing an AI/LLM-powered feature — from prompt design to production eval suite.
argument-hint: [feature description]
---

# AI Feature Implementation Skill

Follow this workflow for every AI-powered feature. Skipping any step risks shipping expensive, unsafe, or hallucination-prone code.

## Pre-Implementation

1. **Define the AI contract** using `templates/contracts/ai-integration-contract-template.md`:
   - Which model and provider?
   - Maximum token budget (input + output)?
   - Streaming or non-streaming response?
   - Fallback behavior when the provider is unavailable?
   - Eval criteria for success?

2. **Design the prompt structure** before writing any code:
   - Write the system prompt in `prompts/<feature-name>/system-v1.md`.
   - Define the user prompt template with clearly marked injection points.
   - Identify all user-controlled inputs and plan sanitization strategy.

3. **Assess adversarial risk**: Write at least 5 prompt injection test cases before implementation begins.

## Implementation

4. **Implement the prompt registry entry**: Register the prompt with name, version, description, and the prompt text as a versioned artifact.

5. **Build with the resiliency wrapper**:
   - Wrap the provider call with: timeout (≤ 10s non-streaming, ≤ 30s streaming), retry with exponential backoff (3 retries max), circuit breaker, and fallback.
   - Add token usage logging middleware.

6. **Validate the output**: Implement schema validation (Zod/Pydantic) on structured outputs before use in business logic.

7. **Add cost controls**: Implement per-user token quota enforcement server-side.

8. **Build streaming state machine** (if streaming): `idle → streaming → complete | error`. Implement cancel/abort mechanism.

## Evaluation

9. **Build the eval suite** (required before production):
   - Write 20+ unit evals (fixed input → expected output pattern).
   - Write 50+ regression evals from real or synthetic representative inputs.
   - Write 10+ adversarial evals (prompt injection, jailbreak attempts, edge cases).
   - Define a minimum passing score (e.g., ≥ 95% accuracy on regression evals).

10. **Wire evals into CI**: Evals run automatically on every PR that modifies this prompt or pipeline.

## Review & Ship

11. **Run the AI reviewer checklist** (`reviewers/ai-reviewer.md`) — all items must pass.

12. **Deploy behind a feature flag** with a kill switch. Never ship AI features without a kill switch.

13. **Set up cost alerts**: Configure budget alerts at 70% and 90% of expected monthly LLM spend.

14. **Monitor post-launch**: Watch error rate, latency P99, token costs, and user feedback thumbs down rate for the first 48 hours.
