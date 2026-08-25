---
name: os-kernel
description: "OS kernel: x86-64, paging, IDT, PCI, AHCI."
license: MIT
compatibility: opencode
---

# OS Kernel Development

## Boot Process (x86-64)

1. BIOS/UEFI → bootloader (GRUB/Stivale2) → 64-bit long mode.
2. Set up GDT (Global Descriptor Table): code/data segments, TSS.
3. Enable PAE + long mode paging. Identity-map or higher-half kernel.
4. Reload segments; jump to 64-bit C entry point.
5. Clear BSS; set up stack; call `kernel_main`.

## Memory Management

- Page tables: PML4 → PDPT → PD → PT (4-level paging, 4KB pages).
- Page flags: Present, Read/Write, User/Supervisor, NX (no-execute).
- Physical frame allocator (bitmap or free-list). Virtual allocator (heap).
- Guard pages for stacks to catch overflow.

## Interrupts & Exceptions

- IDT (Interrupt Descriptor Table): 256 entries, gate types (trap/interrupt).
- Exceptions: #GP, #PF, #UD, #SS, division-by-zero, general-protection.
- IRQs: legacy PIC (0x20-0x2F) or APIC (remap to 0x20-0x2F).
- Handler: save registers, handle, restore, `iretq`.

## PCI & Devices

- PCI enumeration: scan bus/device/function. Read config space.
- BAR sizing: write 0xFFFFFFFF, read back, mask to get size.
- Drivers: register handlers for device interrupts. MMIO vs port I/O.

## Linux Kernel Modules

- Module init/exit: `module_init()`, `module_exit()`.
- `struct file_operations` for char drivers.
- `alloc_chrdev_region` / `cdev_init` / `cdev_add` for device registration.
- Never sleep in interrupt context (`GFP_ATOMIC` for allocations).
- Use `container_of` macro for embedded structs.

## Concurrency

- Spinlocks for short critical sections in interrupt context.
- Mutexes for long sections that may sleep.
- RCU (Read-Copy-Update) for lock-free reads.
- Atomic ops: `atomic_inc`, `cmpxchg`, `__sync_*`, `__atomic_*`.

## Debugging

- `qemu -s -S` + GDB for live debugging. Serial port output (`0x3F8`).
- Kernel panic: dump registers, stack trace. Use `kprintf` with format checking.
- Memory debugging: `mmap` guard pages, KASAN for kernel address sanitizer.
