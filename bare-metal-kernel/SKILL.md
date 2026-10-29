---
name: bare-metal-kernel
description: "Bare-metal OS kernel development: boot process (GRUB/Stivale2), long mode, page tables (4-level), IDT/interrupts, PCI enumeration. x86-64 kernel development from bootloader to long mode."
compatibility: opencode
---

# Bare-Metal OS Kernel

**x86-64 kernel development from bootloader to long mode.**

---

## Boot Protocol and Long-Mode Transition (Illustrative BIOS Sketch)

> This is an incomplete legacy BIOS teaching sketch, not a GRUB or Stivale2 entry point and not a complete bootloader. Real boot protocols define the entry mode, register state, memory map, image placement and hand-off contract. Verify those requirements against the selected protocol and linker script before using any code.

```asm
; boot.asm (NASM)
[BITS 16]
[ORG 0x7C00]

start:
    cli
    xor ax, ax
    mov ds, ax
    mov es, ax
    mov ss, ax
    mov sp, 0x7C00
    
    ; Load kernel from disk (BIOS INT 13h or EFI)
    ; Switch to protected mode
    lgdt [gdt_ptr]
    mov eax, cr0
    or eax, 1
    mov cr0, eax
    jmp 0x08:protected_mode

[BITS 32]
protected_mode:
    mov ax, 0x10
    mov ds, ax; mov es, ax; mov fs, ax; mov gs, ax; mov ss, ax
    mov esp, 0x90000
    
    ; Enable PAE
    mov eax, cr4
    or eax, 1 << 5
    mov cr4, eax
    
    ; Set up PML4 (identity map first 1GB)
    ; ... page table setup ...
    
    ; Enable long mode
    mov ecx, 0xC0000080  ; EFER
    rdmsr
    or eax, 1 << 8       ; LME
    wrmsr
    
    ; Enable paging
    mov eax, cr0
    or eax, 1 << 31      ; PG
    mov cr0, eax
    
    ; Jump to 64-bit
    lgdt [gdt64_ptr]
    jmp 0x08:long_mode

[BITS 64]
long_mode:
    ; Clear exactly the linker-defined BSS byte range.
    ; The symbols must resolve to valid, writable addresses in this mapping.
    extern _bss_start, _bss_end
    cld
    lea rdi, [rel _bss_start]
    lea rcx, [rel _bss_end]
    sub rcx, rdi
    xor eax, eax
    rep stosb
    
    ; Call kernel_main
    extern kernel_main
    call kernel_main
    
    hlt
    jmp $
```

## Page Tables (4-Level, 4KB Pages)

```c
// x86-64 paging structures. Allocate each table on a PAGE_SIZE-aligned,
// zeroed page. phys_addr() must translate the pointer to a physical address;
// a C pointer is not automatically a physical address.
#define PAGE_SIZE 4096
#define TABLE_ENTRIES 512
#define LARGE_PAGE_SIZE (2ULL * 1024 * 1024)
typedef uint64_t pte_t;

#define PTE_PRESENT  (1ULL << 0)
#define PTE_WRITABLE (1ULL << 1)
#define PTE_USER     (1ULL << 2)
#define PTE_PS       (1ULL << 7)
#define PTE_NX       (1ULL << 63) /* Use only after enabling EFER.NXE. */

// Platform/allocator-specific helper, intentionally not implemented here.
uint64_t phys_addr(const void *virtual_address);

// Identity-map the first 1 GiB using 2 MiB pages.
// pml4, pdpt and pd are distinct aligned, zero-initialised page-table pages.
// Before loading CR3, also verify physical-address masks, CPU paging features,
// large-page support, reserved-bit rules and the required EFER.NXE setup.
void setup_identity_mapping(pte_t *pml4, pte_t *pdpt, pte_t *pd) {
    pml4[0] = phys_addr(pdpt) | PTE_PRESENT | PTE_WRITABLE;
    pdpt[0] = phys_addr(pd)   | PTE_PRESENT | PTE_WRITABLE;

    for (uint64_t i = 0; i < TABLE_ENTRIES; ++i) {
        pd[i] = (i * LARGE_PAGE_SIZE) |
                PTE_PRESENT | PTE_WRITABLE | PTE_PS;
    }
}

// The caller must also establish the required mappings for the kernel image,
// stack, page tables, boot data and MMIO. A higher-half mapping is a separate
// operation and must use the virtual/physical layout defined by the linker.
#define KERNEL_BASE 0xFFFFFFFF80000000ULL
```

## IDT & Interrupts

> The following is a layout sketch, not a complete exception-entry implementation. The assembly stubs must normalise CPU exceptions that push an error code and those that do not, and push a vector number before entering a shared handler. The shown frame layout must exactly match that assembly. Compiler interrupt attributes have target-specific restrictions; validate generated code and calling conventions.

```c
// IDT entry (16 bytes each)
struct idt_entry {
    uint16_t offset_low;
    uint16_t selector;
    uint8_t  ist;
    uint8_t  type_attr;  // Gate type, DPL, P
    uint16_t offset_mid;
    uint32_t offset_high;
    uint32_t reserved;
} __attribute__((packed));

struct idtr {
    uint16_t limit;
    uint64_t base;
} __attribute__((packed));

// Exception handler (common stub)
__attribute__((interrupt)) void exception_handler(struct interrupt_frame* frame) {
    // frame: RIP, CS, RFLAGS, RSP, SS (pushed by CPU)
    // Error code pushed for some exceptions (#PF, #GP, etc.)
    
    kprintf("Exception %d at RIP=%lx, error=%lx\n", 
            frame->vector, frame->rip, frame->error_code);
    
    // Dump registers
    dump_registers(frame);
    
    // Panic or recover
    for (;;) asm volatile("hlt");
}

// Install IDT
void idt_init() {
    for (int i = 0; i < 256; i++) {
        idt[i] = (struct idt_entry){
            .offset_low = (uint16_t)(exception_stubs[i]),
            .selector = 0x08,  // Kernel code segment
            .ist = 0,
            .type_attr = 0x8E,  // Present, DPL=0, Interrupt Gate
            .offset_mid = (uint16_t)(exception_stubs[i] >> 16),
            .offset_high = (uint32_t)(exception_stubs[i] >> 32),
        };
    }
    
    struct idtr idtr = {.limit = sizeof(idt) - 1, .base = (uint64_t)idt};
    asm volatile("lidt %0" :: "m"(idtr));
}
```

## PCI Enumeration

```c
// Legacy PCI Configuration Mechanism #1. This requires privileged I/O-port
// access and is not a userspace routine or a substitute for PCI/ECAM support.
#define PCI_CONFIG_ADDR 0xCF8
#define PCI_CONFIG_DATA 0xCFC

static uint32_t pci_read(uint8_t bus, uint8_t dev, uint8_t func, uint8_t offset) {
    uint32_t addr = (1U << 31) | ((uint32_t)bus << 16) |
                    ((uint32_t)dev << 11) | ((uint32_t)func << 8) |
                    ((uint32_t)offset & 0xFCU);
    outl(PCI_CONFIG_ADDR, addr);
    return inl(PCI_CONFIG_DATA);
}

// Read-only enumeration: do not probe BAR sizes by writing all ones here.
// BAR sizing must account for I/O vs memory BARs, 64-bit BAR pairs, resource
// decoding and platform ownership; use the platform PCI framework for real drivers.
static void pci_scan(void) {
    for (unsigned int bus = 0; bus < 256; ++bus) {
        for (unsigned int dev = 0; dev < 32; ++dev) {
            uint32_t id0 = pci_read((uint8_t)bus, (uint8_t)dev, 0, 0x00);
            if ((id0 & 0xFFFFU) == 0xFFFFU) continue;

            uint32_t hdr = pci_read((uint8_t)bus, (uint8_t)dev, 0, 0x0C);
            unsigned int function_count = ((hdr >> 16) & 0x80U) ? 8U : 1U;

            for (unsigned int func = 0; func < function_count; ++func) {
                uint32_t id = (func == 0) ? id0 :
                    pci_read((uint8_t)bus, (uint8_t)dev, (uint8_t)func, 0x00);
                if ((id & 0xFFFFU) == 0xFFFFU) continue;

                uint16_t vendor = (uint16_t)(id & 0xFFFFU);
                uint16_t device = (uint16_t)(id >> 16);
                kprintf("PCI %02x:%02x.%u: %04x:%04x\n",
                        bus, dev, func, vendor, device);

                for (unsigned int bar = 0; bar < 6; ++bar) {
                    uint8_t offset = (uint8_t)(0x10U + bar * 4U);
                    uint32_t low = pci_read((uint8_t)bus, (uint8_t)dev,
                                            (uint8_t)func, offset);
                    if (low == 0 || low == UINT32_MAX) continue;

                    unsigned int type = (low >> 1) & 3U;
                    if ((low & 1U) == 0 && type == 2U) {
                        if (bar == 5) {
                            kprintf("  BAR%u: malformed 64-bit BAR at final slot\n", bar);
                            continue;
                        }
                        uint32_t high = pci_read((uint8_t)bus, (uint8_t)dev,
                                                 (uint8_t)func, (uint8_t)(offset + 4U));
                        kprintf("  BAR%u: 64-bit raw=%08x:%08x\n", bar, high, low);
                        ++bar; // The next BAR slot is the upper half.
                    } else {
                        kprintf("  BAR%u: raw=%08x type=%s\n", bar, low,
                                (low & 1U) ? "I/O" : "memory");
                    }
                }
            }
        }
    }
}
```

## Boundaries

- Does not write Linux kernel modules (see `linux-kernel-dev`)
- Does not cover x86 architecture details (see `x86-arch`)
- Does not cover memory management (see `memory-mgmt`)
- `stop bare-metal-kernel`: revert.

## Optional references

- [kernel-recipes.md](references/kernel-recipes.md)
