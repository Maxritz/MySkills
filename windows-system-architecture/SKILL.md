---
name: windows-system-architecture
description: Design, debug, or port Windows system software involving NT processes, threads, handles, I/O, security, WDDM, ETW, ABI, deployment, or host/driver boundaries.
---

# Windows system architecture

Separate documented Win32/COM/DXGI contracts from NT implementation details. Record Windows build, SDK, driver model, architecture, signing mode, and deployment context.

1. Map process/thread/handle ownership, I/O completion, service boundaries, and privilege transitions.
2. Use ETW/WPA, WinDbg, verifier, dump analysis, and documented APIs to localize the first bad boundary.
3. Preserve Unicode, HRESULT/NTSTATUS translation, synchronization, cancellation, and DLL/driver ABI rules.
4. Isolate OS-specific code behind interfaces and test on the minimum supported Windows builds.
5. Validate clean install, upgrade, uninstall, and failure recovery—not only the happy path.

Add `directx-ai-ml` for D3D12/DirectML/Agility work and `graphics-shader-kernels` for shader or GPU-kernel behavior.
