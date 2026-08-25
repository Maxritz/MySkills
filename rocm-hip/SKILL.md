---
name: rocm-hip
description: "ROCm/HIP: GPU code, CUDA migration."
license: MIT
compatibility: opencode
---

# AMD ROCm & HIP

## HIP vs CUDA

- HIP is source-portable. Use `hipify-perl` or `hipify-cuda` to convert CUDA → HIP.
- CUDA → HIP type mapping: `cudaStream_t` → `hipStream_t`, `cudaEvent_t` → `hipEvent_t`.
- API parity: 95% of CUDA kernels convert trivially. 5% need manual porting (shared memory config, texture refs).

## Memory Management

- `hipMalloc(&ptr, size)` — device memory (4KB page aligned).
- `hipMemcpy(dst, src, size, kind)` — `hipMemcpyHostToDevice`, `hipMemcpyDeviceToHost`.
- `hipMallocManaged(&ptr, size)` — unified memory (use sparingly).
- `hipFree(ptr)` — must be called on host; device pointer not valid in kernel.
- `hipMemset(ptr, 0, size)` — memset device memory.

## Kernel Launch

- `hipLaunchKernelGGL(kernel, dim3(grid), dim3(block), 0, stream, args...)` — preferred syntax.
- `hipModuleLaunchKernel` — lower-level, for dynamic loading.
- `hipGetLastError()` — check after kernel launch for launch failures.
- `hipPeekAtLastError()` — check without resetting.

## Device Functions

- `__global__` — kernel function (runs on device).
- `__device__` — called from device, runs on device.
- `__host__` — runs on host (default).
- `__forceinline__` — force inlining in device code (avoid function call overhead).

## Performance Portability

- Check `hipGetDeviceProperties` for compute capability (`hipDeviceProp_t.major.minor`).
- HIP_VISIBLE_DEVICES env var to select GPU. HIP_ACCELERATORS for specific chip.
- Use `hipModuleLoad` for dynamic kernel loading from PTX.
- AMD GPU: use `__builtin_amdgcn_*` intrinsics for low-level ops.
- Branch divergence: keep warps/waves in lockstep; use arithmetic instead of branches.
