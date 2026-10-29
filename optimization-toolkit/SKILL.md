---
name: optimization-toolkit
description: Measurement-driven CPU/GPU performance analysis, profiling and architecture-specific optimisation. Use when a measured workload needs improvement.
compatibility: opencode
---

# Optimization Toolkit

Optimise a measured bottleneck, not a slogan. Every technique below is a hypothesis whose benefit must be verified on the target workload and hardware.

## 1. Route to the narrowest technique

- For byte/cycle budgets and demoscene code-size work, use [demoscene-opt](../demoscene-opt/SKILL.md); details are in [specialised techniques](references/specialised-techniques.md).
- For AMD GPU architecture/runtime selection, use [amd-gpu-stack](../amd-gpu-stack/SKILL.md).
- For a single GPU kernel, use [kernel-tuning](../kernel-tuning/SKILL.md).
- For an end-to-end latency claim, use [sherlock-it](../sherlock-it/SKILL.md) to check measurement and instrumentation effects.

## 2. Establish a baseline first

Record the exact revision, compiler and flags, hardware, runtime, input shape, data type/precision, batch size, warm-up, power/clock state, and concurrency. Confirm correctness before timing. Keep the original implementation and a repeatable benchmark command.

Use a profiler or counters to determine whether the limit is compute, bandwidth, cache/memory latency, launch/synchronisation, occupancy/register pressure, I/O, or host scheduling. Do not infer a bottleneck from high-level timing alone.

## 3. Choose an intervention from evidence

- **Fuse intermediates** only when avoided launch/allocation/traffic outweighs higher register pressure, reduced occupancy, lost reuse or code complexity.
- **Change data layout** only when measurements show the existing access pattern wastes bandwidth, cache capacity or SIMD lanes.
- **Remove branches** only when misprediction/divergence costs exceed extra instructions and data movement.
- **Inline or unroll** only when call/loop overhead or vectorisation improves enough to offset code growth, instruction-cache pressure and register spills.
- **Prefetch** only after evidence of predictable latency that hardware prefetch does not handle well. Measure both benefit and cache pollution.
- **Specialise** only when the dispatch condition is stable and the specialised path preserves a correct fallback.
- **NUMA placement** matters only on a NUMA system with demonstrated remote-memory effects. The numactl examples below are Linux-specific.
- **SIMD/instruction selection** must follow the actual target ISA, compiler code generation and CPUID/runtime dispatch requirements.

## 4. Use the right model

Roofline attainable throughput is bounded by both compute and bandwidth:

attainable performance <= min(peak compute, peak memory bandwidth × arithmetic intensity)

Keep units consistent. Arithmetic intensity is operations per byte transferred at the memory level being modelled; cache reuse can make the effective traffic at different levels very different. The roofline model does not explain launch-bound, dependency-bound, synchronisation-bound or host-bound work by itself.

Cache capacity and latency vary by CPU, cache topology, workload and contention. Do not use fixed L1/L2/L3 latency tables as evidence. Measure counters and working-set behaviour on the target. On Linux, for example:

~~~bash
perf stat -e cycles,instructions,cache-misses ./app
~~~

Memory access descriptions such as contiguous, strided and random are starting points. The penalty depends on cache residency, transaction width, memory subsystem, coalescing rules and actual reuse. Verify with counters and a representative workload.

## 5. CPU and GPU tuning

### CPU

Use compiler vectorisation reports before rewriting loops by hand. Examples:

~~~bash
# GCC
g++ -O3 -fopt-info-vec-optimized -fopt-info-vec-missed ...
# Clang
clang++ -O3 -Rpass=loop-vectorize -Rpass-missed=loop-vectorize ...
# MSVC
cl /O2 /Qvec-report:2 ...
~~~

Flags differ by compiler; use only the relevant command. Compare generated code and measured throughput. -march=native is suitable for local benchmarks, not automatically for distributable binaries. Use runtime dispatch or a declared minimum ISA where portability matters.

### GPU

Occupancy, wave/warp size, block size, register use and shared/local memory limits are architecture-specific. Maximum occupancy is not the objective; sufficient occupancy to cover latency while preserving reuse and instruction efficiency is the goal. Change one variable at a time and check correctness. Do not force register limits or fixed block sizes without profiling for spills, occupancy and throughput.

### NUMA (Linux only)

~~~bash
numactl -H
numactl --cpunodebind=<node> --membind=<node> ./app
~~~

Use only when the machine exposes NUMA nodes and the benchmark shows locality effects. Do not apply CPU affinity or performance governors blindly on shared systems.

## 6. Benchmark and validate

1. Warm up and run repeated baseline/candidate measurements on the same workload and environment.
2. Alternate or randomise run order when thermal, clock or background drift could bias the comparison.
3. Report sample count, median, spread/percentiles, throughput and relevant counters. Keep best-observed latency separate; it is not a hardware ceiling.
4. Make one material change per experiment and preserve a control.
5. Re-run correctness and the original reproducer. Keep fallback behaviour and unsupported-hardware paths valid.
6. Accept the change only if the measured improvement exceeds observed noise and the workload's acceptance threshold without violating correctness, memory, latency or portability constraints.

Report the hot path and its measured share, baseline and candidate distributions, profiler evidence, compiler/hardware context, correctness results, regressions and trade-offs. If no repeatable improvement was demonstrated, say so.

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.
