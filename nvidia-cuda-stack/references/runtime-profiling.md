# NVIDIA CUDA: Runtime, Profiling and Library Recipes

Load only the runtime or profiler section needed for the current investigation. Pin GPU, driver, CUDA, compiler and library versions before applying commands.

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
