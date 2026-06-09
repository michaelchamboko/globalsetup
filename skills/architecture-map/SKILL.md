---
name: architecture-map
description: Generates architecture map from discovery output
---

Synthesize codebase discovery output into a clear, visual architecture map:

1. Draft a high-level system component diagram using text-based styling (ASCII or Unicode lines).
2. Trace the data flow for the new feature across all affected layers (Client -> Router -> Handler -> DB).
3. Document all integration points between existing modules and new components.
4. List the files that will be created and files that will be modified, stating the rationale.
5. Save the output to build-pack/05-architecture-map.md.
