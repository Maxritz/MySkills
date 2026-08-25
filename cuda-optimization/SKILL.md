---
name: cuda-optimization
description: "CUDA: SM/warp/block, memory hierarchy, coalescing."
license: MIT
compatibility: opencode
---

# CUDA Optimization

## Thread Hierarchy

- Thread → Warp (32 threads) → Block → Grid.
- SM count varies by GPU (A100: 108 SMs, H100: 132 SMs, RTX 4090: 128 SMs).
- Block size must be multiple of 32 (warp). Occupancy = warps_per_sm / max_warps_per_sm.
- `nvcc -arch=sm_80` for A100; `-arch=sm_75` for Turing; check with `deviceQuery`.

## Memory Hierarchy

- Global memory: 100s GB/s. Coalesce: consecutive threads → consecutive 128-byte segments.
- Shared memory: 164KB per SM (A100). Bank conflicts if 32-bit words map to same bank.
- L1: 192KB/shared or 192KB/L1 per SM. `__ldg()` for read-only cache.
- Constant/Texture memory: cached, broadcast to warp.

## Occupancy & Launch Bounds

- `cudaFuncGetAttributes` or `--ptxas-options=-v` to check register/shared usage.
- Max 64KB shared memory per block. Max 1024 threads per block.
- Use `__launch_bounds__(maxThreadsPerBlock)` to control register spilling.
- `cudaOccupancyMaxActiveBlocksPerMultiprocessor` to measure occupancy.

## Streams & Concurrency

- Streams for overlapping compute and memory transfers: `cudaMemcpyAsync`.
- `cudaStreamSynchronize` vs `cudaDeviceSynchronize`.
- Events: `cudaEventRecord` + `cudaEventElapsedTime` for timing.

## ML Libraries

- cuBLAS: `cublasSgemm`, `cublasGemmEx` for mixed precision (FP16/BF16/TF32).
- cuDNN: convolution, pooling, activation, LSTM. Prefer `cudnnConvolutionForward`.
- NCCL: multi-GPU communication. Use `ncclCommInitRank` + `ncclAllReduce`.

## Profiling

- `nsight-compute` for kernel-level profiling. `nsight-systems` for timeline.
- Metrics: achieved_occupancy, smsp__throughput, gld_throughput, dst_throughput.
- `--metrics all` or specific metrics: `smsp__inst_executed.sum`, `l1tex__t_bytes`.
