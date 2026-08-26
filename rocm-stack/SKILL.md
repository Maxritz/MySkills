---
name: rocm-stack
description: Develop, debug, profile, or optimize AMD ROCm/HIP applications, libraries, kernels, and distributed GPU workloads. Use for rocBLAS, RCCL, rocprof, rocminfo, HIP, ROCm packaging, or AMD GPU performance tasks.
---

# ROCm stack

Keep this skill at the ROCm platform/library layer. Use `rocr-runtime` for HSA/ROCr semantics and `memory-management` for allocator or DMA diagnosis.

1. Record ROCm release/channel, GPU ASIC, OS, compiler, HIP target, and exact command.
2. Separate API correctness, kernel correctness, synchronization, and performance hypotheses.
3. Inspect `rocminfo`, device libraries, code-object targets, clocks, topology, and profiler evidence before changing code.
4. Prefer HIP/rocBLAS/RCCL primitives when they preserve the contract; isolate architecture-specific kernels behind capability checks.
5. Validate with a deterministic correctness fixture, sanitizer/profiler evidence, and a workload benchmark.

For version-sensitive work, read `_systems-ml-shared/version-policy.md`; never conflate packaged ROCm labels with TheRock or component Git labels.
