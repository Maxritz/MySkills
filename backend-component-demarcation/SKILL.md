---
name: backend-component-demarcation
description: Define and refactor backend/service boundaries across transport, application, domain, persistence, infrastructure, workers, jobs, and configuration.
---

# Backend component demarcation

Keep request transport, application orchestration, domain rules, persistence, infrastructure, workers, and configuration visibly separate.

1. Trace a request from transport to response and mark validation, authorization, transaction, domain, storage, queue, and observability boundaries.
2. Keep domain logic independent of HTTP, database, cloud SDK, and process-global configuration.
3. Define DTO/schema translation at edges; make ownership, retries, idempotency, timeouts, and errors explicit.
4. Isolate background jobs and external integrations behind interfaces with fake/test adapters only in test code.
5. Test each layer plus one end-to-end path, then verify startup, migration, shutdown, and failure recovery.

Load `modular-component-boundaries` for broader component design and `implementation-integrity` for code changes.
