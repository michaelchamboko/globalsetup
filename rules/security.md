---
paths:
  - "src/api/**"
  - "src/auth/**"
  - "src/middleware/**"
  - "**/routes/**"
  - "**/controllers/**"
  - "**/handlers/**"
  - "**/services/**"
---

# Security

A senior developer treats security as a first-class feature, not an afterthought. Apply these rules at every system boundary.

## 1. Input Validation & Injection Prevention

- Validate **all** incoming user input at the system boundary — headers, path params, query params, request bodies. Use a schema validator (e.g., Zod, Joi, Pydantic).
- Use parameterized queries or ORM-managed queries exclusively. **Never** concatenate user input into SQL, shell commands, LDAP queries, or XML/HTML.
- Sanitize HTML output to prevent XSS. Use framework-provided escaping; never disable it.
- Reject unexpected fields (strict schema parsing), not just invalid ones.
- Validate file uploads: enforce MIME type, extension whitelist, maximum size, and scan for malicious content before persistence.

## 2. Authentication & Session Management

- Use short-lived access tokens (JWT or opaque). Default max lifetime: **15 minutes** for access tokens.
- Store refresh tokens server-side (DB or Redis). Rotate refresh tokens on every use.
- Hash passwords with bcrypt (cost ≥ 12), scrypt, or Argon2id. Never MD5, SHA-1, or unsalted SHA-256.
- Use constant-time comparison (`crypto.timingSafeEqual` or equivalent) for token and secret matching — never `===`.
- Invalidate sessions server-side on logout. Do not rely solely on client-side token expiry.
- Enforce Multi-Factor Authentication (MFA) for privileged operations and admin routes.
- Lock accounts or apply exponential backoff after 5 failed authentication attempts.

## 3. Authorization & Access Control

- Apply the principle of least privilege. Grant only the minimum permissions required per role.
- Enforce authorization checks **inside** every route/controller handler — not only in middleware that can be bypassed.
- Use resource-level authorization (verify ownership of the resource, not just role membership).
- Never expose internal IDs directly; use UUIDs or opaque tokens where enumeration is a risk.

## 4. Secrets & Credentials Management

- Never hardcode API keys, tokens, connection strings, or passwords in source code or config files.
- All secrets must be loaded from environment variables or a secrets manager (AWS Secrets Manager, HashiCorp Vault, Doppler).
- Never log secrets, tokens, passwords, session IDs, or Personally Identifiable Information (PII).
- Rotate secrets after any suspected exposure. Audit secret access via the secrets manager's access log.
- Add `.env`, `.env.*` (except `.env.example`) to `.gitignore`. Scan commits with `git-secrets` or `trufflehog` in CI.

## 5. Security Headers & Transport

- Set `Strict-Transport-Security` (HSTS) with `max-age` ≥ 1 year on all HTTPS responses.
- Set a strict `Content-Security-Policy` (CSP). Avoid `unsafe-inline` and `unsafe-eval`.
- Set `X-Frame-Options: DENY` or use CSP `frame-ancestors 'none'` to prevent clickjacking.
- Set `X-Content-Type-Options: nosniff` to prevent MIME-type sniffing.
- Set `Referrer-Policy: no-referrer` or `strict-origin-when-cross-origin`.
- Configure CORS with an explicit allowlist — never `Access-Control-Allow-Origin: *` for authenticated APIs.
- Use `SameSite=Strict` or `SameSite=Lax` on all session and auth cookies. Add `HttpOnly` and `Secure` flags.

## 6. Rate Limiting & Denial of Service Prevention

- Rate-limit **all** authentication endpoints: login, register, password-reset, MFA verification.
  - Recommended limits: 5 attempts per minute per IP for login; 3 per hour for password-reset.
- Rate-limit public-facing API endpoints to prevent scraping and abuse.
- Use a centralized rate-limiter (Redis-backed) in distributed environments — not in-process.
- Return `429 Too Many Requests` with a `Retry-After` header.

## 7. Supply Chain & Dependency Security

- Run `npm audit` / `pnpm audit` / `pip-audit` in CI. Block PRs on **critical** or **high** severity findings.
- Pin transitive dependencies where reproducibility matters. Use lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `poetry.lock`).
- Prefer well-maintained, audited libraries. Evaluate new dependencies against their last publish date, weekly downloads, and known CVEs.
- Review the `scripts` section of `package.json` for malicious postinstall hooks when adding new packages.

## 8. Audit Logging & Monitoring

- Log security-relevant events: login success/failure, permission denials, password changes, token issuance/revocation, admin actions.
- Structured logs must include: `timestamp`, `user_id`, `action`, `resource`, `ip`, `request_id`. Never include raw passwords or tokens.
- Ship logs to a centralized, tamper-evident log store (CloudWatch, Datadog, Splunk, etc.).
- Set up alerts for anomalous patterns: brute force spikes, privilege escalation, mass data access.

## 9. Error Handling (Security-Aware)

- Never expose stack traces, internal file paths, database schema details, or raw ORM errors in production responses.
- Return generic error messages to clients. Log detailed diagnostics server-side only.
- Use consistent `{ error: { code, message } }` response shapes regardless of error type to prevent information leakage from response variance.
