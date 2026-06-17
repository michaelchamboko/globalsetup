---
alwaysApply: true
---

# Infrastructure & Deployment Engineering Rules

The best code running on flawed infrastructure fails in production. Infrastructure is code — it must be version-controlled, reviewed, and tested like everything else.

---

## 1. Infrastructure as Code (IaC) — No Click-Ops in Production

- **All cloud resources must be defined in code** — Terraform, Pulumi, AWS CDK, or equivalent. No manual resource creation in production consoles.
- IaC code lives in the same repository as the application (monorepo) or a dedicated `infrastructure/` repo — never ad-hoc scripts on someone's laptop.
- Every infrastructure change follows the same PR review process as application code.
- Run `terraform plan` / `pulumi preview` as a CI check on every infrastructure PR. Post the plan diff as a PR comment.
- Use **remote state backends** (Terraform Cloud, S3 + DynamoDB lock, Pulumi Cloud) — never local state files for shared environments.
- Implement **state locking** to prevent concurrent infra modifications.

---

## 2. Environment Parity

- Maintain parity across environments: **development ≈ staging ≈ production**.
  - Same OS, same runtime version, same backing service types (not SQLite in dev vs. PostgreSQL in prod).
  - Same configuration structure — different values, same shape.
- Use **Docker** or equivalent for local development to ensure OS-level parity.
- Staging must be a **production clone**: same database engine version, same cloud region setup, same network topology.
- Never test a production deployment for the first time in production — validate in staging first.

---

## 3. Container & Image Hygiene

- Use **multi-stage Docker builds**: build in a full image, copy artifacts to a minimal runtime image.
- Base images: prefer **distroless** or **Alpine**-based for production — smaller attack surface, faster pulls.
- Run processes as a **non-root user** inside containers:
  ```dockerfile
  RUN addgroup -S appgroup && adduser -S appuser -G appgroup
  USER appuser
  ```
- Pin base image versions to a specific digest (`sha256:...`), not just a tag — tags are mutable.
- Scan container images in CI with **Trivy** or **Snyk** for known CVEs. Block deployments with critical vulnerabilities.
- Never store secrets in container images — inject via environment variables or mounted secrets at runtime.

---

## 4. Zero-Downtime Deployments

- Choose a deployment strategy appropriate to the service:

| Strategy | Zero-downtime | Rollback speed | Traffic split support |
|---|---|---|---|
| **Rolling** | ✅ | Medium | Partial |
| **Blue/Green** | ✅ | Fast (swap) | No (hard cutover) |
| **Canary** | ✅ | Fast (reroute) | ✅ |

- **Never deploy directly to production** without first routing a small traffic percentage (1–5%) via a canary release.
- Implement **connection draining**: allow in-flight requests to complete before terminating old instances (`terminationGracePeriodSeconds` in Kubernetes, drain in load balancer rules).
- Database migrations must be **backward-compatible** with the old code version during rolling deploys (see `database.md` for two-phase migration rules).
- Decouple **deploy** from **release** using feature flags — code ships dark, feature turns on independently.

---

## 5. Health Checks & Readiness

- Every service must expose `/health` (liveness) and `/ready` (readiness) endpoints (see `observability.md`).
- Configure liveness probes conservatively — a false positive kills a healthy pod. Use a longer `failureThreshold`.
- Configure readiness probes aggressively — a pod should only receive traffic when it is truly ready.
- Implement **startup probes** for slow-starting applications (e.g., JVM, Python with large model loading) to prevent premature liveness probe failures.

---

## 6. Secrets Management in CI/CD

- All secrets in CI/CD pipelines must be stored as **encrypted secrets** in the pipeline provider (GitHub Actions Secrets, GitLab CI/CD Variables, Vault Agent).
- Never print secrets in CI logs — use `::add-mask::$SECRET` in GitHub Actions to mask dynamically.
- Rotate secrets on a defined schedule. Automate rotation where possible.
- Use **OIDC-based authentication** (Workload Identity Federation) for cloud provider access in CI — eliminates long-lived static credentials entirely.
- Separate secrets per environment: staging secrets must not be usable in production.

---

## 7. Disaster Recovery (DR)

- Define **RTO** (Recovery Time Objective) and **RPO** (Recovery Point Objective) for every service before go-live:
  - RTO: maximum acceptable downtime
  - RPO: maximum acceptable data loss
- Implement and **test** automated database backups. A backup you have never tested is not a backup.
- Run a DR drill at least annually: simulate a production failure and validate the recovery procedure.
- Document the recovery runbook for every critical service (see `templates/governance/runbook-template.md`).
- Use **multi-region active-passive** (minimum) or **active-active** (recommended for > 99.95% SLO) for critical services.

---

## 8. Cost Control & Tagging

- Every cloud resource must have these tags:
  - `env`: `production` / `staging` / `development`
  - `service`: service name
  - `team`: owning team
  - `cost-center`: billing attribution code
- Set **budget alerts** in your cloud provider at 70% and 90% of monthly budget.
- Review cloud cost dashboards monthly. Identify and eliminate idle resources (unattached volumes, unused load balancers, forgotten staging environments).
- Use **reserved instances or committed use discounts** for stable baseline workloads — never pay on-demand for predictable traffic.

---

## 9. Network Security

- Use **private subnets** for all compute and database resources. Only load balancers should be in public subnets.
- Implement **Security Groups / Firewall Rules** with least-privilege: only open the exact ports and protocols required.
- Enable **VPC Flow Logs** for network traffic visibility.
- Use **WAF (Web Application Firewall)** in front of public-facing applications.
- Enforce **mutual TLS (mTLS)** for service-to-service communication within a cluster.
