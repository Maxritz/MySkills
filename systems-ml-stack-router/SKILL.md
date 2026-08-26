---
name: systems-ml-stack-router
description: Route cross-domain systems, graphics, compiler, model-format, and LLM tasks to the smallest set of conditionally loaded skills. Use when a request spans multiple layers or the correct specialist is unclear.
---

# Systems and ML stack router

Route by the failing or changing boundary, not by buzzword. Load one specialist first; add another only when an explicit interface crosses domains.

| Signal | Load first | Add only if needed |
|---|---|---|
| ROCm/HIP libraries, profiling, kernels | `rocm-stack` | `rocr-runtime`, `memory-management` |
| HSA/ROCr queues, signals, agents | `rocr-runtime` | `rocm-stack`, `memory-management` |
| Linux driver/kernel/MM | `linux-kernel` | `memory-management`, `x86-architecture` |
| Windows/D3D12/WDDM | `windows-system-architecture` | `directx-ai-ml`, `graphics-shader-kernels` |
| CUDA runtime/graphs/kernels | `cuda-stack` | `assembler`, `x86-architecture` |
| Model conversion or artifacts | `python-conversion` or format skill | `llm-components`, `toolchains` |
| Port/build target changes | `cross-porting` or `cross-compilation` | `toolchains`, relevant domain skill |
| Code correctness and production readiness | `implementation-integrity` | `code-contract-comments`, boundary skill |

Read `_systems-ml-shared/shared-execution-protocol.md` only for implementation tasks. Never preload the suite. If the request is version-sensitive, read `_systems-ml-shared/version-policy.md` and verify official release sources.
