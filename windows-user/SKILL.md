---
name: windows-user
description: "Windows userspace systems: Win32/NT processes, threads, handles, I/O, synchronization, IOCP, ETW, driver model (WDDM/KMDF/UMDF), deployment. Windows userspace systems programming."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  trigger_keywords: ["Windows", "Win32", "NT", "process", "thread", "handle", "IOCP", "ETW", "WDDM", "KMDF", "UMDF", "driver", "deployment", "MSI", "MSIX", "Event Tracing", "critical section", "SRW lock", "condition variable", "thread pool"]
---

# Windows Userspace Systems

**User-space systems programming on Windows.** Covers processes, threads, handles, I/O, synchronisation, IOCP, ETW, driver model, and deployment.

---

## Process & Thread (Win32/NT)

```c
// Process creation
STARTUPINFOEXW si = {0};
si.StartupInfo.cb = sizeof(si);
PROCESS_INFORMATION pi;
BOOL ok = CreateProcessW(
    L"C:\\path\\app.exe",
    L"app.exe arg1 arg2",
    NULL, NULL,
    FALSE,
    EXTENDED_STARTUPINFO_PRESENT | CREATE_UNICODE_ENVIRONMENT,
    NULL, NULL,
    &si.StartupInfo,
    &pi
);
CloseHandle(pi.hThread);
WaitForSingleObject(pi.hProcess, INFINITE);
DWORD exit_code;
GetExitCodeProcess(pi.hProcess, &exit_code);
CloseHandle(pi.hProcess);

// Thread creation
DWORD WINAPI Worker(LPVOID lpParameter) { return 0; }
HANDLE thread = CreateThread(NULL, 0, Worker, arg, 0, NULL);
WaitForSingleObject(thread, INFINITE);
CloseHandle(thread);

// Thread pool (modern)
PTP_POOL pool = CreateThreadpool(NULL);
PTP_CLEANUP_GROUP cleanup = CreateThreadpoolCleanupGroup();
SetThreadpoolCallbackPool(&callback_env, pool);
SetThreadpoolCallbackCleanupGroup(&callback_env, cleanup, NULL);
PTP_WORK work = CreateThreadpoolWork(Callback, context, &callback_env);
SubmitThreadpoolWork(work);
WaitForThreadpoolWorkCallbacks(work, FALSE);
CloseThreadpoolWork(work);
```

## Synchronisation

```c
// Critical section (user-mode, fast)
CRITICAL_SECTION cs;
InitializeCriticalSectionEx(&cs, 4000, CRITICAL_SECTION_NO_DEBUG_INFO);
EnterCriticalSection(&cs);
LeaveCriticalSection(&cs);
DeleteCriticalSection(&cs);

// Condition variable
CONDITION_VARIABLE cv;
InitializeConditionVariable(&cv);
EnterCriticalSection(&cs);
while (!predicate) SleepConditionVariableCS(&cv, &cs, INFINITE);
LeaveCriticalSection(&cs);
WakeConditionVariable(&cv);

// SRW Lock (slim reader-writer)
SRWLOCK srw = SRWLOCK_INIT;
AcquireSRWLockExclusive(&srw);
AcquireSRWLockShared(&srw);
ReleaseSRWLockExclusive(&srw);
ReleaseSRWLockShared(&srw);

// Events (kernel objects)
HANDLE event = CreateEvent(NULL, TRUE, FALSE, NULL);
SetEvent(event);
ResetEvent(event);
WaitForSingleObject(event, INFINITE);
```

## I/O Completion Ports (IOCP)

```c
HANDLE iocp = CreateIoCompletionPort(INVALID_HANDLE_VALUE, NULL, 0, 0);

HANDLE file = CreateFile(L"data.bin", GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_FLAG_OVERLAPPED, NULL);
CreateIoCompletionPort(file, iocp, (ULONG_PTR)file, 0);

OVERLAPPED ol = {0};
ol.Offset = offset;
ReadFile(file, buffer, size, NULL, &ol);

DWORD WINAPI IOCPWorker(LPVOID lpParam) {
    HANDLE iocp = (HANDLE)lpParam;
    while (TRUE) {
        DWORD bytes;
        ULONG_PTR key;
        LPOVERLAPPED ol;
        BOOL ok = GetQueuedCompletionStatus(iocp, &bytes, &key, &ol, INFINITE);
        if (!ok && ol == NULL) break;
    }
    return 0;
}
```

## ETW (Event Tracing for Windows)

```c
TRACEHANDLE reg_handle;
EVENT_DESCRIPTOR event = {0, 0, 0, 0, 0, 0, 0, 0};
ULONG status = EventRegister(&PROVIDER_GUID, EnableCallback, NULL, &reg_handle);

void NTAPI EnableCallback(LPCGUID source_id, ULONG is_enabled, UCHAR level, ULONGLONG match_any, ULONGLONG match_all, ULONGLONG filter, PVOID callback_context) {
    if (is_enabled) { /* Start tracing */ }
    else { /* Stop tracing */ }
}

EventWrite(reg_handle, &event, 0, NULL);
EventUnregister(reg_handle);
```

## Driver Model (WDDM/KMDF/UMDF)

```c
NTSTATUS DriverEntry(PDRIVER_OBJECT DriverObject, PUNICODE_STRING RegistryPath) {
    WDF_DRIVER_CONFIG config;
    WDF_DRIVER_CONFIG_INIT(&config, EvtDeviceAdd);
    return WdfDriverCreate(DriverObject, RegistryPath, WDF_NO_OBJECT_ATTRIBUTES, &config, WDF_NO_HANDLE);
}

NTSTATUS EvtDeviceAdd(WDFDRIVER Driver, PWDFDEVICE_INIT DeviceInit) {
    WDF_OBJECT_ATTRIBUTES attrs;
    WDF_OBJECT_ATTRIBUTES_INIT(&attrs);
    attrs.EvtCleanupCallback = EvtDeviceCleanup;
    
    WDFDEVICE device;
    NTSTATUS status = WdfDeviceCreate(&DeviceInit, &attrs, &device);
    return status;
}
```

## Deployment & Servicing

```powershell
# MSI packaging (WiX)
<Package Id="*" Manufacturer="MyCorp" InstallerVersion="500" />

# MSIX (modern)
MakeAppx.exe pack /d "PackageRoot" /p "MyApp.msix"
SignTool.exe sign /fd SHA256 /a /tr http://timestamp.digicert.com /td SHA256 MyApp.msix

# Silent install
msiexec /i MyApp.msi /qn /norestart
```

## Validation Gates

| Gate | Tool |
|------|------|
| **Build** | MSVC `/W4 /WX` |
| **Static** | `/analyze`, `PREfast` |
| **Sanitizers** | ASan (experimental) |
| **Unit Tests** | `ctest` / GoogleTest |
| **Integration** | `pytest` / custom |
| **Chaos** | `chaos-mesh` |
| **Load** | `wrk` / `locust` |

## Boundaries

- Does not write kernel code (see `os-kernel-systems`)
- Does not manage C/C++ ownership (see `c-systems`)
- Does not cover Linux (see `linux-user`)
- Does not cover architecture patterns (see `sys-arch`)
- `stop windows-user`: revert.