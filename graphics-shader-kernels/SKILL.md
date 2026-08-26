---
name: graphics-shader-kernels
description: Develop, port, debug, or optimize graphics and compute shaders/kernels using HLSL, GLSL, SPIR-V, DXIL, Vulkan, DirectX, barriers, subgroups, and GPU profiling.
---

# Graphics shaders and kernels

Keep shader source, intermediate representation, resource binding, pipeline state, and host synchronization as separate contracts.

1. Record API, shader model, target architecture, subgroup/wave size, resource formats, and validation mode.
2. Verify descriptor bindings, layouts, barriers, hazards, synchronization, precision, derivatives, and coordinate conventions.
3. Inspect occupancy, register/shared/local memory, divergence, cache behavior, and wave/subgroup utilization.
4. Use capability queries and provide an explicit fallback for unsupported features or formats.
5. Validate visual/numerical output, device-loss/error paths, cross-vendor behavior, and a measured performance case.

Load `directx-ai-ml` for D3D12/DirectML/Agility and `rocm-stack` or `cuda-stack` for vendor compute backends.
