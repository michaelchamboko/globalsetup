---
name: repo-discovery
description: Inspect a target project through GitNexus before planning or changing code.
---

# Repository discovery

1. Run `gitnexus status`; run `gitnexus analyze` if the index is absent or stale.
2. Use GitNexus query and context to identify architecture, entry points, modules, execution flows, and external boundaries.
3. Use impact analysis on existing symbols and interfaces likely to change.
4. Inspect exact configuration and filenames directly when graph context points to them.
5. Record stack, conventions, reusable code, risks, test locations, and deployment boundaries in `build-pack/04-existing-codebase-discovery.md`.
6. Run the simplicity audit only when existing-code bloat is relevant to the approved scope.

Do not silently replace unavailable GitNexus evidence with guesses or broad text search.
