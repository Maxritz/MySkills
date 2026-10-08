---
name: memory-mgmt
description: "Memory management: virtual memory layouts, allocator hierarchy (buddy, SLAB, vmalloc, CMA, GPU), DMA & coherence, NUMA-aware allocation, validation (kmemleak, buddyinfo, numastat). Unified across kernel and userspace."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  trigger_keywords: ["virtual memory", "allocator", "buddy", "SLAB", "SLUB", "vmalloc", "CMA", "DMA", "coherence", "NUMA", "kmemleak", "buddyinfo", "pagetypeinfo", "numastat", "page tables", "page fault"]
---

# Memory Management

**Unified across kernel and userspace. Track address space, physical backing, ownership, visibility, lifetime, alignment, and synchronisation.**

---

## Virtual Memory

```
User Space (0x000000000000 - 0x00007FFFFFFFFFFF)  128 TB
Kernel Space (0xFFFF800000000000 - 0xFFFFFFFFFFFFFFFF)  128 TB
  ├── Direct Map (physmem)     0xFFFF880000000000
  ├── vmalloc/vmap              0xFFFFC00000000000
  ├── KASAN shadow             0xFFFF800000000000
  └── Modules                  0xFFFFFFFFC0000000
```

## Allocator Hierarchy

| Allocator | Use Case | Flags |
|-----------|----------|-------|
| **Buddy (page)** | Page-aligned, power-of-2 | `GFP_KERNEL`, `GFP_ATOMIC`, `GFP_DMA` |
| **SLAB/SLUB** | Object caches, fixed-size | `kmem_cache_create()`, `kmalloc()` |
| **vmalloc** | Virtually contiguous, not phys | `vmalloc()`, `vmap()` |
| **CMA** | Contiguous for DMA | `dma_alloc_from_contiguous()` |
| **GPU** | Device-local, coherent | `dma_alloc_coherent()`, `dma_map_*()` |

## DMA & Coherence

```c
// DMA mapping (Linux kernel)
struct device* dev = &pdev->dev;
dma_addr_t dma_handle;
void* cpu_addr = dma_alloc_coherent(dev, size, &dma_handle, GFP_KERNEL);
if (!cpu_addr) return -ENOMEM;

// Use cpu_addr for CPU access, dma_handle for device
dma_free_coherent(dev, size, cpu_addr, dma_handle);

// Streaming DMA (scatter-gather)
struct scatterlist sg[SG_MAX];
int nents = sg_alloc_table_from_pages(sgt, pages, ...);
dma_map_sg(dev, sgt->sgl, nents, DMA_TO_DEVICE);
// Device accesses...
dma_unmap_sg(dev, sgt->sgl, nents, DMA_TO_DEVICE);
```

## NUMA

```c
// NUMA-aware allocation (kernel)
struct page* page = alloc_pages_node(numa_node, GFP_KERNEL, order);
void* addr = page_address(page);

// Userspace: numactl / libnuma
numactl --interleave=all ./app
numa_bind(numa_nodes);
void* ptr = numa_alloc_onnode(size, node);
```

## Validation

```bash
# Memory pressure
stress-ng --vm 8 --vm-bytes 90% --timeout 60s

# Leak detection
echo 1 > /sys/kernel/debug/kmemleak
cat /sys/kernel/debug/kmemleak

# Fragmentation
cat /proc/buddyinfo
cat /proc/pagetypeinfo

# NUMA stats
numastat -p $(pidof app)
```

## Cross-Layer Workflows

### Kernel Memory Leak
1. `kmemleak` + `slabinfo` → identify leaking cache
2. Trace allocation site → find missing `kfree`/`vfree`
3. Check if leak in page tables, PML4, or kernel stacks

### DMA Corruption
1. Verify `dma_map`/`unmap` pairing, sync direction
2. Check driver `dma_ops`, IOMMU domain, buffer ownership
3. Verify cache coherency (WB vs UC), `clflush`/`clwb` if needed

### Page Fault in Kernel
1. Decode #PF error code (P=0, W=1, U=0, RSVD=1, I/D=1)
2. `do_page_fault` path, `vmalloc_fault`, `kmap_atomic`
3. Check page table state, `pgd_offset`, `pte_offset`

## Boundaries

- Does not write Linux kernel modules (see `linux-kernel-dev`)
- Does not manage userspace allocators (see `linux-user`)
- Does not cover x86 architecture (see `x86-arch`)
- Does not cover GPU memory (see `amd-gpu-stack`/`nvidia-cuda-stack`)
- `stop memory-mgmt`: revert.