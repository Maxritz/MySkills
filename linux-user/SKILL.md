---
name: linux-user
description: "Linux userspace systems: syscalls, pthreads, epoll, mmap, signals, IPC, systemd/cgroups, security hardening. User-space systems programming."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["syscall", "pthread", "epoll", "mmap", "signal", "IPC", "systemd", "cgroup", "process", "thread", "Linux", "mmap", "shared memory", "pipe", "socket", "seccomp", "capability"]
---
# Linux Userspace Systems

Route by the failing OS boundary. Record distribution/kernel, libc, privileges, service manager, process topology and exact reproduction before changing code or configuration.

## Area selector

| Area | Contract to verify |
|---|---|
| Processes/threads | lifecycle, signals, join/wait, exit status and inherited descriptors |
| Synchronisation | lock order, condition-variable predicates, atomics and memory ordering |
| Signals | async-signal-safe handlers and deterministic handoff to normal control flow |
| I/O/epoll | partial reads/writes, EINTR, EOF, edge-triggered drain, timeout and cancellation |
| mmap/IPC | checked offsets/lengths, mapping lifetime, permission and shared-state synchronization |
| systemd/cgroups | startup/readiness, restart policy, resource limits, graceful stop and logs |
| Security | least privilege, syscall/filesystem permissions, secret handling and trust boundaries |

Detailed commands, code patterns and validation probes: [Linux userspace recipes](references/userspace-recipes.md).

## Acceptance

Test success, partial completion, interrupted operations, resource exhaustion, permission failure, cancellation and shutdown where relevant. Verify real service/process behaviour, not only unit mocks. Separate observed kernel/runtime behaviour from assumptions.

## Evidence gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

## Boundaries

Use `linux-kernel-dev` for kernel/driver internals and `networking-systems` for protocol semantics.
