---
name: cuda-stack
description: Develop, debug, optimize, or port NVIDIA CUDA runtime/driver applications, streams, events, graphs, cooperative groups, memory, kernels, and profiling workflows.
---

# CUDA stack

Keep CUDA API/runtime concerns here; load `assembler` for PTX/SASS or calling-convention analysis and `x86-architecture` for host-side CPU behavior.

1. Record CUDA toolkit/driver, GPU compute capability, target architecture, compiler flags, and launch configuration.
2. Verify stream/event ordering, device visibility, error propagation, synchronization, memory lifetime, and graph capture constraints.
3. Inspect occupancy, register/shared-memory use, memory transactions, launch overhead, and Nsight evidence before optimizing.
4. Use capability-gated kernels and preserve a correct fallback path.
5. Run deterministic numerical checks, race/memory checks, the original workload, and a regression benchmark.

For version-sensitive toolkits or compatibility claims, read `_systems-ml-shared/version-policy.md`.
