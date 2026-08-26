---
name: linux-kernel
description: Develop, configure, build, debug, or port Linux kernel code, modules, drivers, memory management, scheduling, tracing, or DMA paths. Use for kernel-space or kernel/driver boundary work.
---

# Linux kernel

Start from the subsystem contract and the running kernel configuration. Do not treat a userspace symptom as proof of a kernel defect.

1. Capture kernel version/commit, architecture, config, firmware, hardware, boot parameters, and exact reproducer.
2. Localize the first bad state using logs, tracepoints, lockdep, sanitizers, ftrace, perf, or subsystem tooling.
3. Check lifetime, locking, refcounts, IRQ context, DMA mapping, user-copy validation, and error unwinding.
4. Make the smallest patch that preserves subsystem conventions and stable ABI expectations.
5. Build the affected config, run the original reproducer, then targeted and regression tests.

Load `memory-management` for MM/DMA/NUMA analysis and `x86-architecture` for paging, interrupt, or instruction-level evidence.
