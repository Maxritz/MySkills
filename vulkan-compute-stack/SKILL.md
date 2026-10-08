---
name: vulkan-compute-stack
description: "Unified Vulkan compute: instance, device, memory, buffers, descriptors, command buffers, synchronization, shaders (GLSL→SPIR-V), validation, profiling. Vulkan SDK 1.4.357.0."
compatibility: opencode
metadata:
  loading: on-demand
  auto_trigger: true
  trigger_keywords: ["Vulkan", "VK_KHR", "SPIR-V", "glslc", "VMA", "compute shader", "descriptor", "command buffer", "fence", "semaphore", "subgroup", "cooperative matrix"]
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

## 1. Instance & Device Setup

### Instance Creation
```cpp
VkApplicationInfo app_info = {
    .sType = VK_STRUCTURE_TYPE_APPLICATION_INFO,
    .pApplicationName = "MyComputeApp",
    .applicationVersion = VK_MAKE_VERSION(1, 0, 0),
    .apiVersion = VK_API_VERSION_1_3,  // Vulkan 1.3 baseline
};

const char* extensions[] = {
    VK_KHR_GET_PHYSICAL_DEVICE_PROPERTIES_2_EXTENSION_NAME,
    VK_KHR_PORTABILITY_ENUMERATION_EXTENSION_NAME,  // macOS/iOS
};

VkInstanceCreateInfo create_info = {
    .sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO,
    .pApplicationInfo = &app_info,
    .enabledExtensionCount = 1,
    .ppEnabledExtensionNames = extensions,
    .flags = VK_INSTANCE_CREATE_ENUMERATE_PORTABILITY_BIT_KHR,  // macOS
};

VkInstance instance;
vkCreateInstance(&create_info, nullptr, &instance);
```

### Physical Device Selection
```cpp
uint32_t device_count = 0;
vkEnumeratePhysicalDevices(instance, &device_count, nullptr);
std::vector<VkPhysicalDevice> devices(device_count);
vkEnumeratePhysicalDevices(instance, &device_count, devices.data());

for (auto device : devices) {
    VkPhysicalDeviceProperties props;
    vkGetPhysicalDeviceProperties(device, &props);
    
    // Prefer discrete GPU for compute
    if (props.deviceType == VK_PHYSICAL_DEVICE_TYPE_DISCRETE_GPU) {
        // Check compute queue family
        uint32_t queue_count = 0;
        vkGetPhysicalDeviceQueueFamilyProperties(device, &queue_count, nullptr);
        std::vector<VkQueueFamilyProperties> queues(queue_count);
        vkGetPhysicalDeviceQueueFamilyProperties(device, &queue_count, queues.data());
        
        for (uint32_t i = 0; i < queue_count; ++i) {
            if (queues[i].queueFlags & VK_QUEUE_COMPUTE_BIT) {
                // Found compute queue
                selected_device = device;
                compute_queue_family = i;
                break;
            }
        }
    }
    
    // Check limits
    VkPhysicalDeviceLimits limits = props.limits;
    // maxComputeWorkGroupSize: typically 1024x1024x64
    // maxComputeWorkGroupInvocations: typically 1024
    // maxComputeSharedMemorySize: typically 48-163 KB
}
```

### Device Creation (Vulkan 1.3 Features)
```cpp
// Enable features needed for compute
VkPhysicalDeviceFeatures2 features2 = {
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_FEATURES_2,
    .pNext = &vulkan13_features,
};

VkPhysicalDeviceVulkan13Features vulkan13_features = {
    .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_VULKAN_1_3_FEATURES,
    .synchronization2 = VK_TRUE,
    .subgroupSizeControl = VK_TRUE,
    .computeFullSubgroups = VK_TRUE,
    .shaderIntegerDotProduct = VK_TRUE,  // For cooperative matrix
    .shaderDemoteToHelperInvocation = VK_TRUE,
};

float queue_priority = 1.0f;
VkDeviceQueueCreateInfo queue_info = {
    .sType = VK_STRUCTURE_TYPE_DEVICE_QUEUE_CREATE_INFO,
    .queueFamilyIndex = compute_queue_family,
    .queueCount = 1,
    .pQueuePriorities = &queue_priority,
};

VkDeviceCreateInfo device_info = {
    .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
    .pNext = &features2,
    .queueCreateInfoCount = 1,
    .pQueueCreateInfos = &queue_info,
    .enabledExtensionCount = 0,
};

VkDevice device;
vkCreateDevice(selected_device, &device_info, nullptr, &device);
VkQueue compute_queue;
vkGetDeviceQueue(device, compute_queue_family, 0, &compute_queue);
```

---

## 2. Memory Management (VMA - Vulkan Memory Allocator)

### VMA Setup
```cpp
VmaAllocatorCreateInfo allocator_info = {
    .flags = VMA_ALLOCATOR_CREATE_BUFFER_DEVICE_ADDRESS_BIT |  // For buffer device address
             VMA_ALLOCATOR_CREATE_KHR_DEDICATED_ALLOCATION_BIT |
             VMA_ALLOCATOR_CREATE_KHR_BIND_MEMORY2_BIT,
    .physicalDevice = physical_device,
    .device = device,
    .instance = instance,
    .vulkanApiVersion = VK_API_VERSION_1_3,
};

VmaAllocator allocator;
vmaCreateAllocator(&allocator_info, &allocator);
```

### Allocation Patterns

| Usage | VMA Usage Flag | Memory Type | Use Case |
|-------|----------------|-------------|----------|
| **Device-local** | `VMA_MEMORY_USAGE_GPU_ONLY` | VRAM | Weights, KV cache, intermediate buffers |
| **Upload (CPU→GPU)** | `VMA_MEMORY_USAGE_CPU_TO_GPU` | Host-visible, write-combined | Staging buffers, input data |
| **Readback (GPU→CPU)** | `VMA_MEMORY_USAGE_GPU_TO_CPU` | Host-visible, cached | Output data, profiling results |
| **Unified** | `VMA_MEMORY_USAGE_AUTO` | Driver chooses | Simplified, may have migration overhead |

### Buffer Creation with VMA
```cpp
VkBufferCreateInfo buffer_info = {
    .sType = VK_STRUCTURE_TYPE_BUFFER_CREATE_INFO,
    .size = buffer_size,
    .usage = VK_BUFFER_USAGE_STORAGE_BUFFER_BIT |
             VK_BUFFER_USAGE_SHADER_DEVICE_ADDRESS_BIT |  // For buffer device address
             VK_BUFFER_USAGE_TRANSFER_SRC_BIT |
             VK_BUFFER_USAGE_TRANSFER_DST_BIT,
    .sharingMode = VK_SHARING_MODE_EXCLUSIVE,
};

VmaAllocationCreateInfo alloc_info = {
    .usage = VMA_MEMORY_USAGE_GPU_ONLY,
    .flags = VMA_ALLOCATION_CREATE_MAPPED_BIT |  // If host access needed
             VMA_ALLOCATION_CREATE_HOST_ACCESS_SEQUENTIAL_WRITE_BIT,
    .priority = 1.0f,
};

VkBuffer buffer;
VmaAllocation allocation;
VmaAllocationInfo alloc_result;
vmaCreateBuffer(allocator, &buffer_info, &alloc_info, &buffer, &allocation, &alloc_result);

// Get device address for buffer device address extension
VkBufferDeviceAddressInfoKHR addr_info = {
    .sType = VK_STRUCTURE_TYPE_BUFFER_DEVICE_ADDRESS_INFO_KHR,
    .buffer = buffer,
};
VkDeviceAddress device_address = vkGetBufferDeviceAddressKHR(device, &addr_info);
```

### Mapping/Unmapping
```cpp
// Map (if not persistently mapped)
void* mapped_ptr;
vmaMapMemory(allocator, allocation, &mapped_ptr);

// Write data
memcpy(mapped_ptr, src_data, data_size);

// Flush if not HOST_COHERENT
VkMappedMemoryRange flush_range = {
    .sType = VK_STRUCTURE_TYPE_MAPPED_MEMORY_RANGE,
    .memory = alloc_result.deviceMemory,
    .offset = alloc_result.offset,
    .size = data_size,
};
vkFlushMappedMemoryRanges(device, 1, &flush_range);

// Unmap
vmaUnmapMemory(allocator, allocation);
```

---

## 3. Buffers & Descriptors

### Storage Buffer (Compute Shader)
```glsl
// shader.comp
#version 460 core
#extension GL_EXT_buffer_reference : require
#extension GL_EXT_shader_explicit_arithmetic_types : require

layout(local_size_x = 256, local_size_y = 1, local_size_z = 1) in;

struct BufferRef {
    uint64_t address;
};

layout(buffer_reference, scalar, buffer_reference_align = 16) buffer InputBuffer {
    float data[];
} input;

layout(buffer_reference, scalar, buffer_reference_align = 16) buffer OutputBuffer {
    float data[];
} output;

void main() {
    uint idx = gl_GlobalInvocationID.x;
    output.data[idx] = input.data[idx] * 2.0f;
}
```

### Descriptor Set Layout
```cpp
VkDescriptorSetLayoutBinding bindings[] = {
    {
        .binding = 0,
        .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER,
        .descriptorCount = 1,
        .stageFlags = VK_SHADER_STAGE_COMPUTE_BIT,
    },
    {
        .binding = 1,
        .descriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
        .descriptorCount = 1,
        .stageFlags = VK_SHADER_STAGE_COMPUTE_BIT,
    },
};

VkDescriptorSetLayoutCreateInfo layout_info = {
    .sType = VK_STRUCTURE_TYPE_DESCRIPTOR_SET_LAYOUT_CREATE_INFO,
    .bindingCount = 2,
    .pBindings = bindings,
};
VkDescriptorSetLayout descriptor_set_layout;
vkCreateDescriptorSetLayout(device, &layout_info, nullptr, &descriptor_set_layout);
```

### Descriptor Pool & Sets (One per Frame)
```cpp
VkDescriptorPoolSize pool_sizes[] = {
    {VK_DESCRIPTOR_TYPE_STORAGE_BUFFER, MAX_FRAMES_IN_FLIGHT},
    {VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, MAX_FRAMES_IN_FLIGHT},
};

VkDescriptorPoolCreateInfo pool_info = {
    .sType = VK_STRUCTURE_TYPE_DESCRIPTOR_POOL_CREATE_INFO,
    .maxSets = MAX_FRAMES_IN_FLIGHT,
    .poolSizeCount = 2,
    .pPoolSizes = pool_sizes,
};
VkDescriptorPool descriptor_pool;
vkCreateDescriptorPool(device, &pool_info, nullptr, &descriptor_pool);

// Allocate one set per frame
VkDescriptorSetAllocateInfo alloc_info = {
    .sType = VK_STRUCTURE_TYPE_DESCRIPTOR_SET_ALLOCATE_INFO,
    .descriptorPool = descriptor_pool,
    .descriptorSetCount = 1,
    .pSetLayouts = &descriptor_set_layout,
};
VkDescriptorSet descriptor_sets[MAX_FRAMES_IN_FLIGHT];
vkAllocateDescriptorSets(device, &alloc_info, descriptor_sets);

// Update descriptors (per frame)
VkDescriptorBufferInfo storage_info = {.buffer = buffer, .offset = 0, .range = VK_WHOLE_SIZE};
VkDescriptorBufferInfo uniform_info = {.buffer = ubo_buffer, .offset = 0, .range = sizeof(UBO)};

VkWriteDescriptorSet writes[] = {
    {.sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET, .dstSet = descriptor_sets[frame], .dstBinding = 0, .descriptorCount = 1, .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER, .pBufferInfo = &storage_info},
    {.sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET, .dstSet = descriptor_sets[frame], .dstBinding = 1, .descriptorCount = 1, .descriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, .pBufferInfo = &uniform_info},
};
vkUpdateDescriptorSets(device, 2, writes, 0, nullptr);
```

### Push Constants (Up to 128 bytes)
```cpp
// Shader:
/*
layout(push_constant) uniform PushConstants {
    uint32_t num_elements;
    float scale;
    uint32_t flags;
} push;
*/

VkPushConstantRange push_range = {
    .stageFlags = VK_SHADER_STAGE_COMPUTE_BIT,
    .offset = 0,
    .size = sizeof(PushConstants),  // ≤ 128 bytes
};

VkPipelineLayoutCreateInfo layout_info = {
    .sType = VK_STRUCTURE_TYPE_PIPELINE_LAYOUT_CREATE_INFO,
    .setLayoutCount = 1,
    .pSetLayouts = &descriptor_set_layout,
    .pushConstantRangeCount = 1,
    .pPushConstantRanges = &push_range,
};
VkPipelineLayout pipeline_layout;
vkCreatePipelineLayout(device, &layout_info, nullptr, &pipeline_layout);
```

---

## 4. Command Buffers & Dispatch

### Command Pool & Buffers
```cpp
VkCommandPoolCreateInfo pool_info = {
    .sType = VK_STRUCTURE_TYPE_COMMAND_POOL_CREATE_INFO,
    .flags = VK_COMMAND_POOL_CREATE_RESET_COMMAND_BUFFER_BIT,
    .queueFamilyIndex = compute_queue_family,
};
VkCommandPool command_pool;
vkCreateCommandPool(device, &pool_info, nullptr, &command_pool);

VkCommandBufferAllocateInfo alloc_info = {
    .sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_ALLOCATE_INFO,
    .commandPool = command_pool,
    .level = VK_COMMAND_BUFFER_LEVEL_PRIMARY,
    .commandBufferCount = MAX_FRAMES_IN_FLIGHT,
};
VkCommandBuffer command_buffers[MAX_FRAMES_IN_FLIGHT];
vkAllocateCommandBuffers(device, &alloc_info, command_buffers);
```

### Recording Compute Commands
```cpp
VkCommandBufferBeginInfo begin_info = {
    .sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_BEGIN_INFO,
    .flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT,
};
vkBeginCommandBuffer(command_buffers[frame], &begin_info);

vkCmdBindPipeline(command_buffers[frame], VK_PIPELINE_BIND_POINT_COMPUTE, pipeline);
vkCmdBindDescriptorSets(command_buffers[frame], VK_PIPELINE_BIND_POINT_COMPUTE, pipeline_layout, 0, 1, &descriptor_sets[frame], 0, nullptr);

PushConstants push = {.num_elements = 1024, .scale = 2.0f, .flags = 0};
vkCmdPushConstants(command_buffers[frame], pipeline_layout, VK_SHADER_STAGE_COMPUTE_BIT, 0, sizeof(push), &push);

// Dispatch: grid dimensions
// Total invocations = groupCountX * groupCountY * groupCountZ * localSizeX * localSizeY * localSizeZ
vkCmdDispatch(command_buffers[frame], 4, 1, 1);  // 4 groups * 256 threads = 1024

vkEndCommandBuffer(command_buffers[frame]);
```

---

## 5. Synchronization

### Fences (CPU waits for GPU)
```cpp
VkFenceCreateInfo fence_info = {
    .sType = VK_STRUCTURE_TYPE_FENCE_CREATE_INFO,
    .flags = VK_FENCE_CREATE_SIGNALED_BIT,  // Start signaled
};
VkFence fences[MAX_FRAMES_IN_FLIGHT];
for (int i = 0; i < MAX_FRAMES_IN_FLIGHT; ++i) {
    vkCreateFence(device, &fence_info, nullptr, &fences[i]);
}

// Wait for frame to complete
vkWaitForFences(device, 1, &fences[frame], VK_TRUE, UINT64_MAX);
vkResetFences(device, 1, &fences[frame]);
```

### Semaphores (GPU-GPU sync)
```cpp
VkSemaphoreCreateInfo sem_info = {
    .sType = VK_STRUCTURE_TYPE_SEMAPHORE_CREATE_INFO,
};
VkSemaphore image_available, render_finished;
vkCreateSemaphore(device, &sem_info, nullptr, &image_available);
vkCreateSemaphore(device, &sem_info, nullptr, &render_finished);

// Submit with semaphores
VkSubmitInfo submit_info = {
    .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO,
    .waitSemaphoreCount = 1,
    .pWaitSemaphores = &image_available,
    .pWaitDstStageMask = (VkPipelineStageFlags[]){VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT},
    .commandBufferCount = 1,
    .pCommandBuffers = &command_buffers[frame],
    .signalSemaphoreCount = 1,
    .pSignalSemaphores = &render_finished,
};
vkQueueSubmit(compute_queue, 1, &submit_info, fences[frame]);
```

### Timeline Semaphores (Vulkan 1.2+)
```cpp
VkSemaphoreTypeCreateInfo timeline_info = {
    .sType = VK_STRUCTURE_TYPE_SEMAPHORE_TYPE_CREATE_INFO,
    .semaphoreType = VK_SEMAPHORE_TYPE_TIMELINE,
    .initialValue = 0,
};

VkSemaphoreCreateInfo sem_info = {
    .sType = VK_STRUCTURE_TYPE_SEMAPHORE_CREATE_INFO,
    .pNext = &timeline_info,
};
VkSemaphore timeline_semaphore;
vkCreateSemaphore(device, &sem_info, nullptr, &timeline_semaphore);

// Signal with value
VkTimelineSemaphoreSubmitInfo signal_info = {
    .sType = VK_STRUCTURE_TYPE_TIMELINE_SEMAPHORE_SUBMIT_INFO,
    .signalSemaphoreValueCount = 1,
    .pSignalSemaphoreValues = &signal_value,
};

VkSubmitInfo2 submit_info = {
    .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO_2,
    .pNext = &signal_info,
    // ...
};
vkQueueSubmit2(device, 1, &submit_info, VK_NULL_HANDLE);

// Wait on host
vkWaitSemaphores(device, &(VkSemaphoreWaitInfo){
    .sType = VK_STRUCTURE_TYPE_SEMAPHORE_WAIT_INFO,
    .semaphoreCount = 1,
    .pSemaphores = &timeline_semaphore,
    .pValues = &wait_value,
}, UINT64_MAX);
```

### Barriers (Vulkan 1.3 synchronization2)
```cpp
// Memory barrier between dispatches
VkMemoryBarrier2 barrier = {
    .sType = VK_STRUCTURE_TYPE_MEMORY_BARRIER_2,
    .srcStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT,
    .srcAccessMask = VK_ACCESS_2_SHADER_WRITE_BIT,
    .dstStageMask = VK_PIPELINE_STAGE_2_COMPUTE_SHADER_BIT,
    .dstAccessMask = VK_ACCESS_2_SHADER_READ_BIT,
};

VkDependencyInfo dep_info = {
    .sType = VK_STRUCTURE_TYPE_DEPENDENCY_INFO,
    .memoryBarrierCount = 1,
    .pMemoryBarriers = &barrier,
};
vkCmdPipelineBarrier2(command_buffer, &dep_info);
```

---

## 6. Shaders (GLSL → SPIR-V)

### Compilation
```bash
# GLSL → SPIR-V
glslc -fshader-stage=compute shader.comp -o shader.comp.spv

# With defines
glslc -DLOCAL_SIZE=256 -fshader-stage=compute shader.comp -o shader.comp.spv

# Debug info
glslc -g -fshader-stage=compute shader.comp -o shader.comp.spv
```

### Shader Module Creation
```cpp
// Read SPIR-V binary
std::vector<uint32_t> spirv = read_file("shader.comp.spv");

VkShaderModuleCreateInfo module_info = {
    .sType = VK_STRUCTURE_TYPE_SHADER_MODULE_CREATE_INFO,
    .codeSize = spirv.size() * sizeof(uint32_t),
    .pCode = spirv.data(),
};
VkShaderModule shader_module;
vkCreateShaderModule(device, &module_info, nullptr, &shader_module);

// Pipeline
VkPipelineShaderStageCreateInfo stage_info = {
    .sType = VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO,
    .stage = VK_SHADER_STAGE_COMPUTE_BIT,
    .module = shader_module,
    .pName = "main",
};

VkComputePipelineCreateInfo pipeline_info = {
    .sType = VK_STRUCTURE_TYPE_COMPUTE_PIPELINE_CREATE_INFO,
    .stage = stage_info,
    .layout = pipeline_layout,
};
VkPipeline pipeline;
vkCreateComputePipelines(device, VK_NULL_HANDLE, 1, &pipeline_info, nullptr, &pipeline);
```

### Subgroup Operations (GLSL)
```glsl
#extension GL_KHR_subgroup_basic : require
#extension GL_KHR_subgroup_arithmetic : require
#extension GL_KHR_subgroup_ballot : require
#extension GL_KHR_subgroup_shuffle : require

// Subgroup size (typically 32 on NVIDIA, 64 on AMD)
uint subgroup_size = gl_SubgroupSize;

// Inclusive scan
float sum = subgroupInclusiveAdd(float_value);

// Ballot (active mask)
uint mask = subgroupBallot(condition);

// Shuffle (cross-lane)
float other_value = subgroupShuffle(value, lane_id);

// Quad operations (2x2)
float quad_sum = subgroupQuadAdd(float_value);
```

### Cooperative Matrix (GL_KHR_cooperative_matrix)
```glsl
#extension GL_KHR_cooperative_matrix : require

// Matrix dimensions (M=16, N=8, K=16 for FP16 Tensor Cores)
layout(std430, set = 0, binding = 0) buffer A { half a[]; };
layout(std430, set = 0, binding = 1) buffer B { half b[]; };
layout(std430, set = 0, binding = 2) buffer C { half c[]; };

void main() {
    // Load matrix A (16x16) from buffer
    cmat16x16x16_half A = cmatLoad(A_layout, a_address);
    cmat16x8x16_half B = cmatLoad(B_layout, b_address);
    cmat16x8x16_half C = cmatLoad(C_layout, c_address);
    
    // Matrix multiply-accumulate
    C = cmatMulAdd(A, B, C);
    
    // Store result
    cmatStore(C_layout, c_address, C);
}
```

---

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