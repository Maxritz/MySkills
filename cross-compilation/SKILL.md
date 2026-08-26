---
name: cross-compilation
description: Configure, debug, and reproduce cross-compilation for different OS, CPU, GPU, ABI, sysroot, SDK, or deployment targets.
---

# Cross-compilation

Treat host, build, target, sysroot, SDK, runtime, and test executor as separate identities.

1. Record target triple, compiler, linker, libc/CRT, sysroot, SDK, ABI, deployment format, and emulator/device availability.
2. Keep target headers/libs isolated from host files and make feature tests target-aware.
3. Make CMake/Ninja or equivalent toolchain files explicit, reproducible, and free of host-path leakage.
4. Inspect symbols, relocations, dependencies, architecture flags, code objects, and packaging metadata.
5. Run host-side static checks plus target execution, emulation, or remote tests; report NOT RUN when unavailable.

Load `toolchains` for compiler/linker selection and `cross-porting` for semantic differences.
