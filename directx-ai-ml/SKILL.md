---
name: directx-ai-ml
description: Develop or debug DirectX 12, DXGI, DXIL, shader-model, Agility SDK, DirectML, resource/heaps/fences, and Windows GPU AI/ML integration.
---

# DirectX, Agility SDK, and DirectML

Treat D3D12, DXGI, DXIL/shader model, Agility SDK, DirectML, and WDDM as separate contracts connected by explicit resources and synchronization.

1. Record OS build, Windows SDK, Agility SDK version, driver/WDDM, adapter, feature level, shader model, and DirectML operator/device path.
2. Validate adapter selection, device removal handling, resource states, heap alignment, descriptor lifetime, fences, command queues, and residency.
3. Keep shader/kernel code separate from graph/operator construction and host orchestration.
4. Use PIX/GPU-based validation, debug layer, DRED, ETW, and deterministic tensor/image fixtures.
5. Provide a capability probe and a documented fallback for unsupported hardware or operators.

Load `graphics-shader-kernels` for HLSL/DXIL behavior and `windows-system-architecture` for WDDM/ABI/deployment issues.
