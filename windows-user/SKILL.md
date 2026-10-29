---
name: windows-user
description: "Windows userspace systems programming: process/thread lifecycle, Win32 handles, synchronisation, overlapped I/O, IOCP, ETW and deployment."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["Windows", "Win32", "NT process", "thread", "handle", "IOCP", "ETW", "SRW lock", "condition variable", "thread pool", "MSI", "MSIX"]
---

# Windows Userspace Systems

This skill covers user-mode process, thread, handle, I/O, synchronisation, tracing and packaging behaviour. Kernel-mode drivers, WDDM and KMDF/UMDF implementation belong in windows-driver-dev.

## Version and environment gate

Record Windows build, architecture, SDK/WDK version where relevant, compiler/runtime, target subsystem and whether the application is a service, console, GUI or packaged app. Check the target Windows API contract and handle every Win32 failure using GetLastError where specified.

## Process and thread lifecycle

A mutable command-line buffer is required for CreateProcessW because the API may modify it. Initialise output structures and do not touch PROCESS_INFORMATION handles unless creation succeeded.

    #include <windows.h>

    static BOOL launch_and_wait(DWORD *child_exit_code, DWORD *win32_error)
    {
        STARTUPINFOW si = {0};
        PROCESS_INFORMATION pi = {0};
        DWORD wait_result;
        BOOL success = FALSE;
        wchar_t command_line[] = L"\"C:\\path\\app.exe\" arg1";

        if (child_exit_code == NULL || win32_error == NULL) {
            SetLastError(ERROR_INVALID_PARAMETER);
            return FALSE;
        }
        *child_exit_code = 0;
        *win32_error = ERROR_SUCCESS;
        si.cb = sizeof(si);

        if (!CreateProcessW(L"C:\\path\\app.exe", command_line,
                            NULL, NULL, FALSE, CREATE_UNICODE_ENVIRONMENT,
                            NULL, NULL, &si, &pi)) {
            *win32_error = GetLastError();
            return FALSE;
        }

        wait_result = WaitForSingleObject(pi.hProcess, INFINITE);
        if (wait_result != WAIT_OBJECT_0) {
            *win32_error = (wait_result == WAIT_FAILED)
                ? GetLastError() : ERROR_GEN_FAILURE;
            goto cleanup;
        }
        if (!GetExitCodeProcess(pi.hProcess, child_exit_code)) {
            *win32_error = GetLastError();
            goto cleanup;
        }
        success = TRUE;

    cleanup:
        CloseHandle(pi.hThread);
        CloseHandle(pi.hProcess);
        return success;
    }
Define the application’s exit-code policy; an exit code of zero is not meaningful unless the child contract defines it. In production code, propagate launch, wait and child-process failure separately rather than collapsing them into one status.

Use CreateThread only when the thread routine and its runtime requirements are compatible with it. If a thread uses the C/C++ runtime in a way requiring runtime thread initialisation, select the appropriate CRT thread API. Keep callback context alive until the worker has stopped and join/wait before destroying shared state.

## Synchronisation

- A condition variable protects a predicate, not a notification. Change the predicate while holding the associated lock; wait in a loop and handle every failed wait return.
- Acquire and release an SRW lock in matching pairs. Shared and exclusive acquisition are alternative modes, not operations to nest on the same lock.
- Define event semantics explicitly: manual-reset events remain signalled until reset; auto-reset events release a waiter and reset automatically. Close handles after all users have stopped.
- Use atomics only for defined lock-free state transitions. Volatile does not provide inter-thread ordering.
- Avoid waiting while holding locks needed by the worker being awaited. Document lock order and shutdown rules.

For Windows thread pools, initialise a TP_CALLBACK_ENVIRON, associate a valid pool, create the work object, keep its context alive through completion, wait for callbacks, close work objects and destroy the callback environment/pool in the documented order. Check allocation failures before submission. Do not copy thread-pool fragments that reference undeclared callback environments or context objects.

## I/O Completion Ports (IOCP)

The operation, buffer and owning handles must remain alive until the completion has been dequeued. With ordinary overlapped completion-port notification, handle both immediate ReadFile success and ERROR_IO_PENDING as submitted operations; a different completion-notification mode can change the expected packet behaviour.

Single-operation example. This deliberately waits for completion before the stack-owned operation goes out of scope.

    #include <windows.h>

    typedef struct READ_OP {
        OVERLAPPED ov;
        char buffer[4096];
    } READ_OP;

    static DWORD read_one_file(const wchar_t *path)
    {
        HANDLE port = NULL, file = INVALID_HANDLE_VALUE;
        READ_OP op = {0};
        DWORD bytes = 0, result = ERROR_GEN_FAILURE;
        ULONG_PTR key = 0;
        LPOVERLAPPED completed = NULL;
        BOOL ok;
        DWORD err;

        file = CreateFileW(path, GENERIC_READ, FILE_SHARE_READ, NULL,
                           OPEN_EXISTING, FILE_FLAG_OVERLAPPED, NULL);
        if (file == INVALID_HANDLE_VALUE)
            return GetLastError();

        port = CreateIoCompletionPort(file, NULL, 1, 0);
        if (port == NULL) { result = GetLastError(); goto cleanup; }

        ok = ReadFile(file, op.buffer, sizeof(op.buffer), NULL, &op.ov);
        if (!ok) {
            err = GetLastError();
            if (err != ERROR_IO_PENDING) { result = err; goto cleanup; }
        }

        ok = GetQueuedCompletionStatus(port, &bytes, &key, &completed, INFINITE);
        if (completed == &op.ov) {
            if (ok) {
                /* Consume op.buffer[0..bytes) here, before returning. */
                result = ERROR_SUCCESS;
            } else {
                result = GetLastError(); /* Completed operation failed. */
            }
        } else {
            result = ok ? ERROR_INVALID_DATA : GetLastError();
        }

    cleanup:
        /* No outstanding operation may still refer to op/file at this point. */
        if (port != NULL) CloseHandle(port);
        if (file != INVALID_HANDLE_VALUE) CloseHandle(file);
        return result;
    }

A production IOCP server needs an explicit per-operation state machine, cancellation/drain rules, worker shutdown packets and outstanding-operation accounting. A failed GetQueuedCompletionStatus with a non-null OVERLAPPED describes an operation that completed with an error; it is not the same as a shutdown packet. Do not close the port or free operation memory while I/O can still complete.

## ETW and TraceLogging

Prefer the documented TraceLogging API for a small self-describing provider unless a manifest/event-schema requirement calls for another ETW mechanism. Register the provider during initialisation, emit events with safe structured fields, and unregister only after writers stop.

    #include <windows.h>
    #include <TraceLoggingProvider.h>

    TRACELOGGING_DEFINE_PROVIDER(
        g_hProvider,
        "Example.Provider",
        (0x3b4d1a51, 0x8c2f, 0x4b1a, 0x91, 0x20, 0x6d, 0x4f, 0x57, 0x30, 0x11, 0x09));

    /* Register once at startup. Use TraceLoggingWrite for structured events.
       Unregister at shutdown after all event writers have stopped. */

Do not put passwords, tokens, unredacted prompts or private payloads into traces. Include correlation IDs, bounded identifiers and numeric measurements so traces can be joined without exposing secret content.

## Deployment and servicing

Keep installer source, signing, packaging and installation as distinct steps. WiX authoring is XML and must not be presented as an executable PowerShell command. For MSIX, verify package identity, signing certificate, timestamp policy, architecture and target OS requirements. Test install, upgrade, repair and uninstall in a clean test VM.

For any code-signing or timestamping command, use approved certificates and avoid logging private key material. Validate the produced package and signature, then test the exact silent-install options against the target installer.

## Validation gates

- Build the actual Windows target with the intended compiler/SDK and warning policy.
- Exercise handle creation and closure, cancellation, timeouts, child-process failure and resource exhaustion.
- For IOCP, test success, immediate API failure, ERROR_IO_PENDING, failed completion, cancellation and shutdown with outstanding work.
- Test concurrency and lifetime under repeated runs; use Application Verifier, Windows debugging tools and sanitizers when supported by the target build.
- Record exact commands, Windows version, exit codes, tests run and limitations. A code snippet or tool name is not test evidence.

## Boundaries

- Use windows-driver-dev for KMDF, UMDF, WDM, WDDM, driver signing, Driver Verifier and device I/O.
- Use c-systems for C/C++ ownership and ABI contracts.
- Use linux-user for Linux userspace behaviour and sys-arch for cross-platform architecture.
