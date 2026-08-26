---
name: x86-architecture
description: Analyze or optimize x86/x86-64 ISA, privilege, paging, caches, SIMD, atomics, CPUID, virtualization, ABI, and performance behavior.
---

# x86 architecture

Separate architectural guarantees from microarchitectural observations. Record vendor, family/model/stepping, OS, mode, ABI, and enabled features.

1. Define the instruction, memory-ordering, privilege, paging, interrupt, or ABI contract under investigation.
2. Use CPUID/MSR/documented manuals and a minimal reproducer; do not infer behavior from one CPU model.
3. Inspect compiler output, alignment, vector width, cache locality, branch behavior, and fences with measured evidence.
4. Guard optional ISA features and preserve a scalar/fallback implementation.
5. Validate functional behavior, signal/unwind/ABI correctness, multicore ordering, and performance across representative CPUs.

Load `assembler` for instruction-level implementation and `memory-management` for paging/cache/NUMA ownership questions.
