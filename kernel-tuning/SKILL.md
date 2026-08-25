---
name: kernel-tuning
description: "Kernel tuning: profiling, cache/bandwidth optimization, SIMD."
license: MIT
compatibility: opencode
---

# Kernel Tuning

## Roofline Model

- **Compute-bound**: flops > arithmetic intensity × bandwidth. Bounded by compute peak.
- **Memory-bound**: flops < arithmetic intensity × bandwidth. Bounded by memory bandwidth.
- Arithmetic Intensity = FLOPs / Bytes. 
- Plot on roofline chart to identify bottleneck.

## Profiling Methodology

1. **Baseline** — record hardware counters at entry.
2. **Profile hot loops** — `perf record -g` (Linux) / Intel VTune / `rocm-smi`.
3. **Identify bottleneck** — CPU cycles, cache misses, branch misses, memory latency.
4. **Optimize one variable** — isolate the cause before fixing.
5. **Validate** — re-measure, compare to baseline, check correctness.

## CPU Cache Optimization

- **Level 1**: 32-48KB per core, ~1 cycle. 
- **Level 2**: 256-512KB per core, ~3 cycles.
- **Level 3**: 8-32MB shared, ~12 cycles.
- **Cache line**: 64 bytes. Access sequentially, not strided or random.
- `perf stat -e cache-references,cache-misses` to measure cache hit rate.
- Prefetch: `__builtin_prefetch(ptr, rw, locality)` — hint for cache loading.

## Memory Access Patterns

- **Coalesced**: sequential thread → sequential address (ideal).
- **Strided**: same gap between thread accesses (penalty × stride factor).
- **Random**: each thread → random address (worst case, serialize to DRAM latency).
- **Bank conflicts**: 32 threads → 32 banks. If 2+ threads hit same bank → serialize.

## NUMA Awareness

- Linux: `numactl --cpunodebind=N --membind=N` to pin process.
- `numactl -H` shows NUMA topology.
- Allocate memory near the CPU running the thread: `numa_alloc_onnode(size, node)`.
- First-touch policy: page allocated where first written.

## GPU Occupancy

- Occupancy = active warps / max warps per SM. Goal: ~75%.
- Limit factors: registers per thread, shared memory per block, max blocks.
- `cudaOccupancyMaxActiveBlocksPerMultiprocessor()` — compute theoretical max.
- Reduce register count: `nvcc -maxrregcount=N`. May increase spills.
- Block size: aim for multiple of 32 (warp), 128-256 threads common sweet spot.

## CPU Instruction Optimization

- Instruction tables: Agner Fog optimization manuals.
- Latency vs throughput: `imul` has 3-cycle latency, 1/cycle throughput.
- Pipeline stalls: data dependencies, cache misses, branch mispredictions.
- `-O3 -march=native -funroll-loops` — enable CPU-specific optimizations.
- Vectorization: `--report` (Intel) or `-fopt-info-vec` (GCC) to see auto-vectorization.
- Manual vectorization: `#pragma omp simd`, `__builtin_shuffle`, intrinsics.

## Tuning Workflow

1. Benchmark with `hyperfine` or custom timing (`rdtsc`).
2. Pin CPU with `taskset -c 0`.
3. Disable turbo/frequency scaling: `cpupower frequency-set -g performance`.
4. Run 10+ iterations, report min/median (min = hardware ceiling).
5. `--perf-baseline` to record before changes.
6. `--perf-record -g` for call-graph profiling.
