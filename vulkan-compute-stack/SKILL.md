---
name: vulkan-compute-stack
description: "Unified Vulkan compute: instance, device, memory, buffers, descriptors, command buffers, synchronization, shaders (GLSL→SPIR-V), validation, profiling. Vulkan SDK 1.4.357.0."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: false
  trigger_keywords: ["Vulkan", "VK_KHR", "SPIR-V", "glslc", "VMA", "compute shader", "descriptor", "command buffer", "fence", "semaphore", "subgroup", "cooperative matrix"]
---
# Vulkan Compute Stack

Use this skill for Vulkan runtime/API, device queues, memory, descriptors, dispatch, synchronisation, shader execution and cross-vendor correctness. The core is a decision and validation workflow; load detailed API boilerplate from `references/api-patterns.md` only when implementing or inspecting those mechanisms.

## Version and target gate

Record the Vulkan loader and headers, application API version, physical-device API version, driver, vendor/device ID, OS, enabled layers/extensions/features and queue-family capabilities. Query advertised support. Do not infer that an optional feature is enabled merely because an API version supports it; enable feature structures correctly and provide a fallback or an explicit unsupported-target error. The API-pattern examples are abbreviated patterns and must be checked against the exact headers and feature chain used by the project.

## Work sequence

1. Capture the first failing API result, validation-layer output, GPU/device, driver, app revision and relevant feature/extension setup.
2. Follow the real path: instance → physical-device selection → queue family/device → allocations and descriptors → command recording/submission → synchronisation → shader/pipeline → readback.
3. Prove device suitability against the workload, not just device-name matching. Check queue flags, extensions, feature bits, memory heaps/types, descriptor and push-constant limits, workgroup limits and format capabilities.
4. Check allocation sizes, alignment, memory-type flags, map/flush/invalidate rules, descriptor ranges, buffer usage flags, pipeline layouts and lifetimes.
5. Make submission and lifetime rules explicit. A queue submission, fence, semaphore, memory barrier and host readback solve different ordering or visibility problems. Choose the scope that matches the producer and consumer.
6. Validate small deterministic shader inputs against a CPU oracle before tuning. Include boundary dimensions, partial workgroups and repeated dispatch.
7. Optimise only after profiling separates CPU submission/launch overhead, queue waits, memory traffic, cache behaviour, occupancy and shader execution. Re-measure correctness and speed after each material change.

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

## Cross-vendor rules

- Validate on the exact vendor/driver pair; record capability queries and fallback behaviour.
- Do not assume identical subgroup widths, scheduling, cache policy, heap layout or extension support across devices.
- Keep API support, hardware capability and performance observations distinct.
- A validation-layer clean run does not prove race freedom, lifetime safety on all schedules or numerical equivalence.
- For a GPU hang or device loss, preserve the minimal reproducer and crash/validation logs; disable one optional feature at a time rather than changing multiple layers together.

## Validation and report

Use the detailed validation matrix below as relevant. Record API/driver/device, queried and enabled capabilities, exact build/shader compiler, validation output, reference-test tolerances, performance workload and checks not run. Mark hardware-only checks BLOCKED or NOT RUN when no target device is available.

## 7. Validation & Profiling

### Validation Layers
```cpp
// Enable in VkInstanceCreateInfo
const char* layers[] = {"VK_LAYER_KHRONOS_validation"};
VkInstanceCreateInfo create_info = {
    // ...
    .enabledLayerCount = 1,
    .ppEnabledLayerNames = layers,
};

// Disable in production
#ifdef NDEBUG
create_info.enabledLayerCount = 0;
#endif
```

### GPU Markers (Debug Utils)
```cpp
// Begin region
VkDebugUtilsLabelEXT label = {
    .sType = VK_STRUCTURE_TYPE_DEBUG_UTILS_LABEL_EXT,
    .pLabelName = "Dequantize Kernel",
    .color = {1.0f, 0.0f, 0.0f, 1.0f},
};
vkCmdBeginDebugUtilsLabelEXT(command_buffer, &label);

// ... dispatch ...

vkCmdEndDebugUtilsLabelEXT(command_buffer);
```

### Performance Queries
```cpp
// Timestamp queries for GPU timing
VkQueryPoolCreateInfo query_info = {
    .sType = VK_STRUCTURE_TYPE_QUERY_POOL_CREATE_INFO,
    .queryType = VK_QUERY_TYPE_TIMESTAMP,
    .queryCount = 2,
};
VkQueryPool query_pool;
vkCreateQueryPool(device, &query_info, nullptr, &query_pool);

// In command buffer
vkCmdWriteTimestamp2(command_buffer, VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT, query_pool, 0);
// ... dispatch ...
vkCmdWriteTimestamp2(command_buffer, VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT, query_pool, 1);

// On host
uint64_t timestamps[2];
vkGetQueryPoolResults(device, query_pool, 0, 2, sizeof(timestamps), timestamps, sizeof(uint64_t), VK_QUERY_RESULT_64_BIT | VK_QUERY_RESULT_WAIT_BIT);
float gpu_time_ns = (timestamps[1] - timestamps[0]) * timestamp_period;  // From VkPhysicalDeviceProperties::limits.timestampPeriod
```

---

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

## Boundaries

- Does not write shader code (receives shaders to validate/optimize)
- Does not manage Vulkan SDK installation
- `stop vulkan-compute-stack`: revert.