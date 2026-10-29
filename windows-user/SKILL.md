---
name: windows-user
description: "Windows userspace systems: Win32/NT processes, threads, handles, I/O, synchronization, IOCP, ETW, driver model (WDDM/KMDF/UMDF), deployment. Windows userspace systems programming."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["Windows", "Win32", "NT", "process", "thread", "handle", "IOCP", "ETW", "WDDM", "KMDF", "UMDF", "driver", "deployment", "MSI", "MSIX", "Event Tracing", "critical section", "SRW lock", "condition variable", "thread pool"]
---

# Windows Userspace Systems

**User-space systems programming on Windows.** Covers processes, threads, handles, I/O, synchronisation, IOCP, ETW, driver model, and deployment.

---

## Area selector

| Area | Key acceptance condition |
|---|---|
| Process/thread/handles | lifecycle and ownership, wait/exit status, synchronisation and cancellation |
| IOCP/overlapped I/O | every submitted operation has one understood completion/cancellation path; handle lifetime outlives completions |
| ETW | provider/session/consumer agree; buffers, event loss and timestamps are reported |
| WDDM/KMDF/UMDF | user/kernel boundary, driver-version compatibility, timeout and failure recovery |
| Deployment | silent install/uninstall, upgrade, permissions, reboot and rollback behaviour |

Detailed procedures and commands: [Windows userspace recipes](references/windows-recipes.md).

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

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Track HANDLE ownership, overlapped-I/O completion, cancellation races, partial transfers and shutdown order. Verify access rights and OS/runtime assumptions; for GPU work separate WDDM/TDR symptoms from application-level queue and fence failures.


## Boundaries

- Does not write kernel code (see `os-kernel-systems`)
- Does not manage C/C++ ownership (see `c-systems`)
- Does not cover Linux (see `linux-user`)
- Does not cover architecture patterns (see `sys-arch`)
- `stop windows-user`: revert.