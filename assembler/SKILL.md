---
name: assembler
description: Analyze, write, optimize, or validate assembly, disassembly, ABI, calling conventions, instruction selection, binary interfaces, and low-level code generation.
---

# Assembly and binary interfaces

Identify ISA, mode, ABI, object format, assembler syntax, and toolchain before reasoning about instructions.

1. Record architecture/features, register convention, stack alignment, callee-saved state, unwind rules, and relocation model.
2. Establish a correct scalar/reference implementation and inspect generated assembly before hand coding.
3. Preserve flags, masking, alignment, memory ordering, exceptions, and ABI-visible state.
4. Validate with disassembly, symbol/unwind checks, instruction-feature probes, functional tests, and benchmarks.
5. Provide a guarded fallback when the target feature is unavailable.

Load `x86-architecture` for x86 semantics, `cuda-stack` for PTX/SASS, or `graphics-shader-kernels` for shader ISA only when that boundary is active.
