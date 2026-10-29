---
name: build-ci
description: Diagnoses and designs reproducible builds and CI pipelines for C/C++, Python, Rust, GPU code and multi-platform repositories.
compatibility: opencode
---

# Build and CI

Separate configuration, compilation, linking, packaging and execution. A successful earlier phase is not evidence that later phases work.

## Capture the build state

Record source revision, clean/dirty status, OS, architecture, compiler and linker versions, SDKs, generator, configuration, environment variables, dependency lock state, configure command and cache. Preserve the first failing diagnostic, not only the final cascade.

## Diagnose in dependency order

1. Confirm toolchain discovery, target architecture, language standard and feature probes.
2. Inspect generated build files and actual compiler/link commands.
3. Resolve the first root error before treating downstream errors as independent.
4. Distinguish compile, link, load, runtime, test and packaging failures.
5. Use a fresh build directory to check stale caches after correcting configuration; do not erase the original failing state before capturing it.

## Pipeline design

- Pin compiler, SDK, dependency and action versions where reproducibility requires it. Make target and configuration explicit.
- Use a matrix that reflects supported OS, architecture, compiler, debug/release mode and optional hardware capabilities.
- Cache only reproducible inputs. Key caches on toolchain, configuration and dependency lock changes; avoid letting cached artefacts mask missing build dependencies.
- Fail on warnings only under a declared warning policy. Do not pipe away exit codes, append || true, swallow test failures or mark required jobs as allowed-to-fail.
- Separate fast checks from full integration and hardware tests; expose skipped or unavailable tests clearly.
- Upload failing logs, compiler commands, test reports and relevant binaries as artefacts while redacting credentials and private data.
- Include a clean checkout build and verify that generated files are either committed intentionally or recreated deterministically.

## Validation

Run configure, build, link, targeted tests and package/install checks relevant to the change. Verify that CI actually executes the commands and fails on their non-zero exit status. A green workflow with skipped jobs, stale artefacts or masked failures is not a valid gate.

## Report

State the first causal failure, exact environment, command and exit code, fix, clean-build result, CI jobs run and checks blocked by missing hardware. Load cross-compilation for target/sysroot problems and test-engineering for test design.
