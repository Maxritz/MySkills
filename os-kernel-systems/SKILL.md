---
name: os-kernel-systems
description: "Unified OS kernel: Linux kernel (modules, drivers, tracing), OS kernel dev (boot, paging, IDT, PCI), x86-64 architecture (ISA, paging, caches, SIMD), memory management (virtual memory, allocators, NUMA, DMA). Kernel-space and kernel/driver boundary work."
compatibility: opencode
metadata:
  loading: on-demand
  auto_trigger: true
  trigger_keywords: ["Linux kernel", "kernel module", "driver", "bootloader", "paging", "IDT", "PCI", "x86-64", "virtual memory", "DMA", "NUMA", "KASAN", "ftrace", "perf"]
---

# OS Kernel Systems

**Unified across Linux kernel, bare-metal OS development, x86-64 architecture, and memory management.** Choose the layer matching your task.

---

## 1. Linux Kernel Development

### Mandatory Capture
```
Kernel version: 6.10.0 / commit abc123
Architecture: x86_64 / arm64
Config: defconfig + CONFIG_DEBUG_INFO=y + CONFIG_KASAN=y
Hardware: CPU model, firmware, exact device
Boot params: cmdline, initrd, secure boot state
Reproducer: exact steps, dmesg snippet, crash dump
```

### Subsystem Localization
| Subsystem | Tools | Key Checks |
|-----------|-------|------------|
| **Memory/MM** | `kmemleak`, KASAN, `slabinfo`, `vmstat` | Page allocation, compound pages, page migration, NUMA |
| **Scheduler** | `schedstat`, `perf sched`, tracepoints | CFS, RT, DL, wakeup latency, affinity |
| **Block/IO** | `blktrace`, `btt`, `iolatency` | Request queue, elevator, bio splitting, flush |
| **Network** | `tcpdump`, `dropmonitor`, `netdevsim` | SKB lifecycle, NAPI, XDP, TC |
| **Drivers** | `devlink`, `dmesg -T`, `lsmod` | Probe order, PM runtime, MSI/MSI-X, DMA mapping |
| **Locking** | `lockdep`, `lockstat`, `mutex_debug` | Lock ordering, deadlock, IRQ safety, RCU grace periods |

### Debugging Workflow
```bash
# 1. Early boot: qemu + GDB
qemu-system-x86_64 -kernel bzImage -initrd initrd.img -s -S -append "earlyprintk=serial"

# 2. Runtime: ftrace
echo function > /sys/kernel/debug/tracing/current_tracer
echo schedule > /sys/kernel/debug/tracing/set_ftrace_filter
cat /sys/kernel/debug/tracing/trace

# 3. Crash: kdump + crash
crash vmlinux /var/crash/vmcore

# 4. Memory: KASAN
echo 1 > /sys/kernel/debug/kasan/enable
# Boot with: kasan=on page_poison=1 slub_debug=P

# 5. Locking: lockdep
echo 1 > /sys/kernel/debug/lockdep/enable
```

### Module Development
```c
// Minimal module structure
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/device.h>
#include <linux/uaccess.h>
#include <linux/slab.h>
#include <linux/mutex.h>

#define DEVICE_NAME "mydev"
#define CLASS_NAME "myclass"

static dev_t dev_num;
static struct cdev my_cdev;
static struct class* my_class;
static struct device* my_device;
static DEFINE_MUTEX(dev_mutex);
static char* buffer;
static size_t buffer_size;

static int my_open(struct inode* inode, struct file* file) {
    mutex_lock(&dev_mutex);
    // ...
    mutex_unlock(&dev_mutex);
    return 0;
}

static ssize_t my_read(struct file* file, char __user* ubuf, size_t count, loff_t* ppos) {
    if (*ppos >= buffer_size) return 0;
    size_t to_copy = min(count, buffer_size - *ppos);
    if (copy_to_user(ubuf, buffer + *ppos, to_copy)) return -EFAULT;
    *ppos += to_copy;
    return to_copy;
}

static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = my_open,
    .read = my_read,
    .write = my_write,
    .release = my_release,
    .llseek = default_llseek,
};

static int __init my_init(void) {
    int ret;
    
    // Allocate major/minor
    ret = alloc_chrdev_region(&dev_num, 0, 1, DEVICE_NAME);
    if (ret) return ret;
    
    // Initialize cdev
    cdev_init(&my_cdev, &fops);
    my_cdev.owner = THIS_MODULE;
    ret = cdev_add(&my_cdev, dev_num, 1);
    if (ret) goto err_cdev;
    
    // Create sysfs entries
    my_class = class_create(THIS_MODULE, CLASS_NAME);
    if (IS_ERR(my_class)) { ret = PTR_ERR(my_class); goto err_class; }
    
    my_device = device_create(my_class, NULL, dev_num, NULL, DEVICE_NAME);
    if (IS_ERR(my_device)) { ret = PTR_ERR(my_device); goto err_device; }
    
    buffer = kmalloc(PAGE_SIZE, GFP_KERNEL);
    if (!buffer) { ret = -ENOMEM; goto err_buffer; }
    buffer_size = PAGE_SIZE;
    
    pr_info("mydev: loaded, major=%d\n", MAJOR(dev_num));
    return 0;

err_buffer: device_destroy(my_class, dev_num);
err_device: class_destroy(my_class);
err_class:  cdev_del(&my_cdev);
err_cdev:   unregister_chrdev_region(dev_num, 1);
    return ret;
}

static void __exit my_exit(void) {
    kfree(buffer);
    device_destroy(my_class, dev_num);
    class_destroy(my_class);
    cdev_del(&my_cdev);
    unregister_chrdev_region(dev_num, 1);
    pr_info("mydev: unloaded\n");
}

module_init(my_init);
module_exit(my_exit);
MODULE_LICENSE("GPL");
MODULE_AUTHOR("Name");
MODULE_DESCRIPTION("Minimal char device");
```

### Validation Gates
| Gate | Command | Pass Criteria |
|------|---------|---------------|
| **Build** | `make -j$(nproc) W=1` | 0 warnings (or documented) |
| **Static** | `sparse -Wbitwise -Wcontext -Wcast /` | 0 new warnings |
| **KASAN** | Boot with `kasan=on` | No splats on reproducer |
| **Lockdep** | Boot with `lockdep=on` | No splats on reproducer |
| **Reproducer** | `insmod mymod.ko; test.sh` | Expected behavior |
| **Regression** | `kselftest / kunit` | All pass |

---

## 2. Bare-Metal OS Kernel (x86-64)

### Boot Process (GRUB/Stivale2 → Long Mode)
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

### Page Tables (4-Level, 4KB Pages)
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

### IDT & Interrupts
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

### PCI Enumeration
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
                    
                    // Read BARs
                    for (int bar = 0; bar < 6; bar++) {
                        uint32_t bar_val = pci_read(bus, dev, func, 0x10 + bar * 4);
                        if (bar_val) {
                            // Size by writing all 1s
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

---

## 3. x86-64 Architecture Deep-Dive

### ISA Contracts (Guaranteed by Architecture)
| Guarantee | Description |
|-----------|-------------|
| **Memory ordering** | TSO (Total Store Order): stores not reordered with loads, loads not reordered with stores |
| **Atomicity** | Aligned 8/16/32/64-bit loads/stores atomic |
| **Privilege** | Ring 0 (kernel) vs Ring 3 (user), SMEP/SMAP |
| **Paging** | 4-level, 4KB/2MB/1GB pages, NX, PCID, ASID |
| **Interrupts** | IDT, IST, APIC, TPR, EOI |
| **CPUID** | Feature enumeration, vendor, family/model/stepping |

### Microarchitectural Observations (Not Guaranteed)
| Behavior | Varies By | Measure With |
|----------|-----------|--------------|
| **Cache hierarchy** | L1/L2/L3 size, associativity, latency | `perf stat -e cache-references,cache-misses` |
| **Branch prediction** | BTB size, RAS, indirect predictor | `perf stat -e branch-misses` |
| **SIMD throughput** | AVX-512 vs AVX2 vs SSE, port contention | `perf stat -e fp_arith_inst_retired.*` |
| **Memory bandwidth** | Channel count, DDR version, NUMA | `perf stat -e mem_load_retired.*` |

### SIMD (AVX-512 / AVX2 / SSE)
```c
// AVX-512: 512-bit = 16 float32 / 8 float64 / 64 int8
#include <immintrin.h>

// FMA: a * b + c (single rounding)
__m512 a = _mm512_loadu_ps(ptr_a);
__m512 b = _mm512_loadu_ps(ptr_b);
__m512 c = _mm512_loadu_ps(ptr_c);
__m512 d = _mm512_fmadd_ps(a, b, c);  // d = a*b + c
_mm512_storeu_ps(ptr_d, d);

// Masked operations (avoid branches)
__mmask16 mask = _mm512_cmp_ps_mask(a, b, _CMP_GT_OQ);
__m512 result = _mm512_mask_add_ps(_mm512_setzero_ps(), mask, a, b);

// Capability check
bool has_avx512f = false;
uint32_t eax, ebx, ecx, edx;
__cpuid_count(7, 0, eax, ebx, ecx, edx);
has_avx512f = (ebx & (1 << 16)) != 0;

// Fallback
if (has_avx512f) { kernel_avx512(); }
else { kernel_avx2(); }
```

### Performance Analysis
```bash
# Top-down analysis (Intel)
perf stat -e cycles,instructions,cache-references,cache-misses,branch-misses ./app

# Detailed pipeline
perf stat -e \
  cpu/cycles/,cpu/instructions/,cpu/branch-misses/,cpu/cache-misses/, \
  cpu/L1-dcache-load-misses/,cpu/LLC-load-misses/, \
  cpu/stall-cycles-frontend/,cpu/stall-cycles-backend/ ./app

# Per-function
perf record -g ./app
perf report --stdio
```

---

## 4. Memory Management (Unified)

### Virtual Memory
```
User Space (0x000000000000 - 0x00007FFFFFFFFFFF)  128 TB
Kernel Space (0xFFFF800000000000 - 0xFFFFFFFFFFFFFFFF)  128 TB
  ├── Direct Map (physmem)     0xFFFF880000000000
  ├── vmalloc/vmap              0xFFFFC00000000000
  ├── KASAN shadow             0xFFFF800000000000
  └── Modules                  0xFFFFFFFFC0000000
```

### Allocator Hierarchy
| Allocator | Use Case | Flags |
|-----------|----------|-------|
| **Buddy (page)** | Page-aligned, power-of-2 | `GFP_KERNEL`, `GFP_ATOMIC`, `GFP_DMA` |
| **SLAB/SLUB** | Object caches, fixed-size | `kmem_cache_create()`, `kmalloc()` |
| **vmalloc** | Virtually contiguous, not phys | `vmalloc()`, `vmap()` |
| **CMA** | Contiguous for DMA | `dma_alloc_from_contiguous()` |
| **GPU** | Device-local, coherent | `dma_alloc_coherent()`, `dma_map_*()` |

### DMA & Coherence
```c
// DMA mapping (Linux kernel)
struct device* dev = &pdev->dev;
dma_addr_t dma_handle;
void* cpu_addr = dma_alloc_coherent(dev, size, &dma_handle, GFP_KERNEL);
if (!cpu_addr) return -ENOMEM;

// Use cpu_addr for CPU access, dma_handle for device
// ...
dma_free_coherent(dev, size, cpu_addr, dma_handle);

// Streaming DMA (scatter-gather)
struct scatterlist sg[SG_MAX];
int nents = sg_alloc_table_from_pages(sgt, pages, ...);
dma_map_sg(dev, sgt->sgl, nents, DMA_TO_DEVICE);
// Device accesses...
dma_unmap_sg(dev, sgt->sgl, nents, DMA_TO_DEVICE);
```

### NUMA
```c
// NUMA-aware allocation
struct page* page = alloc_pages_node(numa_node, GFP_KERNEL, order);
void* addr = page_address(page);

// Userspace: numactl / libnuma
numactl --interleave=all ./app
// Or programmatically:
numa_bind(numa_nodes);
void* ptr = numa_alloc_onnode(size, node);
```

### Validation
```bash
# Memory pressure
stress-ng --vm 8 --vm-bytes 90% --timeout 60s

# Leak detection
echo 1 > /sys/kernel/debug/kmemleak
# ... run workload ...
cat /sys/kernel/debug/kmemleak

# Fragmentation
cat /proc/buddyinfo
cat /proc/pagetypeinfo

# NUMA stats
numastat -p $(pidof app)
```

---

## Cross-Layer Workflows

### Kernel Memory Leak
1. **Memory Mgmt** → `kmemleak` + `slabinfo` → identify leaking cache
2. **Linux Kernel** → trace allocation site → find missing `kfree`/`vfree`
3. **Arch** → check if leak in page tables, PML4, or kernel stacks

### DMA Corruption
1. **Memory Mgmt** → verify `dma_map`/`unmap` pairing, sync direction
2. **Linux Kernel** → check driver `dma_ops`, IOMMU domain, buffer ownership
3. **Arch** → verify cache coherency (WB vs UC), `clflush`/`clwb` if needed

### Page Fault in Kernel
1. **Arch** → decode #PF error code (P=0, W=1, U=0, RSVD=1, I/D=1)
2. **Linux Kernel** → `do_page_fault` path, `vmalloc_fault`, `kmap_atomic`
3. **Memory Mgmt** → check page table state, `pgd_offset`, `pte_offset`

---

## Output Report

```
OS KERNEL SYSTEMS: <layer> ANALYSIS
LAYER: <linux-kernel|bare-metal|x86-arch|memory-mgmt>
KERNEL: <version/commit> <config>
HARDWARE: <CPU> <RAM> <NUMA nodes>
ISSUE: <crash|leak|performance|correctness>
LOCALIZATION: <subsystem> <function> <line>
ROOT CAUSE: <locking|lifetime|mapping|ordering|hardware>
FIX: <patch summary>
VALIDATION: build✅ kasan✅ lockdep✅ reproducer✅ regression✅
BLOCKERS: <unsigned module|tainted kernel|proprietary driver>
```

---

## Boundaries

- Does not write userspace C/C++ (see `c-systems`)
- Does not manage userspace memory allocators (see `linux-user-systems`)
- Does not optimize GPU kernels (see `amd-gpu-stack`/`nvidia-cuda-stack`)
- `stop os-kernel-systems`: revert.