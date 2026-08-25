---
name: windows-systems
description: "Win32: processes, I/O, Registry, COM."
license: MIT
compatibility: opencode
---

# Windows Systems Programming

## Win32 Core

- `HANDLE` for all kernel objects. `CloseHandle()` every allocation.
- `CreateFileW` (wide-string). `ReadFile`/`WriteFile` for I/O. `OVERLAPPED` for async.
- `CreateProcessW` — inherits handles via `bInheritHandles=TRUE` + `STARTUPINFO.lpFlags`.
- `CreateThread` / `CreateRemoteThread` — prefer thread pool (`TpCreateCallback`).
- `GetLastError()` after every Win32 call that returns `NULL`/`FALSE`/`INVALID_HANDLE_VALUE`.

## File I/O

- `HANDLE h = CreateFileW(path, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);`
- `LARGE_INTEGER size; GetFileSizeEx(h, &size);` — 64-bit file size.
- `SetFilePointerEx` for seeking. `FlushFileBuffers` before `CloseHandle`.
- Memory-mapped: `CreateFileMapping` → `MapViewOfFile`. `UnmapViewOfFile` + `CloseHandle`.

## Registry

- `RegOpenKeyExW` → `RegQueryValueExW` → `RegCloseKey`.
- `HKEY_LOCAL_MACHINE` requires admin elevation.
- `RegSetValueExW` for writes. Use `REG_DWORD`, `REG_SZ`, `REG_BINARY`.

## Services

- `OpenSCManagerW(NULL, NULL, SC_MANAGER_ALL_ACCESS)` for service control.
- `CreateServiceW` → `StartServiceW` → `ControlService` (STOP) → `DeleteService`.
- `RegisterServiceCtrlHandlerW` in service main. Report status with `SetServiceStatus`.

## COM

- `CoInitializeEx(NULL, COINIT_MULTITHREADED)` — per-thread initialization.
- `CoCreateInstance(CLSID, NULL, CLSCTX_ALL, IID, &ptr)` — create COM object.
- `Release()` every interface pointer when done.
- `CComPtr<T>` / `wil::com_ptr` for RAII (auto Release).

## Drivers (WDK)

- `DRIVER_INITIALIZE DriverEntry` — entry point. `NTSTATUS` return.
- `IoCreateDevice` / `IoDeleteDevice` for device objects.
- IRP (I/O Request Packet) handlers: `IRP_MJ_CREATE`, `IRP_MJ_CLOSE`, `IRP_MJ_DEVICE_CONTROL`.
- `KeAcquireSpinLockAtDpcLevel` — high IRQL spinlock. Never call `ExAllocatePool` at high IRQL.
- Build with WDK: `msbuild /p:Configuration=Release /p:Platform=x64`.
