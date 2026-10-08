---
name: nvidia-cuda-stack
description: "Unified NVIDIA CUDA stack: runtime, driver, streams, graphs, memory, kernels, profiling. Develop, debug, optimize across Hopper, Blackwell, Ampere."
compatibility: opencode
metadata:
  loading: on-demand
  auto_trigger: true
  trigger_keywords: ["CUDA", "NVIDIA", "H100", "H200", "B200", "GB200", "A100", "RTX 4090", "PTX", "SASS", "Nsight", "cuBLAS", "cuDNN", "NCCL", "TensorRT"]
---

# NVIDIA CUDA Stack

**Unified across runtime, architecture, and tooling layers.**

## Layer Map

| Layer | Focus | When to Use |
|-------|-------|-------------|
| **Runtime/Driver** | Streams, events, graphs, memory, error handling | API correctness, sync, memory lifetime |
| **Architecture (Hopper/Blackwell)** | Tensor cores, TMA, cluster, NVLink, MIG | Kernel optimization, MFMA, FP8/FP4 |
| **Architecture (Ampere)** | Tensor cores, sparse, async copy | A100/RTX 30/40 optimization |
| **Tooling** | Nsight Compute, Nsight Systems, CUPTI | Profiling, tracing, bottleneck analysis |
| **Libraries** | cuBLAS, cuDNN, NCCL, CUTLASS, TensorRT | Primitive selection, quantization, serving |

---

## 1. Runtime/Driver Layer

### Mandatory Recording
```
CUDA Toolkit: 12.6 / 12.8
Driver: 560.x (Linux) / 565.x (Windows)
GPU: H100 (CC 9.0) / H200 / B200 (CC 10.0) / RTX 4090 (CC 8.9)
Arch: sm_90 / sm_100 / sm_89
Compiler: nvcc 12.6 / nvrtc / clang++ --cuda-path
Exact command: nvcc -O3 -arch=sm_90 -std=c++17 kernel.cu -o kernel
```

### Hypothesis Separation

| Category | Checks |
|----------|--------|
| **API Correctness** | `cudaGetLastError`, stream/event ordering, device visibility, peer access |
| **Kernel Correctness** | Numerical diff vs reference, `cuda-memcheck`, `compute-sanitizer`, racecheck |
| **Synchronization** | Stream/event/barrier ordering, graph capture constraints, host-device sync |
| **Memory** | Lifetime, aliasing, alignment, unified memory migration, P2P |
| **Performance** | Occupancy, register pressure, shared memory, L2/cache, launch overhead |

### Inspection Checklist (Before Code Changes)
- [ ] `nvidia-smi` — driver, GPU, compute mode, MIG, ECC, power, clocks
- [ ] `nvcc --version` / `nvidia-smi` CUDA version match
- [ ] Device query — CC, SMs, registers, shared mem, L2, tensor cores
- [ ] `cudaOccupancyMaxActiveBlocksPerMultiprocessor` for baseline
- [ ] Profiler — `nsys profile` (system) / `ncu` (kernel) for baseline

### Primitive Preference
```
Prefer: cuBLASLt GEMM → cublasLtMatmul (FP8/BF16/TF32)
Over:   hand-written GEMM kernel
Unless: custom tile/quantization/epilogue not supported

Prefer: NCCL AllReduce → ncclAllReduce (LL128, tree, ring)
Over:   custom collective
Unless: topology-aware or non-standard reduction
```

### Validation Gates
1. **Correctness fixture** — deterministic input → bit-exact reference (FP64/FP32) or tolerance (FP16/BF16/FP8)
2. **Sanitizer evidence** — `compute-sanitizer --tool=memcheck --tool=racecheck` clean
3. **Workload benchmark** — end-to-end latency/throughput vs baseline

---

## 2. Hopper Architecture (H100/H200, CC 9.0)

### Key Features
| Feature | Spec |
|---------|------|
| **SMs** | 132 (H100) / 142 (H200) |
| **Tensor Cores** | 4th gen: FP8, BF16, FP16, TF32, FP64 |
| **FP8** | E4M3 + E5M2, 2x FP16 throughput |
| **TMA** | Tensor Memory Accelerator — async copy global↔shared |
| **Cluster** | Thread block clusters (up to 8 blocks), multicast |
| **NVLink 4.0** | 900 GB/s GPU-GPU, 7 NVLinks |
| **MIG** | Up to 7 instances, dedicated resources |
| **HBM3** | 3 TB/s (H100) / 4.8 TB/s (H200) |

### MFMA / Tensor Core Instructions (PTX)

```ptx
// mma.sync.aligned.m16n8k16.row.col.f16.f16.f16.f16
// D = A * B + C (FP16 accumulation)
mma.sync.aligned.m16n8k16.row.col.f16.f16.f16.f16
    {d0, d1, d2, d3}, {a0, a1, a2, a3}, {b0, b1}, {c0, c1, c2, c3};

// FP8 (Hopper+)
mma.sync.aligned.m16n8k16.row.col.f8.f8.f16.f16
    {d0, d1, d2, d3}, {a0, a1}, {b0}, {c0, c1, c2, c3};

// CUTLASS usage (recommended)
#include <cutlass/gemm/device/gemm_universal.h>
using Gemm = cutlass::gemm::device::GemmUniversal<
    cutlass::gemm::kernel::GemmUniversal<
        cutlass::half_t, cutlass::layout::RowMajor,
        cutlass::half_t, cutlass::layout::ColumnMajor,
        cutlass::half_t, cutlass::layout::RowMajor,
        cutlass::half_t, cutlass::arch::OpClassTensorOp,
        cutlass::arch::Sm90>;
```

### TMA (Tensor Memory Accelerator)

```cpp
// Async copy from global to shared memory
// Requires cluster launch: <<<grid, block, 0, stream, cluster>>>
__builtin_nvvm_tma_load_async_shared_2d(
    shared_ptr, global_ptr,
    /*dim_x=*/128, /*dim_y=*/64, /*stride=*/global_stride
);
// Wait for completion
__builtin_nvvm_tma_wait();
```

### Cluster Launch

```cpp
// Launch with cluster size (e.g., 2x2x1 = 4 blocks)
cudaLaunchConfig_t config = {0};
config.gridDim = dim3(grid_x, grid_y, grid_z);
config.blockDim = dim3(256, 1, 1);
config.dynamicSmemBytes = shared_mem_size;
config.attrs = cudaLaunchAttributeClusterDimension;
config.clusterDim = dim3(2, 2, 1);  // 4-block cluster
cudaLaunchKernelEx(&config, kernel, args...);
```

### Multi-GPU (NCCL)

```cpp
// Initialize
ncclCommInitRank(&comm, nGPUs, comm_id, rank);

// AllReduce (FP8/BF16 supported)
ncclAllReduce(sendbuff, recvbuff, count, ncclBfloat16, ncclSum, comm, stream);

// NVLS (NVLink Sharps) for tree reduction
// Set NCCL_NVLS_ENABLE=1 for Hopper
```

---

## 3. Blackwell Architecture (B200/GB200, CC 10.0)

### Key Features
| Feature | Spec |
|---------|------|
| **SMs** | 192 (B200) |
| **Tensor Cores** | 5th gen: FP4, FP6, FP8, BF16, FP16, TF32 |
| **FP4/FP6** | Micro-scaling (MXFP4/MXFP6) — 2-4x FP8 throughput |
| **TMA** | Enhanced — multicast, tensor map |
| **Cluster** | Up to 16 blocks, flexible shape |
| **NVLink 5.0** | 1.8 TB/s GPU-GPU (GB200: 18 NVLinks) |
| **NVLink Switch** | NVLink Switch System (72 GPUs, 130 TB/s) |
| **HBM3E** | 8 TB/s (B200) |
| **Decompression** | Hardware LZ4/Deflate engine |

### FP4/FP6 (Microscaling)

```cpp
// MXFP4: 4-bit mantissa + shared 8-bit scale per block
// CUTLASS 3.5+ supports MXFP4
using Gemm = cutlass::gemm::device::GemmUniversal<
    cutlass::gemm::kernel::GemmUniversal<
        cutlass::mxf4_t, cutlass::layout::RowMajor,  // MXFP4
        cutlass::mxf4_t, cutlass::layout::ColumnMajor,
        cutlass::half_t, cutlass::layout::RowMajor,  // FP16 accumulation
        cutlass::half_t, cutlass::arch::OpClassTensorOp,
        cutlass::arch::Sm100>;
```

### GB200 NVL72 System

```
72 GPUs (36 Grace CPUs + 36 B200 GPUs)
NVLink Switch: 130 TB/s all-to-all
NVLink-C2C: 900 GB/s CPU-GPU coherent
Unified memory: 30 TB/s fabric
```

---

## 4. Ampere Architecture (A100/RTX 30/40, CC 8.0/8.6/8.9)

### Key Features
| Feature | A100 (8.0) | RTX 3080/3090 (8.6) | RTX 4090 (8.9) |
|---------|------------|---------------------|----------------|
| **SMs** | 108 | 68-82 | 128 |
| **Tensor Cores** | 3rd gen | 3rd gen | 4th gen |
| **FP8** | No | No | Yes (Ada) |
| **Sparse** | 2:4 structured | 2:4 structured | 2:4 structured |
| **Async Copy** | TMA (limited) | TMA (limited) | TMA |
| **NVLink** | 600 GB/s (NVLink 3) | No | No |

### Structured Sparsity (2:4)

```cpp
// 2:4 sparse pattern: 2 non-zero per 4 elements
// cuBLASLt: CUBLASLT_MATRIX_TRANSFORM_SPARSE_2_4
// cublasLtMatmul with sparse A matrix
cublasLtMatmul(..., CUBLASLT_POINTER_MODE_DEVICE, ...);
```

---

## 5. Profiling & Tooling

### Nsight Systems (System-level)
```bash
# System trace: CPU/GPU timeline, kernels, memcpys, NVTX
nsys profile -o trace ./app
nsys stats trace.nsys-rep --report gpukernsum,gpumemtimesum

# Key metrics: kernel duration, launch gap, memcpy overlap, SM utilization
```

### Nsight Compute (Kernel-level)
```bash
# Kernel deep-dive: occupancy, registers, shared mem, memory throughput, compute throughput
ncu --set full -o kernel_log ./app
ncu --import kernel_log.ncu-rep --log-file kernel_log.txt

# Key sections:
# 1. GPU Speed of Light — achieved vs theoretical
# 2. Occupancy — achieved vs theoretical, limiting factor
# 3. Memory Throughput — L1/TEX, L2, DRAM
# 4. Compute Throughput — SM, Tensor Core utilization
# 5. Launch Statistics — grid/block, registers, shared mem
```

### CUPTI (Custom Tooling)
```c
// Callback API for custom profiling
cuptiSubscribe(&subscriber, (CUpti_CallbackFunc)callback, userdata);
cuptiEnableCallback(1, subscriber, CUPTI_CB_DOMAIN_DRIVER_API, CUPTI_DRIVER_API_CUDA_LAUNCH_KERNEL);
// Capture: kernel name, grid/block, stream, correlation ID
```

---

## 6. Libraries & Serving

| Library | Purpose | Key API |
|---------|---------|---------|
| **cuBLASLt** | GEMM with FP8/BF16/TF32, epilogue | `cublasLtMatmul` |
| **cuDNN** | Convolution, pooling, RNN | `cudnnConvolutionForward` |
| **NCCL** | Multi-GPU collectives | `ncclAllReduce`, `ncclAllGather` |
| **CUTLASS** | Template GEMM, FP8/FP4, TMA, cluster | `cutlass::gemm::device::GemmUniversal` |
| **TensorRT** | Engine build, quantization, serving | `IBuilder`, `ICudaEngine` |
| **Triton** | Model serving, Python backend | `model.py`, `config.pbtxt` |

---

## Cross-Layer Workflow

### For Performance Issues
1. **Runtime** → Verify stream/event/graph ordering, memory lifetime
2. **Nsight Systems** → System timeline: launch gaps, memcpy overlap, SM utilization
3. **Nsight Compute** → Kernel deep-dive: occupancy, tensor core %, memory BW
4. **Architecture** → Apply Hopper/Blackwell/Ampere specific optimizations

### For Correctness Issues
1. **Runtime** → `cudaGetLastError` after every call, stream sync points
2. **Sanitizers** → `compute-sanitizer --tool=memcheck --tool=racecheck`
3. **Architecture** → Check alignment, shared memory bank conflicts, warp divergence

### For Porting (CUDA → HIP/ROCm)
1. **hipify** → Automated translation
2. **Architecture** → Replace PTX/SASS with `__builtin_amdgcn_*` or vendor intrinsics
3. **Libraries** → cuBLAS → rocBLAS, cuDNN → MIOpen, NCCL → RCCL
4. **Runtime** → CUDA stream/event → HIP stream/event (mostly 1:1)

---

## Validation Matrix

| Layer | Correctness | Performance | Porting |
|-------|-------------|-------------|---------|
| **Runtime** | Sanitizers + deterministic fixture | nsys/ncu baseline | hipify + API map |
| **Hopper** | FP8/FP16 diff vs ref | Tensor core %, TMA overlap, NVLink BW | MFMA → MFMA |
| **Blackwell** | FP4/FP6 diff vs ref | MXFP4 throughput, NVLink 5.0 | New ISA |
| **Ampere** | Sparsity pattern verify | Structured sparse speedup | Sparsity → AMD equivalent |
| **Libraries** | Numerical tolerance | Primitive latency vs hand-written | cuBLAS→rocBLAS, etc. |

---

## Output Report

```
NVIDIA CUDA STACK: <layer> ANALYSIS
RECORDED: CUDA <ver>, Driver <ver>, GPU <model> (CC <n>), OS <ver>
LAYER: <runtime|hopper|blackwell|ampere|tooling|libraries>
FINDINGS: <ranked issues with evidence>
PRIMITIVE SWAPS: <cuBLASLt/NCCL/CUTLASS used vs hand-written>
ARCH OPTIMIZATIONS: <tensor core tiles, TMA, cluster, sparsity>
VALIDATION: correctness✅/❌ sanitizer✅/❌ benchmark✅/❌
BLOCKERS: <unsupported CC, missing primitives, driver bugs>
```

---

## Boundaries

- Does not write kernel code (receives kernels to validate/optimize)
- Does not manage CUDA installation (system admin task)
- `stop nvidia-cuda-stack`: revert.