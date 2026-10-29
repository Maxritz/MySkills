---
name: optimization-toolkit
description: "Evidence-led optimisation using profiling, data layout, algorithmic simplification, SIMD, memory traffic and architecture-specific tuning."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: false
  trigger_keywords: ["optimization", "optimisation", "demoscene", "kernel tuning", "roofline", "cache", "SIMD", "occupancy", "extreme performance"]
---

# Optimisation Toolkit

Treat optimisation techniques as hypotheses, not rules. Correctness, workload semantics and a measured bottleneck decide which technique is appropriate. This skill covers the search strategy; use kernel-tuning and the relevant CPU/GPU stack for detailed target-specific work.

## 1. Establish the objective

Before tuning, record:
- The exact function/request path and representative workload.
- Required output semantics, precision, determinism and error tolerance.
- Current end-to-end latency, throughput, memory use, code size and failure rate, as relevant.
- Compiler, flags, binary revision, hardware, driver/runtime, power state and measurement boundary.
- The strongest semantically equivalent baseline.

Set an acceptance objective before editing. For example, improving a matmul microkernel is not a win if dispatch overhead, data conversion or copies make the application slower.

## 2. Find the actual bottleneck

1. Reproduce the workload and validate its output.
2. Profile end-to-end behaviour, then drill into the measured hot region.
3. Classify the dominant limit: algorithmic work, dependency latency, instruction throughput, memory bandwidth, cache misses, data movement, launch/dispatch, synchronisation, allocation or queueing.
4. Write a falsifiable hypothesis that predicts which measurement should change.
5. Change one principal variable at a time and rerun the same test.
6. Keep the change only when improvement is reproducible and correctness remains within the declared contract.

Do not hard-code a rule such as “profile the 90% path” or assume Amdahl's law's hot region is already known. Use the measured profile and end-to-end impact.

## 3. Candidate techniques

| Technique | Consider when | Verify before keeping |
|---|---|---|
| Algorithmic reduction | Work count or asymptotic cost dominates | Same semantics, edge cases and memory growth |
| Fusion / remove intermediates | Allocation, writes or intermediate reads dominate | Aliasing, lifetime, parallelism and changed rounding |
| Data layout / tiling | Poor locality or repeated loads are measured | Stride, alignment, cache footprint, tails and resource pressure |
| SIMD / matrix instructions | Target ISA supports the operation and arithmetic dominates | Runtime feature dispatch, operand layout, accumulator semantics and scalar fallback |
| Prefetching | Hardware misses are visible and access is predictable | Extra traffic, cache pollution and end-to-end result |
| Non-temporal / cache-bypass operations | Streaming access has little near-term reuse | Exact architecture semantics, alignment, ordering and destination consumption |
| Branch removal / bit tricks | Branch cost or dependency is measured | Valid input domain, overflow and compiler output |
| Procedural generation / compression | Asset or model-data bandwidth dominates | Decode compute, determinism, quality and memory trade-off |
| Specialisation / JIT | Workload shape/reuse justifies compile/cache cost | Cache keys, invalidation, security, warm-up and fallback |
| Smaller binary / reduced runtime | Startup, distribution or footprint is the limit | Debuggability, CPU features, licensing and loader requirements |

Demoscene-inspired minimalism, procedural generation, aggressive compression and hand-tuned assembly are useful exploration prompts. They are not automatically faster than a general-purpose algorithm, cache, or compiler-generated implementation. Self-modifying code and runtime code generation add security and portability costs and must be justified separately.

## 4. Roofline and resource reasoning

Use arithmetic intensity as a first-order model:

    arithmetic intensity = operations / bytes transferred at the relevant memory level

A rough upper bound is the smaller of attainable compute throughput and arithmetic intensity multiplied by attainable bandwidth. Define what counts as an operation, which memory level supplies the bytes and which precision is being used. The roofline model does not capture launch overhead, dependencies, cache conflicts, synchronisation or irregular control flow by itself.

For CPUs, inspect generated instructions, vectorisation reports, cache/TLB misses, branch behaviour, NUMA placement and memory-controller limits. Cache-line sizes and latencies vary by processor; query the target and do not turn sample values into universal constants.

For GPUs, inspect registers, occupancy, shared/LDS usage, global-memory coalescing, wave/warp and subgroup assumptions, queue/launch overhead and measured achieved throughput. Maximum occupancy is not a universal goal: larger tiles or more register reuse can win even when occupancy falls.

## 5. Architecture-specific discipline

- Compile and dispatch for features actually supported by the deployment target. A build flag that enables an instruction is not runtime feature detection.
- Avoid family-name tables as substitutes for ISA documentation. Verify exact instruction names, operand packing, lane mapping and availability using the target ISA manual, compiler headers and generated code.
- Cache hints, subgroup operations, matrix instructions and tensor formats have architecture-specific semantics. Never assume a cache-bypass flag means universal non-temporal behaviour.
- Keep a scalar/reference path and compare edge cases before timing.
- For AMD, use amd-gpu-stack for HIP/ROCm and shader-opt or vulkan-compute-stack for Vulkan. For NVIDIA, use nvidia-cuda-stack. For x86 instruction selection, use x86-arch.

## 6. Benchmark discipline

Run repeated, equivalent trials. Report a robust centre and spread, not only the fastest result. Warm-up, compilation, loading, CPU scheduling, GPU clocks, thermal state, power state and cache state can change results.

Keep setup outside the timed region unless setup is the target being measured. Synchronise according to the API's actual completion semantics. For asynchronous GPU launches, do not time only the host enqueue call and label it device execution.

Use hyperfine, perf, VTune, Nsight or a ROCm profiler only where appropriate to the platform and installed version. Check command help and capture raw output. Do not put a C intrinsic expression inside a shell-command block and imply it is executable. Do not use perf event names that are unsupported on the target CPU.

## 7. Acceptance and report

A proposed optimisation is accepted only when:
- Reference/boundary tests pass.
- The same workload and measurement boundary show a reproducible improvement.
- The final diff has been reviewed for overflow, aliasing, races, error handling and fallback behaviour.
- Memory, code size, power, startup time, debuggability and portability trade-offs are stated.
- The end-to-end result is not worse beyond the declared tolerance.

    OPTIMISATION REPORT
    HOT PATH: symbol/request path and measured share
    BOTTLENECK: evidence and hypothesis
    CHANGE: algorithm/layout/ISA/runtime and target
    BASELINE: workload and repeated measurements
    RESULT: centre, spread, speedup and end-to-end impact
    CORRECTNESS: reference and edge-case results
    TRADE-OFFS: memory, code size, power, portability
    STATUS: PASS / FAIL / BLOCKED / NOT RUN

## Boundaries

- Use kernel-tuning for a focused measured CPU/GPU kernel.
- Use demoscene-opt for compact procedural graphics and size-constrained design patterns.
- Use sherlock-it for multi-layer root-cause performance tracing.
- Use low-level-toolkit for assembly, disassembly and ABI work.
