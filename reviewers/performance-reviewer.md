# Performance Reviewer Profile

Review changes for execution efficiency, database query performance, frontend rendering speed, bundle size impact, caching correctness, and Core Web Vitals compliance. Reference `rules/performance.md` for budgets and targets.

## Checklist

### Frontend Performance
- [ ] **Core Web Vitals Gate**: This change does not regress LCP (≤ 4s max), INP (≤ 500ms max), or CLS (≤ 0.25 max). Verified via Lighthouse CI or manual check.
- [ ] **Bundle Size Impact**: New JS dependencies are justified. No whole library imported for one function. Bundle size delta reviewed.
- [ ] **Code Splitting**: New heavy components or routes use dynamic imports (`import()`) — not bundled in the initial chunk.
- [ ] **Image Optimization**: New images use WebP/AVIF, have explicit `width`/`height`, use `loading="lazy"` for below-fold, use `srcset` for responsiveness.
- [ ] **Animations**: New animations only use `transform` and `opacity` — no `width`, `height`, `top`, `left` animations (causes layout reflow).
- [ ] **Long Lists Virtualized**: Lists > 100 items use a virtualization library (TanStack Virtual, react-window).

### Backend Performance
- [ ] **No N+1 Queries**: Related data inside loops is batch-loaded via JOIN, `IN`, or eager-loading.
- [ ] **EXPLAIN ANALYZE Run**: New database queries have been analyzed with `EXPLAIN ANALYZE` on a representative dataset.
- [ ] **Indexes Exist**: All `WHERE`, `JOIN`, and `ORDER BY` columns used in hot-path queries are indexed.
- [ ] **Connection Pooling**: No new DB connections created per request. Connection pool is used.
- [ ] **P99 Latency Budget**: The changed endpoint's P99 latency stays within budget (read: ≤ 200ms, write: ≤ 1s).
- [ ] **Heavy Work Is Async**: Operations > 200ms not needed synchronously are offloaded to a background job queue.

### Caching
- [ ] **Explicit TTL**: All new cache entries have an explicit, short-lived TTL. No indefinite caching.
- [ ] **Invalidation Hooks**: Mutations affecting cached data evict the corresponding cache keys.
- [ ] **Cache Miss Safety**: Cold cache (empty cache) does not cause a thundering herd or request failure.

### Load & Capacity
- [ ] **Load Test Exists**: For high-traffic endpoints, a load test (k6, Gatling) validates behavior under expected peak load.
- [ ] **Resource Limits Set**: New services or jobs have CPU and memory limits configured.
