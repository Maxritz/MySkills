---
name: low-level-toolkit
description: "Assembly, emulation, toolchains and binary interfaces: ISA/ABI analysis, disassembly, JIT correctness and reproducible target builds."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: false
  trigger_keywords: ["assembly", "emulation", "toolchain", "ISA", "ABI", "calling convention", "binary", "disassembly", "compiler", "linker", "sysroot", "emulator", "simulator", "JIT"]
---

# Low-Level Toolkit

Use for ISA/ABI questions, hand-written assembly, emulator fidelity and binary/toolchain diagnosis. Use porting-toolkit for broader semantic porting and cross-compilation for focused target/sysroot setup. Code examples below state their exact target; do not copy them to another ABI unchanged.

## 1. Hand-written assembly

### Pre-coding contract

Record ISA and feature level, execution mode, ABI, object format, assembler and syntax, input/output contract, pointer-validity assumptions, preserved registers, flags, stack alignment, unwind metadata, memory ordering and fallback policy.

Before writing assembly:
1. Create a correct scalar/reference implementation.
2. Inspect compiler-generated code at the intended optimisation level and target.
3. Verify that the proposed instruction exists on the exact target and that OS state support is enabled where required.
4. Decide how the caller handles unavailable CPU features; an assembly function must not be called before dispatch validates its requirements.
5. Define numerical equivalence, including FMA/reduction-order differences.

### Worked kernel: x86-64 System V AVX2/FMA dot product

This example uses GNU assembler with Intel syntax, the System V x86-64 ABI, valid contiguous FP32 arrays and a length measured in elements. It accepts unaligned pointers and arbitrary length, using a scalar tail. It requires both AVX2 and FMA; runtime dispatch is the caller's responsibility. The caller must validate that each array spans at least n elements.

    .text
    .intel_syntax noprefix
    .p2align 4
    .globl dot_f32_avx2
    .type dot_f32_avx2, @function
    dot_f32_avx2:
    .cfi_startproc
        vxorps ymm0, ymm0, ymm0
        xor rax, rax

    .Lvector:
        mov r8, rdx
        sub r8, rax
        cmp r8, 8
        jb .Ltail
        vmovups ymm1, YMMWORD PTR [rdi + rax*4]
        vmovups ymm2, YMMWORD PTR [rsi + rax*4]
        vfmadd231ps ymm0, ymm1, ymm2
        add rax, 8
        jmp .Lvector

    .Ltail:
        vxorps xmm3, xmm3, xmm3
    .Lscalar:
        cmp rax, rdx
        jae .Lreduce
        vmovss xmm1, DWORD PTR [rdi + rax*4]
        vmulss xmm1, xmm1, DWORD PTR [rsi + rax*4]
        addss xmm3, xmm1
        inc rax
        jmp .Lscalar

    .Lreduce:
        vextractf128 xmm1, ymm0, 1
        vaddps xmm0, xmm0, xmm1
        vhaddps xmm0, xmm0, xmm0
        vhaddps xmm0, xmm0, xmm0
        addss xmm0, xmm3
        vzeroupper
        ret
    .cfi_endproc
    .size dot_f32_avx2, .-dot_f32_avx2
    .section .note.GNU-stack,"",@progbits

The return value is an FP32 scalar in xmm0. The scalar tail keeps the result correct for n not divisible by eight. The code does not validate null or undersized arrays; those are caller-level preconditions. A production API should validate byte-range arithmetic before entering the function. FMA changes rounding relative to a scalar multiply/add loop, so compare against a reference using declared absolute and relative tolerances. Build only for the intended target and ensure non-AVX2 machines never dispatch to this function.

### Validation sequence

- Compile the assembly with the intended assembler and ABI; inspect diagnostics.
- Inspect disassembly and relocations in the produced binary, not only the source.
- Verify symbol export, calling convention, register preservation, unwind behaviour and stack alignment.
- Test n values 0 through at least two vector widths, non-multiple lengths, unaligned pointers and large safe lengths.
- Compare output against an independent scalar oracle; include cancellation-heavy, very small and large values.
- Verify runtime feature dispatch on a machine or emulator with the feature disabled.
- Benchmark with identical inputs and boundaries; include a library baseline and repeated-trial spread.

Commands must match the installed toolchain. For example, use the selected target's objdump/readelf or dumpbin tooling; do not assume GNU binutils commands exist in a Visual Studio environment.

## 2. ABI and binary interfaces

Record the target ABI explicitly rather than saying only “x64” or “ARM64”.

| Target contract | Verify |
|---|---|
| System V AMD64 | Argument registers, caller/callee-saved registers, red zone, stack alignment, return-value class and DWARF CFI |
| Microsoft x64 | Argument registers/shadow space, nonvolatile registers, stack alignment and Windows unwind metadata |
| AArch64 AAPCS64 | x0-x7 arguments, x0/x1 integer results, preserved x19-x28 and required stack alignment |
| RISC-V ABI | XLEN, argument/result registers, preserved registers, floating-point ABI and extension set |
| GPU code object | Compiler-defined kernel ABI, argument layout, register model, target ISA and runtime loader requirements |

Check symbol names and mangling, visibility, relocation model, PIC/PIE requirements, TLS model, exception/unwind metadata, structure layout and compiler-runtime compatibility. A successful link does not prove that the loader can satisfy dependencies on the deployment system.

## 3. Emulator and simulator engineering

Do not use an architecture-agnostic emulator loop as if it were a valid CPU implementation. Instruction length, branch target, privilege, exceptions, memory ordering and architectural side effects depend on the exact ISA.

A real emulator must:
- Decode the selected ISA/version and extensions, including compressed/variable-length instructions where applicable.
- Update PC according to execution semantics, not by a universal fixed increment.
- Enforce architectural register rules, privilege checks, traps, misalignment behaviour and reserved/illegal instruction handling.
- Model memory mapping, MMIO and device side effects that are inside the declared fidelity contract.
- Define deterministic input/time/interrupt replay if reproducibility is claimed.
- Invalidate translated blocks when self-modifying code or relevant mapping/permissions change.

JIT translation needs explicit cache keys, lifetime, invalidation, executable-memory policy, instruction-cache coherency, signal/exception mapping and a fallback path. Cache operations must not execute untrusted code without a deliberate sandbox and policy.

### Differential tests

Compare against a trusted reference simulator or real hardware using the same program, initial architectural state, inputs and supported ISA subset. Compare at the level the reference can meaningfully guarantee: final state, instruction trace, memory writes, exceptions or device events. Exact PC traces are not expected to match between different optimisation levels or JIT block sizes unless execution is stepped at comparable architectural boundaries.

Emulation may establish functional behaviour for the emulated subset. It does not establish driver compatibility, timing, cache/NUMA behaviour, DMA correctness, interrupt latency or real-hardware performance. Mark unsupported devices/instructions explicitly.

## 4. Reproducible toolchains

Treat toolchain lock values as project-specific choices, not universal defaults. Record compiler, assembler, linker, target triple, SDK, sysroot hash, C/C++ language standard, flags, dependencies and environment. Replace illustrative placeholders with real versions and hashes before using a lockfile to claim reproducibility.

For CMake cross builds, configure target identity explicitly and prevent host dependency leakage. With Clang, use target-aware compiler settings and a matching sysroot. CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY can avoid trying to run target tests at configure time, but it also means those checks do not validate target execution and may not prove every final link requirement. Run an explicit target-aware link and runtime test.

Inspect build commands and generated artifacts:
- Verify architecture, object format, interpreter/imported libraries, minimum runtime, symbols and relocations.
- Check that native tools are used for build-time code generators and target tools are used for target artifacts.
- Use pinned dependencies and clean builds when the change affects generated output.
- For reproducibility, compare independently produced artifacts and investigate differences. Do not blindly strip metadata until hashes match; define a documented normalisation policy and retain original builds.
- Do not assume static linking eliminates libc, loader, TLS, CPU-feature or licensing constraints.

## 5. Feature selection and microarchitecture

A build flag is not a runtime feature probe. Check CPU feature bits and OS-managed register state for the target before dispatching to advanced vector instructions. Verify the exact target through the compiler's target list and the final disassembly. Do not infer instruction availability from a marketing family name.

On GPUs, compiler target, code object, register allocation and kernel ABI are runtime-specific. Use amd-gpu-stack or nvidia-cuda-stack for their target ISA/compiler and shader-opt or vulkan-compute-stack for Vulkan shader execution. Do not reuse PTX, AMDGCN, HLSL or SPIR-V snippets across these paths without a defined translation and semantic validation.

## Output report

    LOW-LEVEL TOOLKIT: ANALYSIS
    LAYER: assembly / ABI / emulator / JIT / toolchain
    TARGET: ISA, ABI, object format and CPU/GPU features
    TOOLCHAIN: compiler, assembler, linker, SDK/sysroot and flags
    CORRECTNESS: reference, edge cases, tolerance and result
    ABI: registers, stack, symbols, relocations, unwind
    EMULATION: supported fidelity and differential results
    REPRODUCIBILITY: clean builds and artifact comparison
    STATUS: PASS / FAIL / BLOCKED / NOT RUN
    BLOCKERS: explicit list

## Boundaries

- Use porting-toolkit for preserving semantics across platforms.
- Use cross-compilation for concrete target triples and sysroot setup.
- Use optimization-toolkit or kernel-tuning for measured performance search.
- Use goli-mat-de if a claimed assembly/emulator implementation may be incomplete or misrepresented.
