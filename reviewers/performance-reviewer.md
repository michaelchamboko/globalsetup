# Performance Reviewer Profile

Review changes for execution efficiency, database query speed, memory leaks, and frontend rendering performance.

## Checklist

- [ ] **Query Efficiency**: No N+1 database query issues. Multi-record operations are batched.
- [ ] **Database Indexes**: Queries use columns that are properly indexed.
- [ ] **Memory Leaks**: Event listeners, intervals, and subscriptions are cleaned up or disposed of.
- [ ] **Caching**: Repetitive calculations or remote API requests are cached appropriately.
- [ ] **Loop Optimization**: Avoid nested loops over large datasets where a map or index lookup could be used.
- [ ] **Frontend Rendering**: Minimize re-renders. Lazy-load heavy components or route bundles.
