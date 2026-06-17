---
alwaysApply: true
---

# Performance Engineering Rules

Performance is a feature — not a post-launch polish task. A 100ms improvement in load time measurably increases user engagement and revenue. At scale, performance regressions compound. Define budgets before you build, measure before you optimize, and never ship a feature that degrades Core Web Vitals.

---

## 1. Performance Budgets — Define Before You Build

### Frontend Budgets

| Metric | Target (Good) | Maximum (Acceptable) | Measurement Tool |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | ≤ 4.0s | Lighthouse, CrUX |
| **INP** (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | Lighthouse, CrUX |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | Lighthouse, CrUX |
| **TTFB** (Time to First Byte) | ≤ 800ms | ≤ 1800ms | WebPageTest |
| **JS Bundle (initial)** | ≤ 150KB gzipped | ≤ 250KB gzipped | Bundlephobia, webpack-bundle-analyzer |
| **Total Page Weight** | ≤ 1MB | ≤ 2MB | WebPageTest |

**Core Web Vitals are a shipping gate** — never merge a PR that regresses LCP, INP, or CLS beyond the Maximum threshold.

### Backend Budgets

| Endpoint Category | P50 | P95 | P99 | Timeout |
|---|---|---|---|---|
| Read (simple query) | ≤ 50ms | ≤ 100ms | ≤ 200ms | 5s |
| Read (complex/joined) | ≤ 100ms | ≤ 300ms | ≤ 500ms | 10s |
| Write (mutation) | ≤ 100ms | ≤ 500ms | ≤ 1s | 10s |
| AI/LLM (non-streaming) | ≤ 2s | ≤ 5s | ≤ 10s | 30s |
| Background job | — | — | — | Define per job |

---

## 2. The Golden Rule — Measure Before You Optimize

- **Never optimize based on intuition.** Profile first, optimize second, verify the improvement third.
- Use **flamegraphs** for CPU profiling. Use **heap snapshots** for memory profiling.
- Identify the **true bottleneck** — optimizing the wrong thing is worse than not optimizing at all.
- For frontend: use Chrome DevTools Performance panel, Lighthouse, and WebPageTest.
- For backend: use your APM tool's flamegraph view (Datadog, Pyroscope, Clinic.js for Node).
- Establish a **performance baseline** before starting optimization work and measure delta against it.

---

## 3. Frontend Performance Patterns

### Critical Rendering Path

- Inline critical CSS (above-the-fold styles) in `<head>`.
- Defer non-critical CSS with `media="print"` pattern or `<link rel="preload">`.
- Defer or async non-critical JavaScript: `<script defer>` or `<script type="module">`.
- Preload key resources: `<link rel="preload" as="font">`, `<link rel="preconnect">` for third-party origins.

### Images

- Use **WebP or AVIF** format — typically 30–50% smaller than JPEG/PNG at equivalent quality.
- Always specify explicit `width` and `height` attributes to prevent layout shift (CLS).
- Use `loading="lazy"` for below-the-fold images. Never lazy-load LCP images.
- Use `srcset` and `sizes` for responsive images — serve appropriately sized images per viewport.
- Serve images via a CDN with automatic format negotiation.

### JavaScript Bundle Optimization

- Use **code splitting** at route and component boundaries. Never ship the entire app in one bundle.
- **Tree-shake** aggressively — import only the functions you use, not entire libraries.
- Use **dynamic imports** (`import()`) for heavy components loaded conditionally.
- Analyze your bundle with `webpack-bundle-analyzer` or `vite-bundle-visualizer` before every major release.
- Audit `node_modules` size — prefer smaller alternatives where available (e.g., `date-fns` over `moment`).

### Rendering Performance

- Animations must use only `transform` and `opacity` — never animate `width`, `height`, `top`, or `left` (triggers layout reflow).
- Use `will-change: transform` sparingly — only for elements you know will animate.
- Virtualize long lists (> 100 items) using a windowing library (TanStack Virtual, react-window).
- Avoid unnecessary re-renders in React: use `React.memo`, `useMemo`, `useCallback` strategically (only where profiling confirms a re-render problem).

---

## 4. Backend Performance Patterns

### Database

- Ensure **every `WHERE`, `ORDER BY`, and `JOIN` column** used in a hot query path is indexed.
- Run `EXPLAIN ANALYZE` on every new query before shipping to production.
- Avoid **N+1 queries** — batch-load related data with `JOIN`, `IN`, or eager-loading (see `database.md`).
- Use **connection pooling** (PgBouncer for PostgreSQL, connection pool config for all ORMs). Never open a new DB connection per request.
- Implement **read replicas** for analytics and reporting queries — never run heavy reports on the primary write node.

### Caching Architecture

Apply caching in layers (never cache prematurely — measure first):

| Layer | Technology | TTL | When to Use |
|---|---|---|---|
| **L1 — In-process** | LRU Map / Node-Cache | Seconds | Frequently read, rarely changing config/static data |
| **L2 — Distributed** | Redis | Seconds to minutes | Per-request expensive computations, session data |
| **L3 — CDN** | Cloudflare / Vercel Edge | Minutes to hours | Public, user-agnostic GET responses |

- Always define **explicit TTLs** — never cache without expiry.
- Implement **cache invalidation hooks** — every mutation that affects cached data must evict the relevant keys.
- Use **cache-aside pattern** (read-through with lazy population) as the default strategy.

### Asynchronous Processing

- Move **any operation > 200ms** that doesn't need to return synchronously to a background job queue (BullMQ, Celery, Temporal).
- Provide **immediate acknowledgement** to the client (202 Accepted) and use webhooks or polling for async result delivery.
- Examples that must be async: email sending, PDF generation, video transcoding, AI inference (when not streaming), bulk data exports.

---

## 5. Performance in CI

- Run **Lighthouse CI** on every PR for user-facing applications. Block merges that regress Core Web Vitals.
- Track **bundle size delta** on every PR with a bot comment showing added/removed bytes.
- Run **load tests** (k6, Gatling) on staging before every major release. Define pass/fail thresholds.
- Profile **database migration performance** on production-representative data volumes before running in production.
