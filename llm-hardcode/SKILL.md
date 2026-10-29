---
name: llm-hardcode
description: "Hand-optimised LLM kernels: tensor layouts, quantised matvec/GEMM, SIMD, cache behaviour, numerical accuracy and differential validation."
license: MIT
compatibility: opencode
---
# LLM Hardcode Development

Use for hand-written LLM kernels, quantised matvec/GEMM and CPU SIMD. Exact layouts are format contracts, not assumptions.

## Task router

| Area | Must preserve | Detailed notes |
|---|---|---|
| Memory/layout | block size, scale/zero-point, packing, alignment, stride and tails | [layout recipes](references/kernel-recipes.md) |
| CPU SIMD | CPUID plus OS-enabled vector state, ABI, unaligned/tail handling and safe fallback | [SIMD recipes](references/kernel-recipes.md) |
| Quantisation | exact upstream type/version, rounding and accumulation rules | [format recipes](references/kernel-recipes.md) |
| Kernel patterns | output shape, aliasing, accumulation, numerical error and fallback | [kernel recipes](references/kernel-recipes.md) |

## Acceptance gates

1. Verify dequantised blocks and intermediate accumulators against a trusted implementation.
2. Test zero/maximum values, partial blocks, alignment/tails, overflow and invalid dimensions as relevant.
3. Compare final outputs using explicit dtype-specific tolerances.
4. Measure identical shape/batch/hardware/compiler conditions; separate launch/setup, memory and compute.
5. Dispatch only to supported instructions and retain a correct fallback.

## Output

Report target ISA/runtime, pinned layout, kernel path, numerical comparison, executed tests and reproducible performance evidence. Do not equate a faster micro-kernel with a faster end-to-end model.

## Evidence gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

## Boundaries

Use `gguf-ggml` for GGUF/GGML file parsing and `kernel-tuning` for general bottleneck methodology.
