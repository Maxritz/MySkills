---
name: modular-component-boundaries
description: Design, split, remove, or refactor application components with explicit ownership, interfaces, dependency direction, lifecycle, configuration, and replacement seams.
---

# Modular component boundaries

Make components independently understandable, testable, replaceable, and portable.

1. Assign one responsibility, owner, lifecycle, data model, and failure domain to each component.
2. Define a narrow interface with versioning, validation, errors, ownership, concurrency, and observability contracts.
3. Enforce dependency direction; keep platform, transport, persistence, and policy behind adapters.
4. Separate composition/configuration from implementation and keep optional features conditionally registered.
5. Migrate in small steps with contract tests, differential behavior checks, and a removal plan for obsolete paths.

Load `backend-component-demarcation` for service layering, `code-contract-comments` for interface documentation, and `porting-change-isolation` for platform deltas.
