---
name: bare-metal-kernel
description: "Bare-metal OS kernel development: boot process (GRUB/Stivale2), long mode, page tables (4-level), IDT/interrupts, PCI enumeration. x86-64 kernel development from bootloader to long mode."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  trigger_keywords: ["bootloader", "GRUB", "Stivale2", "long mode", "page tables", "PML4", "IDT", "interrupts", "PCI", "bare metal", "kernel", "boot", "x86-64", "kernel_main"]
---

# Bare-Metal OS Kernel

**x86-64 kernel development from bootloader to long mode.**

---

## Boot Process (GRUB/Stivale2 → Long Mode)

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
    ; Clear BSS
    extern _bss_start, _bss_end
    mov rdi, _bss_start
    mov rcx, (_bss_end - _bss_start) / 8
    xor rax, rax
    rep stosq
    
    ; Call kernel_main
    extern kernel_main
    call kernel_main
    
    hlt
    jmp $
```

## Page Tables (4-Level, 4KB Pages)

```c
// x86_64 paging structures
#define PAGE_SIZE 4096
#define PML4_ENTRIES 512
#define PDPT_ENTRIES 512
#define PD_ENTRIES 512
#define PT_ENTRIES 512

typedef uint64_t pte_t;

#define PTE_PRESENT    (1ULL << 0)
#define PTE_WRITABLE   (1ULL << 1)
#define PTE_USER       (1ULL << 2)
#define PTE_NX         (1ULL << 63)

// Identity map first 1GB (512 * 2MB = 1GB via huge pages)
void setup_identity_mapping(pte_t* pml4) {
    // PDPT entry 0 -> PD
    pte_t* pd = alloc_page();
    pml4[0] = (uint64_t)pd | PTE_PRESENT | PTE_WRITABLE;
    
    // PD entries 0-511 -> 2MB pages
    for (int i = 0; i < 512; i++) {
        pd[i] = (i * 2 * 1024 * 1024) | PTE_PRESENT | PTE_WRITABLE | (1ULL << 7); // PS=1 (2MB)
    }
}

// Kernel virtual address space (higher-half)
#define KERNEL_BASE 0xFFFFFFFF80000000
void map_kernel(pte_t* pml4, void* phys_start, size_t size) {
    // Map kernel at KERNEL_BASE with 4KB pages
    // ...
}
```

## IDT & Interrupts

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
// PCI config space access (IO ports)
#define PCI_CONFIG_ADDR  0xCF8
#define PCI_CONFIG_DATA  0xCFC

uint32_t pci_read(uint8_t bus, uint8_t dev, uint8_t func, uint8_t offset) {
    uint32_t addr = (1U << 31) | (bus << 16) | (dev << 11) | (func << 8) | (offset & 0xFC);
    outl(PCI_CONFIG_ADDR, addr);
    return inl(PCI_CONFIG_DATA);
}

void pci_scan() {
    for (uint8_t bus = 0; bus < 256; bus++) {
        for (uint8_t dev = 0; dev < 32; dev++) {
            for (uint8_t func = 0; func < 8; func++) {
                uint32_t vendor_device = pci_read(bus, dev, func, 0);
                if ((vendor_device & 0xFFFF) != 0xFFFF) {
                    uint16_t vendor = vendor_device & 0xFFFF;
                    uint16_t device = vendor_device >> 16;
                    kprintf("PCI %02x:%02x.%d: %04x:%04x\n", bus, dev, func, vendor, device);
                    
                    for (int bar = 0; bar < 6; bar++) {
                        uint32_t bar_val = pci_read(bus, dev, func, 0x10 + bar * 4);
                        if (bar_val) {
                            pci_write(bus, dev, func, 0x10 + bar * 4, 0xFFFFFFFF);
                            uint32_t size_mask = pci_read(bus, dev, func, 0x10 + bar * 4);
                            pci_write(bus, dev, func, 0x10 + bar * 4, bar_val);
                            size_t size = (~size_mask) + 1;
                            kprintf("  BAR%d: %08x size=%zu\n", bar, bar_val, size);
                        }
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