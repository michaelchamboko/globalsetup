# Security Policy

## Supported Versions

We take security seriously and provide security patches for the following versions:

| Version | Supported |
|---|---|
| `main` branch | ✅ Active |
| Older releases | ❌ Not supported |

---

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub Issues.**

If you discover a security vulnerability in GlobalSetup — including issues with any rules, scripts, or workflows that could lead to unsafe agent behavior, secret exposure, or privilege escalation — please report it responsibly:

### How to Report

1. **Email**: Send a detailed report to the repository owner via GitHub's private security advisory feature.
2. **GitHub Security Advisories**: Use the [Report a Vulnerability](../../security/advisories/new) button on the Security tab of this repository.

### What to Include

Please include as much of the following information as possible:

- Type of vulnerability (e.g., prompt injection in rules, secret exposure in scripts, unsafe command in safeguards)
- Full path of the source file(s) related to the vulnerability
- Step-by-step reproduction instructions
- Proof-of-concept or exploit code (if applicable)
- Potential impact and severity assessment

### What to Expect

- **Acknowledgement**: Within **48 hours** of your report.
- **Status Update**: Within **7 days** — we will confirm the vulnerability and outline our remediation plan.
- **Resolution**: We aim to resolve **critical** vulnerabilities within **14 days** and **high severity** within **30 days**.
- **Credit**: We will acknowledge responsible disclosures in the `CHANGELOG.md` unless you prefer to remain anonymous.

---

## Security Considerations for GlobalSetup Users

GlobalSetup is an **agentic build system** — its rules and skills are executed by autonomous AI coding agents with access to your file system, terminal, and potentially your cloud infrastructure. Please be aware of the following:

- **Review all rules before deploying**: The rules in this repository instruct AI agents on how to behave. Review them to ensure they align with your organization's security policies.
- **Validate scripts before running**: The setup scripts in `scripts/` modify your file system. Review them before execution.
- **Never commit secrets**: GlobalSetup's rules explicitly prohibit secret storage in code. Ensure your agents comply.
- **Audit agent actions**: In production workflows, log all agent-executed commands and review them periodically.

---

## Security Best Practices When Using GlobalSetup

1. Pin GlobalSetup to a specific commit SHA rather than tracking `main` in automated pipelines.
2. Review the `CHANGELOG.md` before upgrading to understand what rules changed.
3. Use the `safeguards/dangerous-command-rules.md` as a baseline — extend it for your organization's specific constraints.
4. Run the CI workflow (`ci.yml`) in your fork before deploying updates to your team.
