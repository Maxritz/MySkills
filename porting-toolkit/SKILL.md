---
name: porting-toolkit
description: "Ports existing systems code across operating systems, language runtimes, CPU ISAs, ABIs and execution environments while preserving observable semantics."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: false
  trigger_keywords: ["port", "cross-platform", "adapter", "fallback", "capability probe", "platform delta", "ISA", "ABI", "emulator", "porting"]
---

# Porting Toolkit

**Port semantics, not syntax.** A successful build proves neither behavioural equivalence nor deployability. For detailed compiler/sysroot setup, load cross-compilation. For hand-written assembly, disassembly and ABI details, load low-level-toolkit.

## Phase 0: Freeze the contract

Before changing code, write a source-to-target capability and behaviour matrix.

| Contract | Questions |
|---|---|
| Data | Endianness, field widths, alignment, packing, file/protocol format |
| Numeric | Precision, rounding, overflow, NaN/denormal behaviour, reduction order |
| Memory | Ownership, lifetime, allocation/free pairing, virtual/physical/DMA address meaning |
| Concurrency | Thread model, atomic guarantees, memory ordering, cancellation, shutdown |
| OS | Files, clocks, entropy, signals/exceptions, dynamic libraries, permissions |
| ABI | Calling convention, symbol visibility, object format, CRT/libc and struct layout |
| Hardware | ISA features, SIMD width, cache/atomic capabilities, GPU APIs and fallback |
| Failure | Error codes, partial results, timeout, retry, cleanup and unsupported capability |
| Performance | Representative workload, baseline, target limit and acceptance range |

Classify each row as equivalent, adapter-required, unsupported or not yet verified. Do not silently weaken a guarantee to make the target compile.

## Phase 1: Separate portable logic from platform capabilities

Keep business/protocol/math logic free of OS headers and SDK calls. Put OS, runtime and hardware-specific behaviour behind narrow interfaces with documented lifetime, ownership and failure semantics.

- Expose capability queries or feature-specific entry points. Do not make a fake fallback that returns success without doing the operation.
- Return an explicit unsupported status when semantics cannot be preserved.
- Keep allocation/deallocation pairs in the same platform adapter. Windows aligned allocation requires its matching deallocator; POSIX aligned allocation has different validation and error rules. Do not copy C11 aligned_alloc into a C99 or cross-platform contract.
- C99 does not provide standard atomics or threads. A C11 atomic type, compiler intrinsic or OS primitive must be part of an explicit language/platform contract, not hidden behind an unimplemented preprocessor branch.
- Use compile-time feature selection when the target is fixed. Use runtime dispatch only when the binary is intended to run on machines with differing capabilities.
- Ensure the scalar/reference implementation remains available until the accelerated adapter passes differential tests.

## Phase 2: Cross-compilation and target discovery

Use cross-compilation for toolchain files, target triples, sysroots, package discovery, host/target separation, artifact inspection and target-aware CI. Freeze the target tuple: OS, architecture, ABI, libc/runtime, compiler/linker, sysroot, minimum OS and deployment CPU/features.

A CMake toolchain example must be adapted to the actual SDK and compiler. Do not assume a flag or linker mode is supported by every target. Host feature tests must not execute target binaries. A clean compile or link is not a substitute for running the resulting artifact on target hardware or a suitable emulator.

Before accepting a cross-build, inspect the actual compiler/link commands, object formats, architecture, interpreter/dependencies, exported symbols and minimum-runtime requirements.

## Phase 3: Implement one semantic delta at a time

1. Add or update the interface contract and scalar/reference test first.
2. Implement one adapter or capability change in isolation.
3. Test the adapter's normal, boundary and failure paths.
4. Differentially compare the portable path and target path with explicit numeric tolerances or exact output comparison.
5. Inspect the final diff and remove temporary compatibility code only when the supported target matrix proves it is no longer needed.

Avoid platform conditional branches scattered across core logic. A platform conditional is acceptable at the boundary that owns the capability; it is not a substitute for an architectural seam.

## Phase 4: ISA and assembly

Do not register a stub or assembly placeholder under the name of a complete accelerated implementation. Before hand-writing instructions, record ISA, execution mode, ABI, object format, assembler syntax, calling convention, stack/unwind rules, preserved registers, flags, memory ordering and feature-detection policy.

- Inspect compiler-generated assembly from the portable implementation first.
- Check the full target feature set, including operating-system state requirements for vector extensions.
- Preserve callee-saved registers, stack alignment, unwind metadata and ABI-visible state.
- Handle tails, alignment and unsupported instructions explicitly. Never impose an alignment or even-block-count requirement without enforcing and documenting it.
- Compare functional output with the portable oracle before measuring speed.
- Use low-level-toolkit for concrete assembly templates, disassembly, relocations, symbols and instruction probes.

## Phase 5: Emulation and test limits

Use an emulator for fast functional checks when it models the required target behaviour. Record emulator/version, configuration, CPU/device model and unsupported instructions or peripherals.

- Differential tests must compare the same inputs, observable outputs and defined architectural state. Exact PC traces are meaningful only when the instruction-level contract and stepping mode are aligned.
- Emulator success does not prove real driver, timing, cache, DMA, interrupt, power-state or device performance.
- Mark hardware-specific checks BLOCKED or NOT RUN if target hardware is unavailable. Do not turn an emulator run into a hardware-support claim.
- Preserve crash inputs and reduce them to a minimal reproducer where possible.

## Phase 6: Reproducibility

Record source revision, compiler/linker, SDK/sysroot, dependency versions, relevant environment variables, build configuration and generated artefact hashes. Use a pinned lockfile as a record of a chosen toolchain, not as a claim that the listed versions are current or universally compatible.

Build twice from clean, equivalent environments when reproducibility is required. Compare artefacts while accounting for documented nondeterminism such as timestamps, build IDs, archive ordering and absolute paths. Explain any difference instead of blindly stripping metadata until hashes match.

## Acceptance gates

- [ ] Contract matrix covers changed capabilities and error semantics.
- [ ] Target tuple and actual compiler/link commands recorded.
- [ ] No host library/header leakage into the target artifact.
- [ ] Unsupported features fail explicitly or use a verified equivalent fallback.
- [ ] Boundary and failure paths are tested.
- [ ] Differential test passes against an independent reference.
- [ ] Target runtime checks are distinguished from emulation.
- [ ] Performance is measured against an equivalent baseline only after correctness.

## Report

    PORTING: SOURCE -> TARGET
    CONTRACT: preserved / adapted / unsupported / unverified
    TOOLCHAIN: triple, compiler, linker, SDK/sysroot
    ADAPTERS: changed capabilities and fallback rules
    DIFFERENTIAL: workload, oracle, tolerance and result
    TARGET TEST: hardware / emulator / NOT RUN
    PERFORMANCE: baseline and repeated measurement, if relevant
    STATUS: PASS / FAIL / BLOCKED / NOT RUN
    BLOCKERS: explicit list

## Boundaries

- Use cross-compilation for concrete toolchain/target configuration.
- Use low-level-toolkit for assembly, ABI disassembly and emulator fidelity.
- Use c-systems and c99-systems for language-specific ownership and portability constraints.
- Use goli-mat-de to audit a port for missing wiring, fake fallbacks or overstated completion.
