---
name: vulkan-compute
description: "Vulkan: buffers, descriptors, cmd buffers."
license: MIT
compatibility: opencode
---

# Vulkan Compute

## Instance & Device Setup

- `vkCreateInstance` with `VK_KHR_portability` extension on macOS/iOS.
- `vkEnumeratePhysicalDevices` — pick by `VkPhysicalDeviceProperties` (deviceType, limits).
- `vkCreateDevice` with queue flags: `VK_QUEUE_COMPUTE_BIT`, `VK_QUEUE_TRANSFER_BIT`.
- Check `VkPhysicalDeviceLimits::maxComputeWorkGroupSize` (typically 1024x1024x64).

## Memory Management

- Use Vulkan Memory Allocator (VMA): `vmaCreateAllocator`, `vmaAllocateMemoryForBuffer`.
- `VMA_MEMORY_USAGE_GPU_ONLY` for device-local (GPU → GPU).
- `VMA_MEMORY_USAGE_CPU_TO_GPU` for upload (CPU → GPU, write-once).
- `VMA_MEMORY_USAGE_GPU_TO_CPU` for readback (GPU → CPU).
- Always map/unmap or use `vmaMap`/`vmaUnmap`. Flush/invalidate if not HOST_COHERENT.

## Buffers & Descriptors

- `vkCreateBuffer` with `VK_BUFFER_USAGE_STORAGE_BUFFER_BIT` for compute shaders.
- Descriptor set layout: `VK_DESCRIPTOR_TYPE_STORAGE_BUFFER`, `UNIFORM_BUFFER`.
- `vkAllocateDescriptorSets` — one per frame. `vkUpdateDescriptorSets` to bind.
- Push constants: `VK_SHADER_STAGE_COMPUTE_BIT`, max 128 bytes.

## Command Buffers

- `vkAllocateCommandBuffers` — primary or secondary.
- `vkBeginCommandBuffer` → `vkCmdBindPipeline` → `vkCmdBindDescriptorSets` → `vkCmdDispatch`.
- Dispatch dims: `vkCmdDispatch(cmd, x, y, z)` — total = x*y*z * localSize.
- `vkEndCommandBuffer` → `vkQueueSubmit` with semaphore for completion.

## Synchronization

- Fences (`VkFence`): CPU waits for GPU. `vkWaitForFences` + `vkResetFences`.
- Semaphores (`VkSemaphore`): GPU-GPU sync. `VkSubmitInfo::pSignalSemaphores`.
- **Never submit same command buffer twice** without `vkResetCommandBuffer`.

## Shaders (GLSL → SPIR-V)

- `glslc -fshader-stage=compute shader.comp` — compile to SPIR-V.
- Local size: `layout(local_size_x = 256) in;`
- `GL_KHR_coopmat` extension for matrix ops on RTX/Ada.
- `VkShaderModule` created from SPIR-V binary (`vkCreateShaderModule`).

## Validation

- Enable `VK_LAYER_KHRONOS_validation` — catches 90% of errors at dev time.
- Disable in production builds (`NDEBUG`).
- Use `vkGetDeviceProcAddr` for device-level function pointers.
