---
name: vulkan-compute-stack
description: "Unified Vulkan compute: instance, device, memory, buffers, descriptors, command buffers, synchronization, shaders (GLSL→SPIR-V), validation, profiling. Vulkan SDK 1.4.357.0."
compatibility: opencode
---

# Vulkan Compute Stack

**Vulkan SDK 1.4.357.0** — current supported version. Unified across instance/device setup, memory, compute pipelines, synchronization, and shader compilation.

## Layer Map

| Layer | Focus | When to Use |
|-------|-------|-------------|
| **Instance/Device** | Physical device selection, queue families, features | Setup, capability query |
| **Memory (VMA)** | Allocator, buffer/image allocation, mapping | Memory management, staging |
| **Buffers/Descriptors** | Storage/uniform buffers, descriptor sets, push constants | Resource binding |
| **Command Buffers** | Recording, dispatch, barriers, submission | Execution |
| **Synchronization** | Fences, semaphores, events, timeline | CPU-GPU, GPU-GPU sync |
| **Shaders** | GLSL→SPIR-V, subgroup, cooperative matrix | Kernel development |
| **Validation/Profiling** | VK_LAYER_KHRONOS_validation, GPU markers | Debug, performance |

---

## Implementation recipes (optional)

Detailed device, allocation, descriptor, command-buffer, synchronisation and shader examples are in [`references/implementation-recipes.md`](references/implementation-recipes.md). Read the relevant section only when implementing that layer. Examples must be checked against the exact Vulkan headers, SDK, driver and supported feature set.

## Cross-Vendor Considerations

| Feature | NVIDIA | AMD | Intel | Apple (MoltenVK) |
|---------|--------|-----|-------|------------------|
| **Subgroup size** | 32 | 64 (RDNA), 32 (CDNA) | 32 | 32 |
| **Cooperative matrix** | GL_KHR_cooperative_matrix | Same | Same | Limited |
| **Buffer device address** | VK_KHR_buffer_device_address | Same | Same | No |
| **Timeline semaphores** | Yes | Yes | Yes | Yes |
| **Synchronization2** | Yes | Yes | Yes | Yes |
| **Validation layer** | Full | Full | Full | Partial |

**Always test on target vendor.** Capability queries required.

---

## Validation Matrix

| Layer | Correctness | Performance | Portability |
|-------|-------------|-------------|-------------|
| **Setup** | Validation layer clean | Device selection logic | Instance extensions |
| **Memory** | VMA no leaks, correct mapping | Allocation speed, VRAM usage | Memory type fallback |
| **Descriptors** | Binding matching shader | Descriptor indexing, updates | Descriptor set layout |
| **Commands** | Barrier correctness | Dispatch efficiency, batching | Queue family |
| **Shaders** | SPIR-V validation | Occupancy, register pressure | Subgroup/coop matrix |
| **Sync** | No deadlocks, correct ordering | Fence/semaphore overhead | Timeline vs binary |

---

## Output Report

```
VULKAN COMPUTE STACK: <layer> ANALYSIS
RECORDED: Vulkan SDK 1.4.357.0, API 1.3, GPU <vendor/model>, Driver <ver>
LAYER: <instance|memory|descriptors|commands|sync|shaders|validation>
FINDINGS: <ranked issues with evidence>
SHADER: GLSL→SPIR-V ✅, subgroup <size>, coop matrix <support>
MEMORY: VMA <usage>, allocations <count>, leaks <0>
SYNC: fence/semaphore/timeline correct ✅/❌
VALIDATION: layers clean ✅/❌, GPU markers ✅/❌
BLOCKERS: <missing extensions, vendor gaps, MoltenVK limits>
```

---

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Record device, architecture, driver, loader, SDK, enabled features and validation layers. Trace host submission through queue execution, memory visibility and completion; compilation alone does not prove execution, and host time must not be reported as device time.


## Boundaries

- Does not write shader code (receives shaders to validate/optimize)
- Does not manage Vulkan SDK installation
- `stop vulkan-compute-stack`: revert.