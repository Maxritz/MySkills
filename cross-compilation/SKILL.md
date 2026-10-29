---
name: cross-compilation
description: Reproducible cross-compilation across OS, ISA and ABI targets, including CMake toolchains, sysroots, dependency discovery and target-aware validation.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["cross compilation", "cross-compile", "target toolchain", "sysroot", "CMake toolchain"]
---

# Cross-Compilation

Load porting-toolkit for broader semantic porting. This skill focuses on proving that produced artifacts target the intended platform and use only target-compatible headers, libraries and runtime assumptions.

## Freeze the target tuple

Record target OS, architecture, ABI, libc/runtime, compiler, linker, sysroot, minimum OS version, deployment CPU and required instruction features. Separate host tools from target artifacts. Do not infer the target from the build machine.

## Configure the toolchain

- Set target compiler, compiler target triple and sysroot explicitly.
- Use target-aware package discovery. Prevent host include paths, libraries and pkg-config results from leaking into the target build.
- Set CMake system name, processor and find-root modes consistently. Keep code generators and other host executables runnable on the host.
- Pin SDKs, compiler and dependency versions. Record environment variables that affect lookup, code generation or linking.
- Probe capabilities by compile/link tests for the target, not by checking whether a header exists on the host.

## Prove the artifact

1. Start from a clean build directory. Record configure command and cache.
2. Inspect compile and link commands; confirm every object and library uses the target ABI.
3. Inspect resulting file format, architecture, interpreter, imported libraries, symbols and minimum runtime requirements.
4. Run target tests on hardware or a suitable emulator. Distinguish successful compilation from successful execution.
5. Test feature fallbacks on a target without optional ISA or GPU features.
6. Repeat the build when reproducibility matters and compare artefacts while accounting for timestamps, build IDs and other documented nondeterminism.

## Common false positives

- Host headers or libraries silently satisfying target dependencies.
- CMAKE_SYSTEM_PROCESSOR set while native compiler/linker tools remain selected.
- Feature checks that run a target executable on the host.
- Static linking mistaken for full portability.
- Successful linking mistaken for proof of loader, driver or runtime compatibility.
- Native tuning flags enabling instructions absent on the deployment CPU.

## Report

Include target tuple, toolchain and sysroot, clean-build status, artifact inspection, runtime target and tests executed. Mark device-only checks as BLOCKED or NOT RUN when no matching target is available. Use build-ci to make the matrix reproducible in CI.
