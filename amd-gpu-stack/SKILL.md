---
name: amd-gpu-stack
description: "Unified AMD GPU stack: ROCm/HIP platform, ROCr/HSA runtime, CDNA/RDNA architectures. Develop, debug, profile, optimize across MI200/MI300 and RX 6000/7000."
compatibility: opencode
---
# AMD GPU Stack

Route by layer; do not preload the whole stack. Capture target, OS, GPU architecture, driver, ROCm/HIP/ROCr versions, compiler flags and workload.

## Layer map

| Layer | Scope | Load detailed reference when |
|---|---|---|
| Platform/library | Installation, compiler, APIs, version compatibility | Changing packages, libraries or runtime settings |
| ROCr/HSA runtime | Agent/queue, dispatch, signals, memory visibility | Wrong queue, hangs or synchronisation errors |
| CDNA | MI-series compute units, MFMA, memory, RCCL | Tuning CDNA kernels or multi-GPU work |
| RDNA | RX-series waves, registers, memory, native instructions | Tuning RDNA or HIP translation |

Detailed platform/runtime and architecture guidance: [AMD GPU recipes](references/stack-recipes.md).

## Diagnostic workflow

1. **Correctness:** reduce to a minimal workload and compare with a trusted reference.
2. **Runtime:** trace host submit → queue/agent → dispatch → completion signal → output visibility.
3. **Performance:** establish a baseline; separate host launch, device execution, transfers and synchronisation.
4. **Porting:** compare semantics and capabilities first, then use library primitives or target-specific kernels.
5. **Verification:** rerun the same reproducer and target workload after each change.

Record environment/version, source revision, first divergence, timing boundaries, metric provenance, actual checks and unresolved paths. Never report host time as device time or extrapolate to an untested device.

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

## Boundaries

Use `vulkan-compute-stack` for Vulkan setup/synchronisation, `kernel-tuning` for generic tuning and `llm-hardcode` for quantised LLM kernels.
