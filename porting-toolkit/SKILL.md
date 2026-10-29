---
name: porting-toolkit
description: "Unified cross-porting toolkit: capability matrix, change isolation, cross-compilation, toolchains, assembly, emulation. Port semantics, not syntax."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: false
  trigger_keywords: ["port", "cross-compile", "cross-platform", "adapter", "fallback", "capability probe", "platform delta", "ISA", "ABI", "sysroot", "emulator"]
---

# Porting Toolkit

**Port semantics, not syntax.** Start with a capability and behavior matrix for source and target. Freeze observable behavior, ABI, numeric tolerances, synchronization, ownership, error, and performance requirements.

## Phase 0: Capability & Behavior Matrix (Mandatory First Step)

Before ANY code changes, produce:

| Capability | Source | Target | Delta | Adapter Needed? |
|------------|--------|--------|-------|-----------------|
| Memory model | | | | |
| Thread model | | | | |
| Sync primitives | | | | |
| Error handling | | | | |
| Numeric precision | | | | |
| ABI / calling convention | | | | |
| File I/O | | | | |
| Time/clock | | | | |
| Random/entropy | | | | |
| Dynamic loading | | | | |
| Signal/exception | | | | |
| GPU/accelerator | | | | |

**Observable behavior contract (frozen):**
- Input/output formats (bit-exact where possible)
- Error codes and semantics
- Timing tolerances (latency, throughput)
- Concurrency guarantees (atomicity, ordering)
- Resource lifecycle (alloc/free, open/close)

---

## Phases 1, 2, 4, 5 and 6: execution outline

| Phase | Required outcome |
|---|---|
| 1. Cross-compile | Target-aware toolchain, explicit sysroot/SDK, clean build and dependency inspection |
| 2. Semantic port | Keep portable logic separate from platform adapters; probe features, never guess from host macros |
| 3. Change isolation | Land one coherent delta at a time and differential-test before continuing |
| 4. Assembly/ABI | Hand-code only after compiler output and calling convention are understood; verify disassembly and unwind data |
| 5. Emulation | Define fidelity boundaries and compare state/output with a trusted reference; emulation is not cycle-accuracy proof |
| 6. Toolchains | Pin compiler, linker, SDK and dependencies; reproduce clean builds and test on target or remote hardware |

For code/configuration templates, inspect [detailed porting recipes](references/porting-recipes.md). The original phase-specific checklists and examples are retained there.

## Phase 3: Change Isolation (Porting Change Isolation)

**Make platform deltas explicit, small, reversible.**

### Isolation Checklist

| Check | Requirement |
|-------|-------------|
| **Stable contract identified** | Exact behavior spec frozen (Phase 0) |
| **Narrow adapter** | Single capability, single file, ≤50 lines |
| **Capability probe** | Compile-time trait, not runtime `#ifdef` sprawl |
| **Fallback explicit** | Observable, semantically equivalent where possible |
| **One boundary at a time** | Land memory → test → thread → test → fs → test |
| **Contract/differential tests** | Before cleanup/optimization |
| **Temp code removal** | Only after target matrix proves safe |

### Delta Landing Template

```diff
# Commit: "port: add Linux memory adapter (1/5)"
+ platform/linux/memory.c (new, 45 lines)
+ platform/capability.h (updated: PLATFORM_ALIGNED_ALLOC)
  test/memory_adapter_test.c (new, differential vs reference)
```

**Test before next delta:**
```bash
# Differential test: portable logic + new adapter vs reference implementation
./test_memory_adapter --compare=reference_impl
```

---

## Output Report

```
PORTING TOOLKIT: PHASE <N>/6 COMPLETE
MATRIX: <capabilities mapped>/<total> (<deltas> deltas)
CROSS-COMPILE: <toolchain> ✅/❌
ADAPTERS: <landed>/<planned> (<next capability>)
ASSEMBLY: <functions hand-coded>/<total> (fallback: <status>)
EMULATION: <fidelity level> ✅/❌
TOOLCHAIN: <locked> ✅/❌
DIFFERENTIAL: <passed>/<total> tests
BLOCKERS: <list>
```

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Freeze a source-behaviour contract and capability matrix before translation. Build and test each target adapter independently, prove the fallback path and ABI, and distinguish compile-only targets from targets exercised at runtime.


## Boundaries

- Does not write portable logic (receives it)
- Does not optimize hand-coded assembly beyond correctness
- Does not run on target hardware (emulation only)
- `stop porting-toolkit`: revert.