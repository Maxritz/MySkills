---
name: shader-opt
description: "Shader opt: occupancy, bandwidth, branch divergence."
license: MIT
compatibility: opencode
---

# Shader Optimization

## Branch Divergence

- Divergent branches within a warp/wave = serialization. All paths executed.
- Use arithmetic instead of branches: `select(mask, a, b)` or `a * mask + b * !mask`.
- Avoid `if` inside loops with different outcomes per thread.
- `flatten` / `branch` hints to compiler (GLSL `branch` extension, HLSL `[Branch]`).

## Memory Access Patterns

- Coalesce global memory: consecutive threads access consecutive addresses.
- Shared memory: use `__syncthreads()` barrier. Bank conflict = 32 threads → 32 banks.
- Avoid bank conflicts: pad shared arrays. `float2 tile[BLOCK_SIZE+1]` not `[BLOCK_SIZE]`.
- L1/texture cache for read-only data. Use `ldg()` (CUDA) or `volatile __restrict__` (HIP).
- Read-only data through texture units if spatially local.

## Occupancy

- Block size: power of 2, multiple of warp (32 threads). 64/128/256 common.
- Limit factors: registers per thread, shared memory per block, max threads per SM.
- NVIDIA: `nvcc -Xptxas -v` to check register count. Aim for < 64 regs/thread.
- AMD: `hipcc --offload-arch=gfx1100` with `-v`. Check VGPR/LDS usage.
- Use occupancy calculators: NVIDIA `Occupancy_Calculator.xls`, AMD `ComputeUnits.xls`.

## Instruction Optimization

- Minimize instruction count. Each instruction = latency (if not pipelined).
- Fuse multiply-add: `fma(a, b, c)` = 1 cycle, `a*b + c` = 2 cycles.
- Use `__umulhi` (CUDA/HIP) for 32×32→64 multiplication without 64-bit cost.
- Constant folding: hoist constants out of loops. Use `constexpr` (HLSL) or `static const`.
- Loop unrolling: `#pragma unroll 4` or manual unrolling for small fixed iterations.
- Avoid `div` — use `rcp(x)` + Newton-Raphson refinement instead.

## ISA-Level

**NVIDIA (sm_80/A100):**
- SASS (assembly): 7 instructions/issue, dual-issue MIO + FP64.
- Use `sassi` profiler to inspect PTX → SASS.
- Predicate registers: avoid predicate divergence.

**AMD (gfx10/gfx11):**
- GCN/CU: VOP (vector), SOP (scalar), DPP (data parallel).
- `s_clause` instructions for instruction caching.
- `v_mad_u64` for fused multiply-add on 64-bit.

## Profiling Metrics

- NVIDIA: `smsp__throughput`, `gld_throughput`, `dram_throughput`, `branch_efficiency`.
- AMD: `gpu__compute_unit_active`, `gpu__mem_inst_retired.all_load`, `vmem_fetch_throughput`.
- Bandwidth-bound: increase arithmetic intensity (FLOP/byte ratio).
- Latency-bound: increase parallelism (more blocks, latency hiding).
