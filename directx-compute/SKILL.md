---
name: directx-compute
description: "DX12 compute: device, descriptors, root sigs."
license: MIT
compatibility: opencode
---

# DirectX 12 Compute

## Device Setup

- `D3D12CreateDevice` — returns `ID3D12Device`. Check `D3D_FEATURE_LEVEL_12_0`.
- `IDXGIFactory4::EnumAdapterByDesc` for adapter selection.
- `CreateCommandQueue` with `D3D12_COMMAND_LIST_TYPE_COMPUTE` for pure compute.
- `CreateCommandAllocator` — one per command list frame.

## Root Signature

- `D3D12_ROOT_DESCRIPTOR` for CBV/SRV/UAV tables (fast, limited slots).
- `D3D12_ROOT_CONSTANT` for push constants (up to 32 DWORDs).
- `D3D12_DESCRIPTOR_RANGE` for table ranges. Bind with `SetComputeRootDescriptorTable`.
- `D3D12_SHADER_VISIBILITY_ALL` (compute = always compute-only).

## Shaders

- HLSL: `float4 CSMain(...) : SV_DispatchSize`
- Compile with `D3DCompileFromFile` or `DxcCompile` (DXC for DXIL).
- `ID3DBlob` holds compiled bytecode. `CreateComputeShader` to create.
- UAV (Unordered Access View) for output buffers: `D3D12_UNORDERED_ACCESS_VIEW_DESC`.
- Group size must match `Dispatch(cx, cy, cz)` — `(x*numthreads.x) = work items`.

## Command Lists

- `ID3D12GraphicsCommandList` — record commands then close.
- `Close()` → `ExecuteCommandLists()` → reset allocator + list for reuse.
- `Dispatch(x, y, z)` — thread groups, not threads.

## Synchronization

- `ID3D12Fence` + `ID3D12Fence::SetEventOnFence` for CPU-GPU sync.
- Fence value increments per submit. `Signal(fenceValue)` / `Wait(fenceValue)`.
- Timeline semaphores (`D3D12_FENCE_FLAG_CPU_ACCESSOR`) for modern sync.

## Memory

- `CreateCommittedResource` with `D3D12_HEAP_TYPE_DEFAULT` (GPU-only).
- `D3D12_HEAP_TYPE_UPLOAD` for CPU→GPU (constant buffers).
- `D3D12_HEAP_TYPE_READBACK` for GPU→CPU.
- `Map()` / `Unmap()` for upload/readback heaps.
- UAV barriers (`D3D12_RESOURCE_UNORDERED_ACCESS_VIEW`) between dispatches.
