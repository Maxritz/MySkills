---
name: emulation
description: Design, implement, debug, or validate CPU, ISA, device, system, or API emulators and simulators, including translation, timing, determinism, snapshots, and conformance.
---

# Emulation and simulation

Define the emulation boundary and fidelity target before choosing interpretation, JIT, binary translation, or hardware acceleration.

1. Specify architectural state, memory map, devices, interrupts, timing model, nondeterminism, and guest/host ABI.
2. Implement a minimal reference path first; isolate translated blocks and device models behind interfaces.
3. Preserve exceptions, flags, atomics, memory ordering, privilege, alignment, and observable timing where required.
4. Differential-test against a trusted implementation, conformance suite, trace, or hardware reference.
5. Add snapshot/restore, deterministic replay, fuzzing, and invalid-input handling before broad optimization.

Add `x86-architecture`, `assembler`, `memory-management`, or `cross-porting` only for the specific emulated boundary.
