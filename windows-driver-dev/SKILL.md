---
name: windows-driver-dev
description: "Windows kernel and device-driver engineering with WDK, KMDF/UMDF/WDM, PnP/power, I/O queues, DMA, interrupts, signing and verification."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["Windows driver", "WDK", "KMDF", "UMDF", "WDM", "WDF", "WDDM", "Driver Verifier", "IRP", "DMA", "PnP", "DeviceIoControl"]
---

# Windows Driver Development

Use the Microsoft WDK documentation and samples for the exact target Windows release and driver framework. A code fragment that registers an entry point is not a complete device driver. Prefer KMDF or UMDF when the device and deployment constraints support them; use WDM directly only when required by the contract.

Primary references:
- [Windows hardware developer documentation](https://learn.microsoft.com/en-us/windows-hardware/drivers/)
- [Using WDF to develop a driver](https://learn.microsoft.com/en-us/windows-hardware/drivers/wdf/using-the-framework-to-develop-a-driver)
- [Driver Verifier](https://learn.microsoft.com/en-us/windows-hardware/drivers/devtest/driver-verifier)
- [Validating Windows drivers](https://learn.microsoft.com/en-us/windows-hardware/drivers/develop/validating-windows-drivers)

## Freeze the target and threat model

Record Windows build, WDK/SDK, compiler, KMDF/UMDF target and minimum versions, architecture, device type, signing requirements, Secure Boot/VBS/HVCI status, deployment method and test hardware. Identify whether code runs in user or kernel mode and at which IRQL callbacks execute. Kernel errors can crash or corrupt the system; validate on a disposable test machine or VM with recovery access.

## Select the correct driver model

- **KMDF:** kernel-mode device driver using WDF object and event-callback contracts.
- **UMDF:** user-mode driver supported by UMDF version and device class; understand the user/kernel boundary and service lifetime.
- **WDM:** direct Windows Driver Model implementation when framework constraints require it.
- **WDDM/display:** graphics-specific kernel/user driver stack with distinct requirements; do not treat it as a generic KMDF example.
- **Device interface:** expose only required IOCTLs and define access rights, buffer method, versioning, input/output lengths and trust boundary.

Do not mix KMDF APIs with a WDM DriverEntry signature or mix UMDF assumptions with kernel-mode code. DriverEntry/EvtDriverDeviceAdd callbacks are governed by the selected framework's exact declarations and lifecycle.

## Architecture before callbacks

Trace device discovery → driver load → device/object creation → resource acquisition → queue/IO request → hardware interaction → completion/cancellation → power/PnP transition → teardown. For each resource, define owner, acquisition point, release callback and failure unwind.

Use subsystem frameworks where possible rather than reimplementing class behaviour. For a real device driver, validate resource ownership with PnP and power transitions, surprise removal, repeated start/stop, suspend/resume and partial initialisation failure.

## I/O contract and security

- Validate every IOCTL's access mode, input/output buffer lengths, structure version, enum/range values, count arithmetic and user-controlled offsets.
- Never trust user pointers, sizes, alignment or handles. Use the framework's buffer access rules and capture/validate user data at the correct boundary.
- Define synchronous/asynchronous completion, cancellation, timeout, buffer ownership and exactly when the request can be completed.
- Avoid holding spin locks across blocking operations or invoking callbacks at an invalid IRQL. Document lock ordering and callback IRQL.
- Do not expose arbitrary physical memory, unrestricted port I/O, kernel addresses, or privileged device operations through an insufficiently checked interface.
- Validate DMA buffer lifetime, mapping, alignment, direction, IOMMU constraints and teardown. A CPU virtual address is not a DMA address.
- Ensure cleanup is idempotent and safe under partial initialisation, cancellation, device removal and concurrent callbacks.

## Build and package

Use the matching WDK project templates and official samples as the source of truth for build settings and required INF/catalog/package contents. Pin target framework versions deliberately. Inspect the produced binaries and package, verify signatures and test on the intended Windows build.

Do not claim a driver is deployable merely because it compiles. Installation, device matching, signature trust, policy restrictions and target OS support are separate gates. Signing requirements can change; verify current Microsoft policy before release.

## Validation and debugging

1. Build a checked/debug configuration and retain warnings, Code Analysis output and symbols.
2. Install and test only on a recoverable test machine. Enable kernel debugging and collect logs/dumps before attempting risky reproduction.
3. Use Driver Verifier only on designated test systems; it may deliberately crash the OS when it detects violations.
4. Run relevant Device Fundamentals tests, framework-specific tests and Hardware Lab Kit tests when release qualification requires them.
5. Exercise malformed IOCTLs, zero/large lengths, allocation failure, cancellation races, concurrent requests, device unplug and shutdown.
6. Check whether Static Driver Verifier is available in the selected WDK. Do not rely on it without checking version: current WDK releases no longer include SDV in some configurations.
7. Reproduce after the fix and confirm both the failing path and regression suite; record blocked hardware-specific checks honestly.

## Completion report

    WINDOWS DRIVER: VALIDATION
    MODEL: KMDF / UMDF / WDM / WDDM and framework version
    TARGET: Windows build, architecture, WDK/compiler
    LIFECYCLE: PnP/power/start/stop/removal checks
    IO: IOCTL contracts, malformed inputs and cancellation
    MEMORY: DMA/buffer lifetime and cleanup
    TESTS: commands, Driver Verifier/HLK status and results
    SIGNING: package/catalog verification
    STATUS: PASS / FAIL / BLOCKED / NOT RUN
    BLOCKERS: explicit list

## Boundaries

- Use windows-user for process/thread/IOCP/ETW user-mode code.
- Use amd-gpu-stack or nvidia-cuda-stack for compute APIs; WDDM remains a separate Windows driver contract.
- Use security-hardening for deeper trust-boundary reviews.
