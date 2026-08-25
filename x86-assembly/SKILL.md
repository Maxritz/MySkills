---
name: x86-assembly
description: "x86-64: registers, AVX-512, cache optimization."
license: MIT
compatibility: opencode
---

# x86 Assembly

## Registers (x86-64)

- General: RAX, RBX, RCX, RDX, RSI, RDI, RBP, RSP + R8-R15.
- Calling convention (System V AMD64): RDI, RSI, RDX, RCX, R8, R9 for args; XMM0-7 for floats.
- Calling convention (Windows x64): RCX, RDX, R8, R9 for args; stack for rest.

## Intrinsics

- `<immintrin.h>` for AVX-512, AVX2, SSE. Check CPUID at runtime before use.
- `_mm256_*`, `_mm512_*` for SIMD. Align data to 32/64-byte boundaries.
- Never mix intrinsics from different ISAs in the same function.
- `_mm_malloc` / `_mm_free` for aligned allocations.

## Cache Optimization

- L1d: 32KB, L2: 256KB-1MB, L3: shared. Cache line = 64 bytes.
- Access patterns: sequential > strided > random. Prefetch with `_mm_prefetch`.
- Avoid false sharing: pad structures to cache line boundaries (64 bytes).

## Inline Assembly

- GCC/Clang: `__asm__ __volatile__("..." : outputs : inputs : clobbers)`
- MSVC: `__asm { ... }` (x86 only; x64 requires intrinsics)
- Always mark `memory` clobber if asm reads/writes memory not in operands.

## Performance

- Instruction tables: Agner Fog's optimization manuals. Latency vs throughput.
- `rep movsb` for large copies (often beats `memcpy`).
- Benchmark with `rdtsc` or `perf stat`. Disable CPU frequency scaling.
