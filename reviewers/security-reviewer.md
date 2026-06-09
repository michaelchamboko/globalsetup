# Security Reviewer Profile

Review changes for vulnerability prevention, input validation, authentication, and secure data storage.

## Checklist

- [ ] **Input Validation**: All incoming parameters, headers, and request bodies are validated at the boundary.
- [ ] **Injection Prevention**: Database queries use parameterized statements. Shell commands avoid concatenating user input.
- [ ] **PII and Secrets**: No API keys, passwords, or Personally Identifiable Information (PII) are stored in plain text or logged.
- [ ] **Access Control**: Proper authorization checks (roles, policies) are enforced on every endpoint.
- [ ] **XSS and CSRF**: User input rendered in HTML is sanitized or escaped. CSRF tokens are validated where required.
- [ ] **Cryptography**: Secure hashing functions (e.g. bcrypt, Argon2) and encryption standards are used. Constant-time comparisons are used for secrets.
