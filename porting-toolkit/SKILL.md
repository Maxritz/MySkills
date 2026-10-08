---
name: porting-toolkit
description: "Unified cross-porting toolkit: capability matrix, change isolation, cross-compilation, toolchains, assembly, emulation. Port semantics, not syntax."
compatibility: opencode
metadata:
  loading: on-demand
  auto_trigger: true
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

## Phase 1: Cross-Compilation Setup

**Record complete toolchain graph:**
```
Target triple:        aarch64-linux-gnu
Compiler:             clang-18 (host: x86_64-linux-gnu)
Linker:               lld-18
Libc/CRT:             glibc-2.39 (sysroot: /opt/sysroots/aarch64)
SDK:                  None (bare metal: /opt/sysroots/baremetal)
ABI:                  LP64, ELF, hard-float
Deployment format:    Static PIE + .debug section
Emulator:             qemu-aarch64-static (user) / qemu-system-aarch64 (system)
Test executor:        qemu-aarch64-static ./test_bin
```

**CMake toolchain file (explicit, reproducible, no host leakage):**
```cmake
# toolchain-aarch64.cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR aarch64)
set(CMAKE_SYSROOT /opt/sysroots/aarch64)
set(CMAKE_C_COMPILER clang)
set(CMAKE_CXX_COMPILER clang++)
set(CMAKE_ASM_COMPILER clang)
set(CMAKE_AR llvm-ar)
set(CMAKE_RANLIB llvm-ranlib)
set(CMAKE_LINKER lld)
set(CMAKE_C_FLAGS "--target=aarch64-linux-gnu -fPIC -g3" CACHE STRING "")
set(CMAKE_CXX_FLAGS "${CMAKE_C_FLAGS}" CACHE STRING "")
set(CMAKE_EXE_LINKER_FLAGS "-static-pie -Wl,--build-id=sha256" CACHE STRING "")
# Feature tests MUST be target-aware:
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)
```

**Validation:**
```bash
# Clean rebuild
cmake -B build -DCMAKE_TOOLCHAIN_FILE=toolchain-aarch64.cmake
cmake --build build -Werror

# Dependency inspection
aarch64-linux-gnu-objdump -p build/app | grep NEEDED
aarch64-linux-gnu-readelf -d build/app | grep -E "(NEEDED|RUNPATH)"

# Representative execution
qemu-aarch64-static ./build/app --selftest
```

---

## Phase 2: Semantic Porting (Core Logic → Platform Adapters)

### Separation Pattern

```
src/
  portable/           # Pure logic, no platform deps
    math.c
    parser.c
    protocol.c
  platform/
    linux/            # Linux adapters
      memory.c
      thread.c
      fs.c
    windows/          # Windows adapters
      memory.c
      thread.c
      fs.c
    baremetal/        # No-OS adapters
      memory.c
      thread.c
  capability.h        # Compile-time capability probes
```

### Capability Probe Header

```c
// capability.h - included by portable code
#pragma once

// Memory
#ifndef PLATFORM_ALIGNED_ALLOC
#  if defined(_WIN32)
#    define PLATFORM_ALIGNED_ALLOC(align, size) _aligned_malloc(size, align)
#    define PLATFORM_ALIGNED_FREE(ptr) _aligned_free(ptr)
#  elif defined(__linux__) || defined(__APPLE__)
#    define PLATFORM_ALIGNED_ALLOC(align, size) aligned_alloc(align, size)
#    define PLATFORM_ALIGNED_FREE(ptr) free(ptr)
#  else
#    error "PLATFORM_ALIGNED_ALLOC not defined for this target"
#  endif
#endif

// Threading
#ifndef PLATFORM_THREAD_CREATE
// ... platform-specific signatures
#endif

// Atomic ops (C11 preferred, fallback to platform)
#ifndef PLATFORM_ATOMIC_U64_CAS
#  if __has_include(<stdatomic.h>) && !defined(__EMSCRIPTEN__)
#    include <stdatomic.h>
#    define PLATFORM_ATOMIC_U64_CAS(ptr, expected, desired) \
        atomic_compare_exchange_strong_explicit((_Atomic uint64_t*)(ptr), (expected), (desired), memory_order_acq_rel, memory_order_acquire)
#  else
// platform-specific fallback
#  endif
#endif
```

### Adapter Contract (Example: Memory)

```c
// platform/linux/memory.c
#include "capability.h"
#include <stdlib.h>
#include <errno.h>

void* platform_aligned_alloc(size_t align, size_t size) {
    void* ptr = aligned_alloc(align, size);
    if (!ptr) errno = ENOMEM;
    return ptr;
}

void platform_aligned_free(void* ptr) {
    free(ptr);
}
```

**Rules:**
- Portable code includes ONLY `capability.h` and standard headers
- Platform adapters implement `capability.h` signatures
- **No `#ifdef PLATFORM` in portable code** — use capability probes
- One adapter per platform per capability

---

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

## Phase 4: Assembly & Binary Interface (When Needed)

**Only when portable + adapter insufficient.**

### Pre-Hand-Coding Checklist

- [ ] ISA, mode, ABI, object format, assembler syntax, toolchain recorded
- [ ] Correct scalar/reference implementation exists in portable/
- [ ] Generated assembly inspected (`-S -O2 -march=native`)
- [ ] Flags, masking, alignment, memory ordering, exceptions, ABI-visible state preserved
- [ ] Guarded fallback when target feature unavailable

### Hand-Coded Assembly Template

```asm
// platform/linux/aarch64/simd.S
// Capability: NEON-accelerated Q4_0 dequantize
// Fallback: portable/dequantize.c (scalar)
// Guard: #if defined(__aarch64__) && defined(__ARM_NEON)

.text
.align 4
.global ggml_dequantize_q4_0_neon
.type ggml_dequantize_q4_0_neon, %function

// SAFETY: Requires src aligned to 16B, dst aligned to 16B, block_count % 2 == 0
// Input:  x0=src, x1=dst, x2=block_count
// Output: x0=0 success, x0=-1 alignment fault
ggml_dequantize_q4_0_neon:
    // Alignment check
    tbz x0, #3, 1f        // src % 16 != 0 -> alignment_fault
    tbz x1, #3, 1f        // dst % 16 != 0 -> alignment_fault
    ands x3, x2, #1
    b.ne alignment_fault  // block_count odd -> alignment_fault

    // NEON implementation here...
    // Preserve: x19-x28 (callee-saved), SP 16-byte aligned
    // Return: x0=0

1:  alignment_fault:
    mov x0, #-1
    ret

.size ggml_dequantize_q4_0_neon, .-ggml_dequantize_q4_0_neon
```

**Validation:**
```bash
# Disassembly check
aarch64-linux-gnu-objdump -d build/libportable.so | grep -A20 dequantize_q4_0_neon

# Symbol/unwind check
aarch64-linux-gnu-readelf -u build/libportable.so

# Instruction-feature probe
./test_cpu_features --require=neon && ./test_dequantize_neon

# Functional + bench
./test_dequantize --impl=neon --verify=reference
./bench_dequantize --impl=neon --compare=scalar
```

---

## Phase 5: Emulation & Validation (When Target Unavailable)

### Emulation Fidelity Matrix

| Fidelity | Use Case | Approach |
|----------|----------|----------|
| **Functional** | Logic correctness | User-mode emulator (qemu-user) |
| **Timing-approximate** | Performance modeling | User-mode + cycle estimates |
| **Cycle-accurate** | Timing-dependent logic | Full-system emulator (qemu-system) |
| **Hardware-accurate** | Device drivers, firmware | FPGA / real hardware |

### Emulation Setup (User-mode Example)

```bash
# Static binary for maximum portability
cmake -B build -DCMAKE_TOOLCHAIN_FILE=toolchain-aarch64.cmake \
  -DCMAKE_EXE_LINKER_FLAGS="-static-pie"
cmake --build build

# Run under emulator
qemu-aarch64-static -L /opt/sysroots/aarch64 \
  ./build/app --test-suite=portable

# Differential test vs reference (x86_64 native)
./build_x86/app --test-suite=portable --output=ref.json
qemu-aarch64-static ./build_aarch64/app --test-suite=portable --output=target.json
python diff_json.py ref.json target.json
```

### Conformance & Determinism

- **Snapshot/restore:** `qemu-aarch64-static -snapshot` + savevm/loadvm
- **Deterministic replay:** `rr record` (Linux) / `qemu -icount shift=auto,rr=record`
- **Fuzzing:** `libfuzzer` + qemu-user for target-arch fuzzing
- **Invalid input handling:** Corpus of malformed inputs per format spec

---

## Phase 6: Toolchain Management (Reproducible Builds)

### Toolchain Lockfile

```yaml
# toolchain.lock.yaml
compiler:
  name: clang
  version: "18.1.8"
  target: aarch64-linux-gnu
  sha256: "abc123..."
linker:
  name: lld
  version: "18.1.8"
libc:
  name: glibc
  version: "2.39"
  sysroot_sha256: "def456..."
flags:
  c: "--target=aarch64-linux-gnu -fPIC -g3 -O2 -ffunction-sections -fdata-sections"
  cxx: "--target=aarch64-linux-gnu -fPIC -g3 -O2 -ffunction-sections -fdata-sections"
  ld: "-static-pie -Wl,--build-id=sha256 -Wl,--gc-sections"
environment:
  CC: clang
  CXX: clang++
  AR: llvm-ar
  RANLIB: llvm-ranlib
  STRIP: llvm-strip
```

### Reproducibility Validation

```bash
# Build twice, compare bit-for-bit (excluding build-id)
cmake -B build1 -DCMAKE_TOOLCHAIN_FILE=toolchain-aarch64.cmake
cmake --build build1
cmake -B build2 -DCMAKE_TOOLCHAIN_FILE=toolchain-aarch64.cmake
cmake --build build2

# Strip build IDs, compare
strip --strip-all build1/app
strip --strip-all build2/app
diff <(sha256sum build1/app) <(sha256sum build2/app) && echo "REPRODUCIBLE"
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

## Boundaries

- Does not write portable logic (receives it)
- Does not optimize hand-coded assembly beyond correctness
- Does not run on target hardware (emulation only)
- `stop porting-toolkit`: revert.