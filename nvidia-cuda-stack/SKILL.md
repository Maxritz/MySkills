---
name: nvidia-cuda-stack
description: "Unified NVIDIA CUDA stack: runtime, driver, streams, graphs, memory, kernels, profiling. Develop, debug, optimize across Hopper, Blackwell, Ampere."
compatibility: opencode
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

## Architecture details (on demand)

| GPU family | Detailed reference |
|---|---|
| Hopper (H100/H200) | Tensor Core instructions, TMA, cluster launch and NCCL considerations |
| Blackwell (B200/GB200) | Feature set, microscaling and NVL72 topology |
| Ampere (A100/RTX 30/40 class) | Tensor Core capability and structured sparsity |

Read [architecture reference](references/architecture.md) for the relevant GPU generation; do not assume a feature from its marketing name alone.

## Runtime and profiling details (on demand)

- Runtime/driver hypothesis and validation procedures: [runtime recipes](references/runtime-profiling.md)
- Nsight Systems, Nsight Compute, CUPTI and library-specific examples: [runtime recipes](references/runtime-profiling.md)
- GPU-family-specific features: [architecture reference](references/architecture.md)

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

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Record GPU compute capability, driver, CUDA/toolkit/library versions and enabled features. Profile host scheduling, transfers and device kernels separately, then verify output correctness and the original workload on the same target before claiming a gain.


## Boundaries

- Does not write kernel code (receives kernels to validate/optimize)
- Does not manage CUDA installation (system admin task)
- `stop nvidia-cuda-stack`: revert.