---
name: rdna
description: "AMD RDNA: wave32, LDS, vector registers."
license: MIT
compatibility: opencode
---

# AMD RDNA Architecture

## Compute Units (CU)

- RDNA1: 64 CUs, 4 SIMDs per CU, 16 threads/wave, 1024 threads/block.
- RDNA2: adds Infinity Cache (128MB), 40 CU max (RX 6800 XT).
- RDNA3: Dual-issue, chiplet design, AI accelerator (Matrix Core).
- Wave32 (default) vs Wave64. Wave32 = better occupancy on RDNA.

## Registers

- SGPR (Scalar): 104 registers per CU. Used for control flow, addresses.
- VGPR (Vector): 256KB per CU. Each VGPR is 32-bit dword.
- LDS (Local Data Share): 32KB per CU. Shared memory equivalent.

## Memory Hierarchy

- Global memory: 256-bit interface per DRAM channel.
- L1: 16KB per CU (instruction + data unified).
- L2: shared across CUs on the chip. 1-4MB depending on SKU.
- Infinity Cache (RDNA2/3): 128MB L3 equivalent cache.

## Instruction Set (GFX10/GFX11)

- VOP (Vector ALU), SOP (Scalar ALU), DPP (Data Parallel Primitives).
- `v_add_u32`, `v_mul_lo_i32`, `s_add`, `s_bfe`.
- Barriers: `s_waitcnt` for VGPR/LGS/VMEM counters.
- Branch: `s_cbranch_vcc`, `s_swappc` for function calls.

## HIP Translation

- `hipify` tool converts CUDA → HIP. Most intrinsics map directly.
- `__syncthreads()` → `__syncthreads()` (same in HIP).
- `blockIdx`, `threadIdx`, `blockDim`, `gridDim` same names.
- `hipMalloc` → `hipMalloc`, `hipMemcpy` → `hipMemcpy`.
- AMD-specific: `__builtin_amdgcn_*` intrinsics for low-level control.

## Profiling

- `rocprof` / `rocgdb` for profiling and debugging.
- `rocminfo` to list GPUs. `rocm-smi` for runtime metrics.
- Kernel timing: `hipEventRecord` with `hipEventElapsedTime`.
