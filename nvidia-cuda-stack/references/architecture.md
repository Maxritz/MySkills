# NVIDIA CUDA: Architecture Reference

Load the target GPU generation section when choosing features, precision modes or instruction-level strategy. Architecture labels are examples; verify compute capability, toolkit and library support against the installed target.

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
