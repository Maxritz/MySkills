---
name: optimization-toolkit
description: "Extreme optimization: demoscene legends (farbrausch, Ryg, Haujobb) + kernel tuning (roofline, cache, SIMD, GPU occupancy). For when you need maximum performance at any cost."
compatibility: opencode
metadata:
  loading: on-demand
  auto_trigger: true
  trigger_keywords: ["optimization", "demoscene", "kernel tuning", "roofline", "cache", "SIMD", "occupancy", "farbrausch", "Ryg", "Haujobb", "extreme performance"]
---

# Optimization Toolkit

**Extreme optimization techniques** from demoscene legends + systematic kernel tuning. Use when standard optimization is insufficient.

---

## 1. Demoscene Legends Framework

When optimizing any hot path, enumerate what each legend would do:

### farbrausch (Minimalism)
- **Code size**: Fit in KB, not MB
- **Hand-tuned asm**: Critical loops in asm
- **Aggressive inlining**: No call overhead
- **Lookup tables**: Trade memory for compute
- **Binary compression**: Crunch/Crinkler
- **Dead code elimination**: Strip every unused byte

### Ryg / BeRo (Instruction-Level)
- **ILP**: Schedule independent ops (VLIW style)
- **Non-temporal stores**: Bypass cache for streaming
- **Prefetching**: Software prefetch ahead
- **Bit manipulation**: Bit tricks over arithmetic
- **Custom toolchains**: Specialized compilers

### Haujobb (Streaming)
- **Single-pass**: No intermediate buffers
- **Register tiling**: Reuse loaded data
- **SIMD dot-product**: Specialized instructions
- **Software pipelining**: Overlap dequantize/compute
- **Coalesced access**: Stride-1, no scatter/gather
- **Stall hiding**: Schedule to fill bubbles

### Wayfinder / Fiver2 (Procedural)
- **Procedural generation**: Generate, don't store
- **Algorithmic compression**: Fractal/noise replace assets
- **Bit-packing**: Multiple values per register
- **XNOR + popcount**: Binary neural nets
- **Fixed-point**: Eliminate float
- **1-bit quantization**: Extreme compression

### Chaos Inc / KB (Entropy)
- **Procedural content**: Generate from seeds
- **Minimal engines**: 1-4KB outperforming larger
- **Self-modifying code**: Specialize at runtime
- **Entropy coding**: Minimum representation

---

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

# 3. Run 10+, report min/median (min = ceiling)
# 4. Profile
perf record -g ./app
perf report --stdio
```

---

## 4. RDNA2/ROCr/HSA Translation (GPU)

| Demoscene Concept | RDNA2/ROCr Mapping |
|-------------------|---------------------|
| **Bit-packing** | Pack 8 int4 / 4 int8 into 32-bit VGPR, use `v_dot8_i32_i4` |
| **Fused pipelines** | Read packed weights, scale via `v_mul`/`v_pk`, accumulate int32 |
| **Register tiling** | Reuse 8×8 weight tiles across work-items |
| **LUT optimization** | LDS table indexed by quantized value |
| **Non-temporal stores** | `glc`/`dlc`/`slc` cache hints on loads/stores |
| **Bump allocator** | Pre-allocate HSA pool, hand out from bump buffer |
| **Software pipeline** | Overlap dequant(next) with compute(current) |
| **ILP** | Schedule independent SGPR/VGPR ops, hide `s_waitcnt` stalls |

### RDNA2 Native Dot Instructions (Raw GCN only)
```asm
// v_dot8_i32_i4: 8×int4 × 8×int4 → int32 accumulate
v_dot8_i32_i4 v0, v1, v2, v3

// v_dot4_i32_i8: 4×int8 × 4×int8 → int32
v_dot4_i32_i8 v0, v1, v2

// v_dot2_i32_i16: 2×int16 × 2×int16 → int32
v_dot2_i32_i16 v0, v1, v2
```

---

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

## Boundaries

- Does not write algorithmic code (receives hot path to optimize)
- Does not manage build systems (see `toolchains`)
- Does not validate correctness beyond differential testing
- `stop optimization-toolkit`: revert.