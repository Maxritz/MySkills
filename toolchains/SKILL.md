---
name: toolchains
description: Select, configure, diagnose, and reproduce compilers, assemblers, linkers, SDKs, sysroots, build systems, package managers, and binary artifacts.
---

# Toolchains

Record the complete toolchain graph, not only the compiler name.

1. Capture source revision, compiler/linker/assembler versions, target triple, sysroot, SDK, flags, environment, generator, and dependency lock.
2. Separate compile, link, post-link, package, sign, deploy, and test stages.
3. Check ABI, CRT/libc, symbol visibility, LTO/PGO, debug/unwind info, code-object targets, and reproducibility.
4. Prefer explicit toolchain files and hermetic inputs; reject accidental host discovery.
5. Validate a clean rebuild, dependency inspection, representative execution, and failure diagnostics.

Add `cross-compilation` for non-host targets and the relevant CUDA/ROCm/DirectX skill for accelerator toolchains.
