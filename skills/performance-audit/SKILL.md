---
name: performance-audit
description: Systematic performance profiling and optimization workflow. Measure first, optimize second, verify improvement third.
argument-hint: [service or component to audit] [optional: --frontend | --backend | --database]
---

# Performance Audit Skill

Never optimize without measurement. This workflow ensures every optimization is backed by data and verified to have actually improved performance.

## Phase 1 — Establish Baseline

1. **Define the scope**: Which service, endpoint, component, or user flow is being audited?

2. **Capture baseline metrics before touching any code**:
   - **Frontend**: Run Lighthouse (lab data) and gather 7 days of CrUX (field data) for the target URL.
   - **Backend**: Capture P50/P95/P99 latency from APM dashboards for the target endpoint over the last 7 days.
   - **Database**: Identify top-N slowest queries from the slow query log or APM query analytics.

3. **Set improvement targets**: Define what "success" looks like (e.g., "Reduce LCP from 3.8s to < 2.5s", "Reduce P99 from 800ms to < 300ms").

## Phase 2 — Profile & Identify the Bottleneck

4. **Frontend profiling**:
   - Open Chrome DevTools → Performance tab → Record a page load.
   - Identify the LCP element and what is blocking its render.
   - Run `webpack-bundle-analyzer` or `vite-bundle-visualizer` to identify large chunks.
   - Check the Coverage tab for unused JavaScript/CSS.

5. **Backend profiling**:
   - Enable APM flamegraph for the target endpoint and capture a flamegraph under realistic load.
   - Identify the deepest/widest call stack — that is where the time is spent.
   - Check for N+1 query patterns in the ORM query log.

6. **Database profiling**:
   - Run `EXPLAIN ANALYZE` on slow queries. Look for `Seq Scan` on large tables (missing index).
   - Check `pg_stat_statements` (PostgreSQL) or equivalent for aggregated query statistics.
   - Look for lock contention in `pg_locks` / `pg_stat_activity`.

7. **Do not optimize yet** — document your findings first. The bottleneck you found may not be the root cause.

## Phase 3 — Implement Optimizations

8. **Prioritize by impact**: Fix the largest bottleneck first. Use Amdahl's Law — optimizing a step that takes 5% of total time will never give you > 5% improvement.

9. **Make one change at a time**: Each optimization must be its own commit with a clear description of what was changed and why.

10. **Common optimization techniques by category**:
    - **Frontend bundle**: Code split, tree-shake, replace heavy library with lightweight alternative.
    - **Frontend rendering**: Add virtualization, fix unnecessary re-renders (profile with React DevTools Profiler first).
    - **Backend latency**: Add index, batch N+1 query, move work to background job, add caching layer.
    - **Database**: Add covering index, rewrite slow query, add read replica for heavy reads.

## Phase 4 — Verify & Document

11. **Re-run the same profiling steps from Phase 2** with the optimization applied. Confirm the bottleneck is resolved.

12. **Measure against baseline**: Compare post-optimization metrics to the baseline captured in Phase 1. Confirm the target is met.

13. **Run regression tests**: Confirm no functional regressions were introduced.

14. **Document the results**:
    ```
    Optimization: Added composite index on orders(user_id, created_at)
    Before: P99 = 820ms (EXPLAIN: Seq Scan, cost=0..45210)
    After:  P99 = 43ms  (EXPLAIN: Index Scan, cost=0..8)
    Improvement: 95% latency reduction
    ```

15. **Add a performance test or Lighthouse CI assertion** to prevent future regressions.
