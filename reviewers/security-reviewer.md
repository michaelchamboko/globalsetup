# Security Reviewer Profile

Review all changes for vulnerability prevention, secure data handling, authentication, authorization, and compliance. Reference `rules/security.md` for full guidance.

## Checklist

### Input Validation & Injection Prevention
- [ ] **Boundary Validation**: All incoming user input (headers, params, request bodies) is validated with a schema validator (Zod, Joi, Pydantic) at the system boundary.
- [ ] **Parameterized Queries**: No user input is concatenated into SQL, shell commands, LDAP queries, or XML. ORM or parameterized statements used exclusively.
- [ ] **XSS Prevention**: HTML output uses framework-provided escaping. No raw `innerHTML` or `dangerouslySetInnerHTML` with user content.
- [ ] **File Upload Safety**: File type (MIME), extension, and size are validated server-side. Files are scanned before storage.
- [ ] **Strict Schema Parsing**: Unexpected fields are rejected, not just invalid ones.

### Authentication & Session Management
- [ ] **Short-Lived Tokens**: Access tokens expire in ≤ 15 minutes. Refresh tokens are stored server-side only.
- [ ] **Constant-Time Comparison**: Token/secret comparison uses `crypto.timingSafeEqual` or equivalent — never `===`.
- [ ] **Secure Password Hashing**: Passwords use bcrypt (cost ≥ 12), scrypt, or Argon2id. MD5 and SHA-1 are banned.
- [ ] **Session Invalidation**: Server-side session invalidation is implemented on logout — not only client-side token deletion.
- [ ] **Brute Force Protection**: Auth endpoints apply rate limiting and account lockout after repeated failures.

### Authorization
- [ ] **Authorization Inside Handlers**: Authorization checks exist inside every route handler — not only in middleware.
- [ ] **Resource-Level Authorization**: The code verifies the requesting user owns or has permission to the specific resource being accessed.
- [ ] **Least Privilege**: Roles and permissions grant only what is strictly necessary.

### Secrets & Credentials
- [ ] **No Hardcoded Secrets**: No API keys, tokens, connection strings, or passwords exist in source code or config files.
- [ ] **Secrets from Environment/Vault**: All secrets are loaded from environment variables or a secrets manager.
- [ ] **No Secrets in Logs**: No passwords, tokens, session IDs, or PII appear in log statements.

### Security Headers & Transport
- [ ] **HSTS Configured**: `Strict-Transport-Security` header is set with `max-age` ≥ 1 year.
- [ ] **CSP Configured**: A `Content-Security-Policy` header is set. `unsafe-inline` and `unsafe-eval` are not used.
- [ ] **Cookie Security**: Cookies use `HttpOnly`, `Secure`, and `SameSite=Strict` or `Lax` flags.
- [ ] **CORS Allowlist**: `Access-Control-Allow-Origin` uses an explicit allowlist — not `*` for authenticated APIs.

### Supply Chain
- [ ] **No New High/Critical CVE Dependencies**: New packages are verified against `npm audit` / `pip-audit` output.
- [ ] **No Suspicious postinstall Scripts**: New package's `scripts.postinstall` was reviewed.
- [ ] **Dependency Review CI Passes**: The dependency-review GitHub Action reports no blocking issues.

### Cryptography
- [ ] **Approved Algorithms**: Only bcrypt/scrypt/Argon2 (passwords), AES-256 (symmetric encryption), RSA-2048+ or ECDSA P-256+ (asymmetric). No MD5, DES, RC4.
- [ ] **Key Management**: Encryption keys are managed via a KMS — not stored in source code or env vars.
