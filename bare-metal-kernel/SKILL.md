---
name: bare-metal-kernel
description: "Bare-metal OS kernel development: boot process (GRUB/Stivale2), long mode, page tables (4-level), IDT/interrupts, PCI enumeration. x86-64 kernel development from bootloader to long mode."
compatibility: opencode
---
# Bare-Metal OS Kernel

Use this skill for x86-64 boot, paging, interrupts and PCI enumeration. Record boot protocol, linker layout, compiler/ABI, emulator/hardware and last verified checkpoint.

## Stage router

| Stage | Invariants to prove |
|---|---|
| Boot to long mode | expected entry point, CPU mode, stack, descriptor tables and linker symbols |
| Page tables | address canonicality, mapping coverage, permissions, alignment and physical/virtual translation |
| IDT/interrupts | valid descriptors/handlers, stack and privilege transitions, correct interrupt-state handling |
| PCI enumeration | configuration-space access, bus traversal, BAR size/bounds, capability and device enablement |

Detailed stage procedures and examples: [bare-metal recipes](references/kernel-recipes.md).

## Validation sequence

1. Verify the exact build artefact, linker map and boot configuration.
2. Test each boot checkpoint independently and record the last stage reached.
3. Exercise fault/error paths where safe; check page permissions, interrupt exceptions and BAR bounds.
4. Distinguish emulator coverage from physical hardware coverage; never claim a later stage worked because the bootloader ran.

## Evidence gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

## Boundaries

Use `x86-arch` for ISA/ABI details and `low-level-toolkit` for assembly, emulation and toolchains.
