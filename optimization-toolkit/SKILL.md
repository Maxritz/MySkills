---
name: optimization-toolkit
description: "Extreme optimization: demoscene legends (farbrausch, Ryg, Haujobb) + kernel tuning (roofline, cache, SIMD, GPU occupancy). For when you need maximum performance at any cost."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: false
  trigger_keywords: ["optimization", "demoscene", "kernel tuning", "roofline", "cache", "SIMD", "occupancy", "farbrausch", "Ryg", "Haujobb", "extreme performance"]
---

# Optimization Toolkit

**Extreme optimization techniques** from demoscene legends + systematic kernel tuning. Use when standard optimization is insufficient.

---

## Specialised techniques

- For byte/cycle budgets and procedural-code techniques, use [demoscene-opt](../demoscene-opt/SKILL.md); original framework notes remain in [specialised reference](references/specialised-techniques.md).
- For AMD GPU architecture, runtime and instruction selection, use [amd-gpu-stack](../amd-gpu-stack/SKILL.md); RDNA2-specific notes are retained in the same reference.

## 2. Generic Application Framework

For ANY optimization challenge:

1. **Find hot path**: Profile → identify 90% time
2. **Eliminate intermediates**: Fuse all buffers/arrays
3. **Tighten data layout**: Cache-line friendly, SIMD accessible
4. **Reduce memory traffic**: Every byte reused multiple times
5. **Remove branches**: Convert to arithmetic/bit tricks
6. **Inline everything**: Call overhead = death for inner loops
7. **Specialize**: Generate code for specific problem

---

## 3. Kernel Tuning (Systematic)

### Roofline Model
```
Compute-bound: FLOPs > AI × Bandwidth  (bounded by compute peak)
Memory-bound:  FLOPs < AI × Bandwidth  (bounded by memory bandwidth)
AI = FLOPs / Bytes accessed
```
Plot on roofline chart → identify bottleneck.

### Profiling Methodology
1. **Baseline** — hardware counters at entry
2. **Profile hot loops** — `perf record -g` / VTune / `rocm-smi`
3. **Identify bottleneck** — CPU cycles, cache misses, branch misses, memory latency
4. **Optimize one variable** — isolate cause before fixing
5. **Validate** — re-measure vs baseline, check correctness

### CPU Cache Optimization
| Level | Size | Latency | Strategy |
|-------|------|---------|----------|
| L1 | 32-48KB/core | ~1 cycle | Hot data, register spill |
| L2 | 256-512KB/core | ~3 cycles | Working set |
| L3 | 8-32MB shared | ~12 cycles | Shared data |
| **Cache line** | **64 bytes** | — | **Sequential access only** |

```bash
perf stat -e cache-references,cache-misses ./app
__builtin_prefetch(ptr, rw, locality)  # rw: 0=read, 1=write; locality: 0-3
```

### Memory Access Patterns
| Pattern | Description | Penalty |
|---------|-------------|---------|
| **Coalesced** | Thread i → addr base + i×stride | None (ideal) |
| **Strided** | Thread i → addr base + i×stride×K | × stride factor |
| **Random** | Thread i → random addr | Worst (serialize to DRAM latency) |
| **Bank conflicts** | Multiple threads → same bank | Serialize |

### NUMA Awareness
```bash
numactl --cpunodebind=N --membind=N ./app
numactl -H  # show topology
numa_alloc_onnode(size, node)  # allocate near CPU
```

### GPU Occupancy (CUDA/HIP)
```bash
# Theoretical max
cudaOccupancyMaxActiveBlocksPerMultiprocessor(&blocks, kernel, block_size, shared_mem)

# Targets
Occupancy = active warps / max warps per SM → Goal: ~75%
Block size: multiple of 32 (warp), 128-256 sweet spot
Registers: reduce with -maxrregcount=N (may spill)
```

### CPU Instruction Optimization
```bash
# Agner Fog tables for latency/throughput
# -O3 -march=native -funroll-loops
# Vectorization reports:
#   Intel: --report
#   GCC: -fopt-info-vec
# Manual: #pragma omp simd, intrinsics
```

### Tuning Workflow
```bash
# 1. Benchmark
hyperfine --warmup 3 './app'

# 2. Pin & disable scaling
taskset -c 0 ./app
cpupower frequency-set -g performance

# 3. Run 10+ comparable iterations and report median, spread and best observed sample. The minimum is not a hardware ceiling and can reflect noise, cache state or measurement bias.
# 4. Profile
perf record -g ./app
perf report --stdio
```

---

## Architecture-specific note

Avoid assuming an instruction or occupancy rule is portable across GPU generations. Load [RDNA2 and demoscene notes](references/specialised-techniques.md) only when the target matches.

## 5. Validation Gates

```bash
# Baseline
hyperfine --warmup 5 './app' --export-json baseline.json

# After optimization
hyperfine --warmup 5 './app_opt' --export-json optimized.json

# Compare
python -c "
import json
b = json.load(open('baseline.json'))
o = json.load(open('optimized.json'))
print(f'Speedup: {b[0][\"mean\"]/o[0][\"mean\"]:.2f}x')
print(f'Baseline: {b[0][\"mean\"]*1000:.1f}ms')
print(f'Optimized: {o[0][\"mean\"]*1000:.1f}ms')
"

# Correctness
./test_correctness --compare=reference
```

---

## Output Report

```
OPTIMIZATION TOOLKIT: <technique> APPLIED
HOT PATH: <function> (<pct>% of runtime)
TECHNIQUE: <demoscene legend / kernel tuning>
BEFORE: <cycles> cycles, <cache_miss>% miss, <bandwidth> GB/s
AFTER:  <cycles> cycles, <cache_miss>% miss, <bandwidth> GB/s
SPEEDUP: <x>x (<baseline_ms>ms → <opt_ms>ms)
CORRECTNESS: differential test ✅/❌
TRADEOFFS: <code size> <register pressure> <maintainability>
BLOCKERS: <ISA support|compiler|debuggability>
```

---

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Optimise only a bottleneck shown by measurement. Preserve a baseline, isolate one change, report median and spread on the same workload, and retain correctness and fallback behaviour; do not mistake best observed latency for a hardware ceiling.


## Boundaries

- Does not write algorithmic code (receives hot path to optimize)
- Does not manage build systems (see `toolchains`)
- Does not validate correctness beyond differential testing
- `stop optimization-toolkit`: revert.