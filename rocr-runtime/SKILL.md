---
name: rocr-runtime
description: Work with AMD ROCr/HSA runtime behavior, agents, queues, AQL packets, signals, memory pools, code objects, and low-level runtime diagnostics. Use for ROCr-specific failures or runtime integration.
---

# ROCr and HSA runtime

Keep this skill below the HIP/ROCm library layer. Load `rocm-stack` only when the issue also involves higher-level HIP or ROCm libraries.

1. Identify HSA agents, ISA/code-object target, queue type, packet ownership, signal lifecycle, and memory-pool flags.
2. Trace acquire/write/dispatch/signal/wait ordering and check lifetime, alignment, visibility, and timeout assumptions.
3. Reduce to the smallest queue or memory operation that reproduces the behavior.
4. Compare against a known-good runtime path before changing packet layout or synchronization.
5. Validate on the exact GPU/driver/runtime combination and report unsupported combinations explicitly.

For release questions, read `_systems-ml-shared/version-policy.md`; for cache/coherence/DMA issues, add `memory-management`.
