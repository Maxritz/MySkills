---
name: system-architecture
description: Design or review end-to-end systems by decomposing requirements, boundaries, data/control paths, performance budgets, failure domains, and observability.
---

# System architecture

Begin with requirements and non-functional budgets, not technology names.

1. Define actors, trust boundaries, lifecycle, state ownership, interfaces, data/control flow, and failure domains.
2. Set latency, throughput, memory, availability, portability, security, and operability budgets.
3. Choose replaceable components with explicit contracts and dependency direction; keep platform code behind adapters.
4. Identify backpressure, retries, cancellation, versioning, migration, and degradation behavior.
5. Produce a testable architecture: observability points, acceptance tests, threat assumptions, and rollback plan.

Load `modular-component-boundaries` for component extraction and `backend-component-demarcation` for service/application layering.
