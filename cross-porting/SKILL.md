---
name: cross-porting
description: Port software, kernels, shaders, APIs, or model components across operating systems, CPUs, GPUs, graphics APIs, runtimes, ABIs, or compilers.
---

# Cross-porting

Port semantics, not syntax. Start with a capability and behavior matrix for source and target.

1. Freeze observable behavior, ABI, numeric tolerances, synchronization, ownership, error, and performance requirements.
2. Separate portable core logic from platform adapters and feature probes.
3. Map concepts explicitly: memory, queues, events/fences, descriptors, shaders, kernels, filesystem, threads, and errors.
4. Preserve a reference path and run differential tests after every boundary migration.
5. Record unsupported features and intentional degradations; never silently substitute a slower or weaker behavior.

Read `_systems-ml-shared/porting-checklist.md`; add `cross-compilation` and `toolchains` for build/ABI changes.
