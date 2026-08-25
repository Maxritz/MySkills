---
name: linux-systems
description: "Linux: syscalls, pthreads, epoll, mmap."
license: MIT
compatibility: opencode
---

# Linux Systems Programming

## Process & Thread Management

- `fork()` + `execve()` for process creation. `waitpid()` for reaping.
- `clone()` for custom thread creation (or `pthread_create`).
- `pthread_mutex_t` + `pthread_cond_t` — always use `PTHREAD_MUTEX_ERRORCHECK` in dev.
- `pthread_*_np` (non-portable) for Linux-specific features (setaffinity, setname).

## Signals

- `sigaction` (not `signal`). `sa_handler` or `sa_sigaction` (for `SA_SIGINFO`).
- Async-signal-safe functions only in signal handlers: `write`, `_exit`, `sigatomic_t`.
- Block signals around critical sections: `pthread_sigmask(SIG_BLOCK, &set, NULL)`.
- `SIGCHLD` — use `waitpid(pid, &status, WNOHANG)` in loop.

## I/O Multiplexing

- `epoll_create1(EPOLL_CLOEXEC)` → `epoll_ctl` (add fd + events) → `epoll_wait`.
- Edge-triggered (`EPOLLET`) vs level-triggered. ET requires draining.
- `EPOLLONESHOT` for one-shot events (disable after first trigger).

## Memory Mapping

- `mmap(NULL, size, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0)` — anonymous.
- File-backed: `mmap(NULL, size, PROT_READ, MAP_PRIVATE, fd, offset)`.
- `mprotect` to change page permissions. `msync(MS_SYNC)` to flush to disk.
- `MAP_SHARED` for inter-process shared memory.

## IPC

- Pipes: `pipe2(fds, O_CLOEXEC)` — always use `O_CLOEXEC`.
- Unix domain sockets: `socket(AF_UNIX, SOCK_STREAM, 0)` + `bind` + `listen`.
- Shared memory: `shm_open` + `mmap` (or System V `shmget`+`shmat`).

## systemd & cgroups

- Unit file: `[Unit]`, `[Service]`, `[Install]`. `systemd-analyze verify unit.service`.
- cgroups v2: `/sys/fs/cgroup/` — cpu.max, memory.max, io.max for resource limits.
- `systemd-run --scope -p CPUQuota=50% command` for runtime resource limits.

## Security

- `setuid/setgid` — drop privileges to non-root after binding low ports.
- Capabilities: `cap_set_proc(cap_from_text("cap_net_bind_service+ep"))`.
- seccomp-bpf: `seccomp_init` + `seccomp_rule_add(ctx, SCMP_ACT_KILL, SCMP_SYS(open), 0)`.
- `prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0)` to prevent privilege escalation.
