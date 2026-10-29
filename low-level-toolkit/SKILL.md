---
name: low-level-toolkit
description: "Assembly, emulation, toolchains: ISA/ABI analysis, instruction selection, binary interfaces, emulator design, compiler/linker/sysroot reproducibility. For bare-metal, kernel, compiler, and binary-level work."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: false
  trigger_keywords: ["assembly", "emulation", "toolchain", "ISA", "ABI", "calling convention", "binary", "disassembly", "compiler", "linker", "sysroot", "emulator", "simulator", "JIT"]
---
# Low-Level Toolkit

Use this skill for assembly/ABI work, emulator implementation and reproducible toolchains. Record target ISA/ABI, object format, OS/runtime, compiler/linker version, CPU features and test environment before changing code.

## Task router

| Task | Acceptance gate |
|---|---|
| Hand-coded assembly | Verify calling convention, preserved registers, stack alignment, flags, clobbers, unwind/relocations and disassembly |
| Emulator/simulator | Compare architectural state, PC flow, memory/device effects and exceptions against a pinned reference |
| Cross-compilation | Use a target-aware toolchain/sysroot, inspect dependencies and run a representative binary |
| Reproducible builds | Pin toolchain/dependencies and compare clean builds, excluding only documented nondeterministic metadata |
| Accelerator SDK integration | Verify host compiler, SDK/runtime compatibility, feature probes and actual target execution |

Detailed code templates, emulator architecture and toolchain files: [implementation recipes](references/implementation-recipes.md). The recipes preserve full worked guidance without loading every platform example for an unrelated task.

## Cross-Layer Workflows

### Assembly + Toolchain
1. **Toolchain** → Define target ISA, ABI, compiler flags
2. **Assembly** → Write ISA-specific kernels with capability guards
3. **Validate** → Disassembly check, feature probe, functional test

### Emulation + Toolchain
1. **Toolchain** → Build emulator for target architecture
2. **Emulation** → Test kernels/binaries in emulator
3. **Differential** → Compare emulator vs hardware

### Assembly + Emulation
1. **Assembly** → Write kernels
2. **Emulation** → Run in cycle-accurate emulator
3. **Profile** → Identify stalls, optimize scheduling

---

## Output Report

```
LOW-LEVEL TOOLKIT: <layer> ANALYSIS
LAYER: <assembly|emulation|toolchain>
TARGET: <ISA> <ABI> <object format>
TOOLCHAIN: <compiler> <linker> <sysroot> <flags>
ASSEMBLY: <functions> hand-coded, <fallbacks> guarded
EMULATION: <fidelity> <differential test> ✅/❌
TOOLCHAIN: <reproducible> ✅/❌, <clean rebuild> ✅/❌
VALIDATION: functional ✅/❌, performance ✅/❌, reproducibility ✅/❌
BLOCKERS: <missing ISA|unstable ABI|non-determinism>
```

---

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Pin target ABI, object format, compiler/linker and CPU feature set. Check disassembly, relocations, stack/unwind metadata and runtime feature dispatch; emulator success is not proof of cycle accuracy or real-hardware behaviour.


## Boundaries

- Does not write high-level code (receives kernels/binaries to validate)
- Does not manage CI/CD pipelines (provides reproducibility)
- Does not optimize algorithms (see `optimization-toolkit`)
- `stop low-level-toolkit`: revert.