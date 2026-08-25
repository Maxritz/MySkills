---
name: cdna
description: "AMD CDNA: matrix cores, HIP/ROCm."
license: MIT
compatibility: opencode
---

# AMD CDNA Architecture

## Compute Units & Matrix Cores

- CDNA2 (MI200): 110-120 CUs, 2x CDNA3 (MI300): 133 CGs, matrix cores (FP16/BF16/FP8).
- CDNA3: 192 CUs + 512 AI accelerators. 2.4x FP64 vs FP32 ratio.
- Wave64 required for double-precision; Wave32 for single-precision.
- Matrix core: `v_mma_f16_f16_f16_f16` instructions. 4x4x4 matrix operations.

## ROCm Stack

- HIP (source-compatible C++). rocBLAS (BLAS), MIOpen (DNN), rocFFT (FFT).
- HSA (Heterogeneous System Architecture): unified memory, agent memory pools.
- `hipMalloc` → 4GB page alignment on MI200+.
- `hipMemcpy` flags: `hipMemcpyDefault`, `hipMemcpyHostToDevice`, `hipMemcpyDeviceToHost`.

## Matrix Math (MFMA)

- `v_mfma_f32_16x16x16_f16` — 16x16x16 FP16 accumulations.
- `__builtin_amdgcn_wave32_mfma_*` intrinsics for C++.
- Tile size: 16x16x16 for FP16. Mixed precision with FP32 accumulation.
- Transpose A matrix for optimal memory access pattern.

## Multi-GPU Communication

- AMD ROCm: `rccl` (RCCL) for multi-GPU AllReduce/Broadcast.
- `rcclCommInitRank` + `rcclAllReduce` + `rcclCommDestroy`.
- GPUDirect RDMA for NVIDIA interop (requires AMD GPU with PCIe P2P support).
- XDNA2/ROCm-SMI for power/thermal monitoring.

## Memory Management

- HSA memory pools: `HSA_AMD_AGENT_MEMORY_POOL_FINE_VRAM` (device-local).
- `hipHostMalloc` for pinned host memory (for DMA transfers).
- Unified Memory: `hipMallocManaged` (with caution — migration overhead).
- 2D/3D memory copy: `hipMemcpy2D`, `hipMemcpy3D` for non-contiguous layouts.

## Profiling & Tuning

- `rocprof` (perf markers), `rocgdb`, `mi250_profile_analysis` tools.
- Metrics: `gpu__compute_memory_commands_started`, `gpu__compute_unit_busy`.
- Clock throttling: `rocm-smi` (check `GPU use %`, `Temp`, `SCLK/MCLK`).
- `HIP_VISIBLE_DEVICES` to pin to specific GPUs.
