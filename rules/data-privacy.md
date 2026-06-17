---
alwaysApply: true
---

# Data Privacy & Compliance

Privacy is not a feature you add at the end. It is a design constraint applied from the first line of code. Violations carry fines up to 4% of global revenue (GDPR) and irreversible reputational damage.

---

## 1. Data Minimization — Collect Only What You Need

- Collect **only the data strictly necessary** to deliver the feature. If you cannot articulate why you need a field, do not collect it.
- Review data collection with a **privacy-by-design** lens before implementing any new user-facing feature.
- Delete data you no longer need on a defined schedule — do not retain indefinitely by default.
- Prefer **anonymous or pseudonymous identifiers** over real names or email addresses in analytics and logs.

---

## 2. PII Classification Taxonomy

Classify every data field before storing it:

| Level | Class | Examples | Required Controls |
|---|---|---|---|
| **L1** | Public | Username, public profile bio | No special controls |
| **L2** | Internal | Name, email address, account ID | Encrypted in transit, access logged |
| **L3** | Confidential | Phone, location, IP address, conversation history | Encrypted at rest + in transit, access restricted, retention limit |
| **L4** | Restricted | Payment data, SSN, medical info, government ID | End-to-end encryption, strict access controls, compliance audit trail |

- Every database column containing L3/L4 data must be tagged in the schema documentation.
- L4 data must never be stored in application logs, analytics pipelines, or third-party SaaS tools without explicit DPA coverage.

---

## 3. Data Retention & Deletion

- Define a **retention policy** for every data class before shipping to production. No data should have an undefined retention period.
- Implement **soft-delete** for user-facing records (mark as `deleted_at`, exclude from queries).
- Schedule **hard-delete jobs** that permanently remove data after the retention window expires.
- Implement **Right to Erasure (GDPR Article 17)**: a user's delete request must propagate to all systems within 30 days, including backups, analytics exports, and third-party processors.
- Document which data is **excluded from erasure** (e.g., financial transaction records required by law) and why.

---

## 4. Consent Management

- Collect **explicit, informed consent** before processing L3/L4 data.
- Store consent records with: `user_id`, `consent_type`, `granted_at`, `ip_address`, `version_of_terms`.
- Implement **granular consent**: users must be able to consent to analytics without consenting to marketing.
- Make it **as easy to withdraw consent as to give it**. Hiding the opt-out is a GDPR violation.
- Re-request consent whenever the purpose or terms materially change.

---

## 5. Encryption Standards

- **At rest**: AES-256 encryption for all databases and file storage containing L3/L4 data.
- **In transit**: TLS 1.3 minimum for all connections. Disable TLS 1.0 and 1.1.
- **Application-level encryption**: for L4 data (e.g., payment cards), encrypt at the application layer before writing to the database — encryption at the DB/disk level alone is insufficient.
- **Key management**: use a dedicated Key Management Service (AWS KMS, GCP Cloud KMS, HashiCorp Vault). Never hardcode encryption keys in source code or environment variables.
- **Key rotation**: rotate encryption keys annually at minimum. Implement zero-downtime key rotation.

---

## 6. Data Residency & Transfer

- Identify the geographic region where each class of data is **stored and processed** before go-live.
- For EU users: personal data must not leave the EEA unless the destination country has an **adequacy decision** or a **Standard Contractual Clause (SCC)** is in place.
- Document all **cross-border data transfers** in the privacy notice.
- For regulated industries (healthcare, finance): verify regional data residency requirements with a legal advisor before selecting cloud regions.

---

## 7. Third-Party Data Processors

- Every third-party SaaS tool that receives personal data is a **data processor** — they require a **Data Processing Agreement (DPA)**.
- Maintain an **inventory of all data processors** (tool name, data shared, DPA status, link to their privacy policy).
- Before adding a new analytics tool, logging service, or AI provider: verify they have a signed DPA available and review what data you are sending them.
- Apply **data minimization to third-party integrations**: send only what the tool strictly needs (e.g., anonymize user IDs before sending to analytics).

---

## 8. Data Breach Response

- Maintain a documented **data breach response plan** specifying:
  - Internal escalation path (who to notify within the first hour).
  - GDPR 72-hour supervisory authority notification window.
  - User notification criteria and messaging templates.
- Implement **breach detection**: anomaly alerts for mass data exports, unusual access patterns, or large DELETE operations outside maintenance windows.
- After any breach: conduct a root-cause analysis and publish an internal post-mortem within 7 days.

---

## 9. Privacy in Development Practices

- **Never use real production data in development or staging environments.** Use anonymized or synthetically generated datasets.
- Strip or anonymize PII from error logs, stack traces, and crash reports before shipping to any error-tracking tool (Sentry, Datadog, etc.).
- Run a **PII scanner** in CI (e.g., `detect-secrets`, custom regex rules) to catch accidental logging of emails, IPs, or tokens.
- Conduct a **Privacy Impact Assessment (PIA)** for any feature that introduces a new category of personal data collection or a new use of existing data.
