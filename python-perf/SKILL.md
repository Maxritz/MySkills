---
name: python-perf
description: "Python performance optimization: NumPy vectorization, Numba JIT (CPU/GPU), C extensions (cffi), profiling (cProfile, line_profiler, memory_profiler, perf). Deterministic benchmarking."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["Python", "NumPy", "Numba", "cffi", "profiling", "vectorization", "JIT", "AVX2", "AVX-512", "CUDA", "optimization", "benchmark"]
---
# Python Performance

Optimise only a measured bottleneck. Preserve a correct baseline, define the workload and timing boundary, then choose the least costly technique that removes the bottleneck.

## Decision path

| Evidence | First option | Escalate when |
|---|---|---|
| Python loop dominates elementwise/numeric work | NumPy vectorisation/batching | Allocation, temporary arrays or memory movement dominate |
| Repeated numeric function has JIT-compatible types | Numba/JIT | Compilation cost, unsupported operations or deployment constraints outweigh gains |
| C library or stable ABI already exists | Reuse it | Profile shows Python/native boundary is costly or missing capability |
| Sustained hotspot is not expressible efficiently in Python | C/C++/Cython/CFFI extension | Target-specific work is justified by measurements |
| GPU compute dominates and data is resident | GPU array/JIT/kernel | Transfers and launch overhead do not erase the gain |

Detailed vectorisation, Numba CPU/GPU, C-extension and profiler examples: [performance recipes](references/performance-recipes.md).

## Benchmark contract

- Use the representative input size/shape, warm up imports/JIT/device state separately, and repeat measurements.
- Report median and spread, baseline and change, compiler/runtime/hardware, and whether setup/transfer is included.
- Validate numerical outputs against the baseline with explicit tolerances.
- Measure end-to-end behaviour, not only a favourable isolated function. Check memory/allocation costs and deployment overhead.

## Output

Name the measured bottleneck, chosen technique, baseline, repeated result, correctness check, toolchain and residual limits. No profiler output means no profiler-based claim.

## Evidence gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

## Boundaries

Use `python-engineering` for packaging/API quality and `kernel-tuning` for general CPU/GPU measurement.
