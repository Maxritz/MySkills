---
name: cpp-systems
description: Write, port, review, or debug production C++ systems code involving RAII, templates, allocators, concurrency, ABI, performance, and native integration.
---

# C++ systems

Use ownership types and interfaces to make lifetime and replacement boundaries visible.

1. State value/reference ownership, exception/no-exception policy, thread-safety, ABI, and performance contracts.
2. Prefer RAII, spans/views with valid lifetimes, explicit synchronization, and narrow platform adapters.
3. Control template and binary boundaries; avoid accidental ABI exposure and hidden allocations.
4. Test with warnings, sanitizers, static analysis, deterministic unit tests, and ABI/API checks.
5. Benchmark only after correctness and use profilers to identify allocation, lock, cache, or dispatch costs.

Load `implementation-integrity` for code generation, `code-contract-comments` for public APIs, and `toolchains` for compiler/linker selection.
