---
name: amd-gpu-stack
description: "Unified AMD GPU stack: ROCm/HIP platform, ROCr/HSA runtime, CDNA/RDNA architectures. Develop, debug, profile, optimize across MI200/MI300 and RX 6000/7000."
compatibility: opencode
metadata:
  loading: on-demand
  auto_trigger: true
  trigger_keywords: ["AMD GPU", "ROCm", "HIP", "HSA", "ROCr", "CDNA", "RDNA", "MI200", "MI300", "RX 6000", "RX 7000", "rocBLAS", "RCCL", "rocprof", "rocminfo"]
---

# AMD GPU Stack

**Unified across platform, runtime, and architecture layers.** Choose the layer matching your issue; don't preload all.

## Layer Map

| Layer | Skill | When to Use |
|-------|-------|-------------|
| **Platform/Library** | `rocm-stack` | rocBLAS, RCCL, rocprof, rocminfo, HIP API, packaging |
| **Runtime** | `rocr-runtime` | HSA agents, queues, AQL packets, signals, memory pools, code objects |
| **Architecture (CDNA)** | `cdna` | MI200/MI300: matrix cores, MFMA, multi-GPU (RCCL), HSA memory pools |
| **Architecture (RDNA)** | `rdna` | RX 6000/7000: wave32, LDS, VGPR/SGPR, Infinity Cache, HIP translation |

---

## 1. Platform/Library Layer (rocm-stack)

### Mandatory Recording
```
ROCm release/channel: 6.3.0 (Linux stable) / 10.1 (Windows, maps to 7.16 internals)
GPU ASIC: MI300X (gfx942) / RX 7900 XTX (gfx1103)
OS: Ubuntu 24.04 / RHEL 9 / Windows 11 (ROCm 10.1 fully supported)
Compiler: amdclang++ 18.1.8 / hipcc / MSVC + clang-cl
HIP target: --offload-arch=gfx942 / gfx1103
Exact command: hipcc -O3 -fPIC kernel.hip -o kernel
```

### Windows ROCm 10.1 Notes
- **ROCm 10.1 on Windows** = internal 7.16 runtime, fully supported for most features
- Supported: HIP runtime, hipBLAS, hipFFT, hipSPARSE, RCCL, rocRAND, rocThrust
- Limited: rocprofiler (partial), roctracer, some HSA extensions
- Driver: AMD Adrenalin 24.x+ / ROCm-specific driver package
- Build: `hipcc` with MSVC backend or `clang-cl`; CMake `-DCMAKE_CXX_COMPILER=clang-cl`
- Test: `hipcc --version` shows `HIP version: 10.1` / `ROCR version: 7.16`

### Hypothesis Separation
| Category | Checks |
|----------|--------|
| **API Correctness** | HIP error codes, stream/event ordering, device visibility |
| **Kernel Correctness** | Numerical diff vs reference, race checks (rocprof --race), memory sanitizers |
| **Synchronization** | Stream/event/barrier ordering, graph capture constraints, host-device sync |
| **Performance** | Occupancy, register pressure, shared memory, memory transactions, launch overhead |

### Inspection Checklist (Before Code Changes)
- [ ] `rocminfo` — agents, ISA targets, memory pools, cache topology
- [ ] Device libraries — code-object targets match GPU
- [ ] Clocks — `rocm-smi -c` (SCLK/MCLK), throttling check
- [ ] Topology — P2P links, NUMA affinity, `rocm-smi --showtopo`
- [ ] Profiler — `rocprof --kernel-trace --dispatch-trace` for baseline

### Primitive Preference
```
Prefer: rocBLAS GEMM → hipblasSgemmStridedBatched
Over:   hand-written GEMM kernel
Unless: MFMA tile size/quantization not supported
```

### Validation Gates
1. **Correctness fixture** — deterministic input → bit-exact reference output
2. **Sanitizer/profiler evidence** — `ASan` + `rocprof --race` clean
3. **Workload benchmark** — end-to-end latency/throughput vs baseline

### Version Policy
Read `_systems-ml-shared/version-policy.md`. Never conflate:
- Packaged ROCm (e.g., `rocm-6.3.0`) ≠ TheRock component versions
- Git tags (e.g., `rocm-6.3.x`) ≠ release tarballs

---

## 2. Runtime Layer (rocr-runtime)

### HSA Agent & Queue Model
```
Agent: GPU (gfx942)
  Queue: COMPUTE (AQL)
    Packet: KERNEL_DISPATCH
      → Signal: completion (TS: 0xdeadbeef)
      → Memory: fine-grained VRAM pool (HSA_AMD_AGENT_MEMORY_POOL_FINE_VRAM)
```

### Diagnostic Checklist
| Element | Verify |
|---------|--------|
| **Agents** | `hsa_iterate_agents` — correct GPU discovered |
| **ISA/Code Object** | `hsa_agent_get_info` — code-object target matches GPU |
| **Queue Type** | COMPUTE vs SDMA vs COMPUTE_AQL — correct for workload |
| **Packet Ownership** | Header `acquire`/`release` fences match signal lifecycle |
| **Signal Lifecycle** | Create → wait → destroy; no double-wait, no use-after-destroy |
| **Memory Pool** | FINE_VRAM for device-local; COARSE for host-visible |
| **Alignment** | Kernarg 16B-aligned; buffers per HSA spec |

### Trace Ordering
```
Acquire fence → Write packet → Ring doorbell → Signal wait → Release fence
```
Check: lifetime, alignment, visibility, timeout assumptions.

### Reduction Protocol
Reduce to smallest queue/memory operation reproducing behavior:
1. Single kernel dispatch
2. Single memory copy (H2D/D2H/P2P)
3. Single signal wait

### Validation
- Known-good runtime path comparison
- Exact GPU/driver/runtime combination
- Report unsupported combos explicitly

---

## 3. CDNA Architecture (MI200/MI300)

### Compute Units & Matrix Cores

| Generation | CUs/CGs | Matrix Cores | FP64:FP32 | Wave |
|------------|---------|--------------|-----------|------|
| **CDNA2 (MI200)** | 110-120 | 2x per CU | 1:2 | Wave64 (FP64), Wave32 (FP32) |
| **CDNA3 (MI300)** | 133 CGs | 512 AI accelerators | 2.4:1 | Wave32 preferred |

### MFMA Instructions (FP16/BF16/FP8)

```cpp
// 16x16x16 FP16 matrix multiply-accumulate
// a: 16x16 (A), b: 16x16 (B), c: 16x16 (acc)
// Result in c (FP32 accumulation)
v_mfma_f32_16x16x16_f16(a, b, c);

// Intrinsics
__builtin_amdgcn_wave32_mfma_f32_16x16x16_f16(a, b, c, 0, 0, 0);
```

### Tile Sizes & Precision

| Precision | Tile | Accumulation | Use Case |
|-----------|------|--------------|----------|
| FP16 | 16x16x16 | FP32 | Training, inference |
| BF16 | 16x16x16 | FP32 | Training (stable) |
| FP8 (E4M3/E5M2) | 16x16x16 | FP32 | Inference (H100/MI300) |
| INT8 | 16x16x16 | INT32 | Quantized inference |

**Transpose A matrix** for optimal memory access pattern.

### Multi-GPU Communication (RCCL)

```cpp
// Initialize
rcclCommInitRank(&comm, nGPUs, comm_id, rank);

// AllReduce
rcclAllReduce(sendbuff, recvbuff, count, rcclFloat, rcclSum, comm, stream);

// Cleanup
rcclCommDestroy(comm);
```

### Memory Management

| Pool | Use Case | Allocation |
|------|----------|------------|
| `HSA_AMD_AGENT_MEMORY_POOL_FINE_VRAM` | Device-local, kernel args, weights | `hipMalloc` (4GB page alignment on MI200+) |
| `hipHostMalloc` | Pinned host memory (DMA) | `hipHostMalloc(&ptr, size, hipHostMallocDefault)` |
| `hipMallocManaged` | Unified memory (caution: migration overhead) | `hipMallocManaged(&ptr, size)` |
| 2D/3D copy | Non-contiguous layouts | `hipMemcpy2D`, `hipMemcpy3D` |

### Profiling & Tuning

| Tool | Metrics |
|------|---------|
| `rocprof` | `gpu__compute_memory_commands_started`, `gpu__compute_unit_busy` |
| `rocgdb` | Kernel debugging, breakpoints |
| `rocm-smi` | `GPU use %`, `Temp`, `SCLK/MCLK`, throttling |
| `mi250_profile_analysis` | Post-processing, bottleneck identification |

**Clock throttling check:** `rocm-smi` — if `GPU use %` high but `SCLK` low → thermal/power limit.

---

## 4. RDNA Architecture (RX 6000/7000)

### Compute Units

| Generation | CUs | Key Features |
|------------|-----|--------------|
| **RDNA1** | 64 | 4 SIMDs/CU, 16 threads/wave, 1024 threads/block |
| **RDNA2** | 40 (6800 XT) | Infinity Cache (128MB), Wave32 default |
| **RDNA3** | Dual-issue | Chiplet, AI accelerator (Matrix Core) |

### Register File

| Type | Count | Size | Purpose |
|------|-------|------|---------|
| **SGPR** | 104/CU | 32-bit | Control flow, addresses, scalar values |
| **VGPR** | 256KB/CU | 32-bit dword | Vector operands, per-thread data |
| **LDS** | 32KB/CU | — | Shared memory, cross-thread comm |

### Memory Hierarchy

```
Global (256-bit/channel) → L2 (shared, 1-4MB) → L1 (16KB/CU unified) → Infinity Cache (128MB, RDNA2/3)
```

### Instruction Set (GFX10/GFX11)

| Category | Examples |
|----------|----------|
| **VOP (Vector ALU)** | `v_add_u32`, `v_mul_lo_i32`, `v_fma_f32` |
| **SOP (Scalar ALU)** | `s_add`, `s_bfe`, `s_mov` |
| **DPP (Data Parallel Primitives)** | Cross-lane ops: `v_perm_b32`, `v_readlane` |
| **Barriers** | `s_waitcnt vmcnt(0)`, `lgkmcnt(0)`, `vscnt(0)` |
| **Branch** | `s_cbranch_vccz`, `s_swappc` (calls) |

### HIP Translation (CUDA → HIP)

| CUDA | HIP | Notes |
|------|-----|-------|
| `__syncthreads()` | `__syncthreads()` | Same |
| `blockIdx.x` | `blockIdx.x` | Same |
| `threadIdx.x` | `threadIdx.x` | Same |
| `__ldg()` | `__ldg()` | Same |
| `cudaMalloc` | `hipMalloc` | Same |
| `cudaMemcpy` | `hipMemcpy` | Same |
| PTX asm | `__builtin_amdgcn_*` | AMD intrinsics |

**hipify tool:** `hipify-perl` converts CUDA → HIP. Most intrinsics map directly.

### Profiling

| Tool | Purpose |
|------|---------|
| `rocprof` / `rocgdb` | Profiling, debugging |
| `rocminfo` | List GPUs, ISA targets |
| `rocm-smi` | Runtime metrics, clocks, power |
| `hipEventRecord` + `hipEventElapsedTime` | Kernel timing |

---

## Cross-Layer Workflow

### For Performance Issues
1. **rocr-runtime** → Verify queue/packet/signal ordering, memory pool
2. **rocm-stack** → Check HIP API usage, rocBLAS/RCCL primitives
3. **cdna/rdna** → Analyze occupancy, register pressure, MFMA utilization, cache behavior

### For Correctness Issues
1. **rocr-runtime** → Reduce to minimal AQL packet sequence
2. **rocm-stack** → Validate HIP error codes, stream sync
3. **cdna/rdna** → Check alignment, wave size, MFMA tile correctness

### For Porting (CUDA → HIP)
1. **hipify** → Automated translation
2. **rdna/cdna** → Replace PTX with `__builtin_amdgcn_*`
3. **rocr-runtime** → Verify HSA queue/signal model
4. **rocm-stack** → Swap cuBLAS/cuDNN → rocBLAS/MIOpen

---

## Validation Matrix

| Layer | Correctness | Performance | Porting |
|-------|-------------|-------------|---------|
| **Platform** | Deterministic fixture + ASan | rocprof trace + benchmark | hipify + primitive swap |
| **Runtime** | Minimal AQL trace vs known-good | Queue depth, signal latency | HSA queue model |
| **CDNA** | MFMA tile diff vs reference | Occupancy, MFMA %, memory BW | FP64/FP32 wave selection |
| **RDNA** | Wave32/64 correctness | LDS/VGPR pressure, Infinity Cache hit | HIP translation verification |

---

## Output Report

```
AMD GPU STACK: <layer> ANALYSIS
RECORDED: ROCm <ver>, GPU <ASIC>, OS <ver>, HIP target <arch>
LAYER: <platform|runtime|cdna|rdna>
FINDINGS: <ranked issues with evidence>
PRIMITIVE SWAPS: <rocBLAS/RCCL used vs hand-written>
ARCH OPTIMIZATIONS: <MFMA tiles, wave size, LDS usage>
VALIDATION: correctness✅/❌ sanitizer✅/❌ benchmark✅/❌
BLOCKERS: <unsupported combos, missing primitives>
```

---

## Boundaries

- Does not write kernel code (receives kernels to validate/optimize)
- Does not manage ROCm installation (system admin task)
- `stop amd-gpu-stack`: revert.