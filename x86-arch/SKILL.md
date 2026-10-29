---
name: x86-arch
description: "x86-64 architecture deep-dive: ISA contracts, memory ordering, atomicity, privilege, paging, interrupts, CPUID, SIMD (AVX-512/AVX2/SSE), performance analysis with perf. Microarchitectural vs architectural guarantees."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  trigger_keywords: ["x86-64", "ISA", "memory ordering", "TSO", "atomicity", "privilege", "paging", "interrupts", "CPUID", "SIMD", "AVX-512", "AVX2", "SSE", "perf", "top-down", "branch prediction", "cache hierarchy"]
---

# x86-64 Architecture Deep-Dive

**ISA contracts vs microarchitectural observations. Record vendor, family/model/stepping, OS, mode, ABI, and enabled features.**

---

## ISA Contracts (Guaranteed by Architecture)

| Guarantee | Description |
|-----------|-------------|
| **Memory ordering** | TSO (Total Store Order): stores not reordered with loads, loads not reordered with stores |
| **Atomicity** | Aligned 8/16/32/64-bit loads/stores atomic |
| **Privilege** | Ring 0 (kernel) vs Ring 3 (user), SMEP/SMAP |
| **Paging** | 4-level, 4KB/2MB/1GB pages, NX, PCID, ASID |
| **Interrupts** | IDT, IST, APIC, TPR, EOI |
| **CPUID** | Feature enumeration, vendor, family/model/stepping |

## Microarchitectural Observations (Not Guaranteed)

| Behavior | Varies By | Measure With |
|----------|-----------|--------------|
| **Cache hierarchy** | L1/L2/L3 size, associativity, latency | `perf stat -e cache-references,cache-misses` |
| **Branch prediction** | BTB size, RAS, indirect predictor | `perf stat -e branch-misses` |
| **SIMD throughput** | AVX-512 vs AVX2 vs SSE, port contention | `perf stat -e fp_arith_inst_retired.*` |
| **Memory bandwidth** | Channel count, DDR version, NUMA | `perf stat -e mem_load_retired.*` |

## SIMD (AVX-512 / AVX2 / SSE)

```c
// AVX-512: 512-bit = 16 float32 / 8 float64 / 64 int8
#include <immintrin.h>

// FMA: a * b + c (single rounding)
__m512 a = _mm512_loadu_ps(ptr_a);
__m512 b = _mm512_loadu_ps(ptr_b);
__m512 c = _mm512_loadu_ps(ptr_c);
__m512 d = _mm512_fmadd_ps(a, b, c);  // d = a*b + c
_mm512_storeu_ps(ptr_d, d);

// Masked operations (avoid branches)
__mmask16 mask = _mm512_cmp_ps_mask(a, b, _CMP_GT_OQ);
__m512 result = _mm512_mask_add_ps(_mm512_setzero_ps(), mask, a, b);

// Capability check
bool has_avx512f = false;
uint32_t eax, ebx, ecx, edx;
__cpuid_count(7, 0, eax, ebx, ecx, edx);
has_avx512f = (ebx & (1 << 16)) != 0;

// Fallback
if (has_avx512f) { kernel_avx512(); }
else { kernel_avx2(); }
```

## Performance Analysis

```bash
# Top-down analysis (Intel)
perf stat -e cycles,instructions,cache-references,cache-misses,branch-misses ./app

# Detailed pipeline
perf stat -e \
  cpu/cycles/,cpu/instructions/,cpu/branch-misses/,cpu/cache-misses/, \
  cpu/L1-dcache-load-misses/,cpu/LLC-load-misses/, \
  cpu/stall-cycles-frontend/,cpu/stall-cycles-backend/ ./app

# Per-function
perf record -g ./app
perf report --stdio
```

## Validation Gates

| Gate | Tool |
|------|------|
| **Feature check** | CPUID enumeration before use |
| **Fallback** | Scalar path for unsupported ISA |
| **Alignment** | 64-byte for AVX-512, 32-byte for AVX2 |
| **Unwind** | DWARF CFI for asm functions |

## Boundaries

- Does not write Linux kernel modules (see `linux-kernel-dev`)
- Does not write bare-metal kernels (see `bare-metal-kernel`)
- Does not cover memory management (see `memory-mgmt`)
- Does not cover SIMD kernel optimisation (see `nvidia-cuda-stack`/`amd-gpu-stack`)
- `stop x86-arch`: revert.