---
name: memory-management
description: Analyze or design CPU/GPU/OS memory behavior including virtual memory, allocators, NUMA, DMA, pinned/pageable memory, cache/coherence, synchronization, and fragmentation.
---

# Memory management

Track address space, physical backing, ownership, visibility, lifetime, alignment, and synchronization separately.

1. Draw the allocation and access path from producer to consumer, including device, NUMA node, mapping, and cache domain.
2. Check bounds, alignment, aliasing, pinning, residency, page faults, DMA direction, fencing, and reclamation.
3. Measure with platform tools before changing allocators or placement; distinguish capacity, bandwidth, latency, and fragmentation.
4. Make ownership and failure cleanup explicit, including partial allocation and device-loss paths.
5. Validate stress, concurrency, boundary sizes, pressure/eviction, and a leak/use-after-free detector.

Add `linux-kernel`, `windows-system-architecture`, `rocr-runtime`, or `cuda-stack` only for the active platform boundary.
