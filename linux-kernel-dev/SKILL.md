---
name: linux-kernel-dev
description: "Linux kernel development: modules, drivers, KASAN, ftrace, lockdep, perf, crash debugging. Kernel-space and kernel/driver boundary work."
compatibility: opencode
---

# Linux Kernel Development

**Kernel-space and kernel/driver boundary work.**

---

## Subsystem selector

| Symptom | Start with |
|---|---|
| Early boot/panic | exact config, symbols, QEMU/GDB or target console; establish last checkpoint |
| Runtime regression/hang | ftrace/function graph and relevant tracepoints |
| Crash/corruption | crash dump, symbol-matched analysis and minimal reproduction |
| Memory issue | KASAN/slab/page diagnostics where supported |
| Lockup/race | lockdep, lock tracing and a state/lock-order hypothesis |
| Module/driver failure | kernel/module ABI, config, signing, permissions, init/exit and error cleanup |

Detailed commands and module patterns: [kernel recipes](references/kernel-recipes.md).

## Validation Gates

| Gate | Command | Pass Criteria |
|------|---------|---------------|
| **Build** | `make -j$(nproc) W=1` | 0 warnings (or documented) |
| **Static** | `sparse -Wbitwise -Wcontext -Wcast /` | 0 new warnings |
| **KASAN** | Boot with `kasan=on` | No splats on reproducer |
| **Lockdep** | Boot with `lockdep=on` | No splats on reproducer |
| **Reproducer** | `insmod mymod.ko; test.sh` | Expected behavior |
| **Regression** | `kselftest / kunit` | All pass |

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Pin kernel version, config, symbols and reproduction environment. Use the diagnostic appropriate to the suspected layer; verify lock ordering, interrupt context and allocation context, and report whether the test ran on a real target or emulator.


## Boundaries

- Does not write userspace C/C++ (see `c-systems`)
- Does not manage userspace memory allocators (see `linux-user`)
- Does not cover bare-metal kernel (see `bare-metal-kernel`)
- Does not cover x86 architecture (see `x86-arch`)
- Does not cover memory management (see `memory-mgmt`)
- `stop linux-kernel-dev`: revert.