# Grommet Source-to-Build Review

Grommet is the mandatory planning perspective that compares the proposed build pack with the approved source documents before execution.

## Review contract

1. State in plain language what GlobalSetup will build.
2. Trace every requirement and task to one or more approved repository-local source files.
3. Treat GitNexus as derived dependency and impact evidence only; never use graph output as product authority.
4. Record every contradiction between approved sources. Do not approve while any contradiction is unresolved.
5. Confirm that automated publication is limited to the destinations declared in `automation_authority`.
6. Record `source_authority.grommet_review.status` as `approved` only when the source-to-build mapping is complete and accurate.

Approval is part of initial build-pack approval. It must not create a repeated confirmation gate during execution.
