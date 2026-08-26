---
name: python-engineering
description: Implement, refactor, package, profile, and test production Python software, including async services, native extensions, typing, dependencies, and reproducible environments.
---

# Python engineering

Keep Python orchestration separate from native kernels, persistence, transport, and configuration.

1. Define public functions/classes with input, output, ownership, exceptions, concurrency, and performance contracts.
2. Use a small package layout, explicit dependency boundaries, type checking, linting, and deterministic tests.
3. Keep blocking work out of async paths; make cancellation, timeouts, retries, and cleanup explicit.
4. Profile before optimizing and isolate native/FFI code behind narrow adapters.
5. Build a clean environment, run unit plus integration tests, exercise failure paths, and report unrun checks.

Load `implementation-integrity` for generated or repaired code and `code-contract-comments` for public or non-obvious interfaces.
