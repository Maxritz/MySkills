---
name: linux-user
description: "Linux userspace systems: syscalls, pthreads, epoll, mmap, signals, IPC, systemd/cgroups, security hardening. User-space systems programming."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  trigger_keywords: ["syscall", "pthread", "epoll", "mmap", "signal", "IPC", "systemd", "cgroup", "process", "thread", "Linux", "mmap", "shared memory", "pipe", "socket", "seccomp", "capability"]
---

# Linux Userspace Systems

**User-space systems programming on Linux.** Covers processes, threads, I/O, memory, IPC, systemd, and security.

---

## Process & Thread Management

```c
// Process creation
pid_t pid = fork();
if (pid == 0) {
    execl("/bin/ls", "ls", "-la", (char*)NULL);
    _exit(127);
} else if (pid > 0) {
    int status;
    waitpid(pid, &status, 0);
    if (WIFEXITED(status)) printf("Exit code: %d\n", WEXITSTATUS(status));
}

// Thread creation (pthreads)
void* worker(void* arg) { return NULL; }

pthread_t thread;
pthread_attr_t attr;
pthread_attr_init(&attr);
pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_JOINABLE);
pthread_create(&thread, &attr, worker, arg);
pthread_join(thread, NULL);

// Thread-local storage
__thread int tls_var = 0;
static pthread_key_t tls_key;
pthread_key_create(&tls_key, destructor);
pthread_setspecific(tls_key, value);
void* val = pthread_getspecific(tls_key);
```

## Synchronisation

```c
// Mutex (error-checking in dev)
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_mutexattr_t attr;
pthread_mutexattr_init(&attr);
pthread_mutexattr_settype(&attr, PTHREAD_MUTEX_ERRORCHECK);
pthread_mutex_init(&mutex, &attr);

// Condition variable
pthread_cond_t cond = PTHREAD_COND_INITIALIZER;
pthread_mutex_lock(&mutex);
while (!predicate) pthread_cond_wait(&cond, &mutex);
pthread_mutex_unlock(&mutex);
pthread_cond_signal(&cond);
pthread_cond_broadcast(&cond);

// Read-write lock
pthread_rwlock_t rwlock = PTHREAD_RWLOCK_INITIALIZER;
pthread_rwlock_rdlock(&rwlock);
pthread_rwlock_wrlock(&rwlock);
pthread_rwlock_unlock(&rwlock);
```

## Signals

```c
volatile sig_atomic_t shutdown_requested = 0;

void sig_handler(int sig, siginfo_t* info, void* ucontext) {
    (void)info; (void)ucontext;
    shutdown_requested = 1;
}

struct sigaction sa = {
    .sa_sigaction = sig_handler,
    .sa_flags = SA_SIGINFO | SA_RESTART,
};
sigemptyset(&sa.sa_mask);
sigaction(SIGTERM, &sa, NULL);
sigaction(SIGINT, &sa, NULL);

// Block signals in critical sections
sigset_t block_set, old_set;
sigemptyset(&block_set);
sigaddset(&block_set, SIGTERM);
sigaddset(&block_set, SIGINT);
pthread_sigmask(SIG_BLOCK, &block_set, &old_set);
pthread_sigmask(SIG_SETMASK, &old_set, NULL);
```

## I/O Multiplexing (epoll)

```c
int epfd = epoll_create1(EPOLL_CLOEXEC);

struct epoll_event ev = {
    .events = EPOLLIN | EPOLLET,
    .data = {.fd = listen_fd},
};
epoll_ctl(epfd, EPOLL_CTL_ADD, listen_fd, &ev);

struct epoll_event events[MAX_EVENTS];
while (!shutdown_requested) {
    int n = epoll_wait(epfd, events, MAX_EVENTS, -1);
    if (n < 0) {
        if (errno == EINTR) continue;
        break;
    }
    for (int i = 0; i < n; i++) {
        if (events[i].data.fd == listen_fd) {
            while (1) {
                int conn_fd = accept4(listen_fd, NULL, NULL, SOCK_NONBLOCK | SOCK_CLOEXEC);
                if (conn_fd < 0) {
                    if (errno == EAGAIN || errno == EWOULDBLOCK) break;
                    break;
                }
                ev.events = EPOLLIN | EPOLLET | EPOLLONESHOT;
                ev.data.fd = conn_fd;
                epoll_ctl(epfd, EPOLL_CTL_ADD, conn_fd, &ev);
            }
        } else {
            handle_client(events[i].data.fd, epfd);
        }
    }
}
```

## Memory Mapping

```c
// Anonymous (private)
void* ptr = mmap(NULL, size, PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS | MAP_POPULATE, -1, 0);

// File-backed (shared)
int fd = open("data.bin", O_RDWR);
void* ptr = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, offset);
close(fd);

// Change protection
mprotect(ptr, size, PROT_READ);

// Sync to disk
msync(ptr, size, MS_SYNC);

// Shared memory (POSIX)
int shm_fd = shm_open("/my_shm", O_CREAT | O_RDWR, 0600);
ftruncate(shm_fd, size);
void* ptr = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_SHARED, shm_fd, 0);
```

## IPC

```c
// Pipes
int pipefd[2];
pipe2(pipefd, O_CLOEXEC);

// Unix domain sockets
int sock = socket(AF_UNIX, SOCK_STREAM, 0);
struct sockaddr_un addr = {.sun_family = AF_UNIX};
strcpy(addr.sun_path, "/tmp/mysock");
bind(sock, (struct sockaddr*)&addr, sizeof(addr));
listen(sock, SOMAXCONN);

// Shared memory (System V)
int shmid = shmget(IPC_PRIVATE, size, IPC_CREAT | 0600);
void* ptr = shmat(shmid, NULL, 0);
shmdt(ptr);
shmctl(shmid, IPC_RMID, NULL);
```

## systemd & cgroups v2

```ini
[Unit]
Description=My App
After=network.target

[Service]
Type=notify
ExecStart=/usr/bin/myapp
Restart=on-failure
RestartSec=5
User=myapp
Group=myapp

CPUQuota=200%
MemoryMax=4G
IOReadBandwidthMax=/dev/sda 100M
IOWriteBandwidthMax=/dev/sda 50M

NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/myapp
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
```

```bash
systemd-run --scope -p CPUQuota=50% -p MemoryMax=2G myapp
cat /sys/fs/cgroup/myapp.slice/cpu.max
cat /sys/fs/cgroup/myapp.slice/memory.current
```

## Security Hardening

```c
if (setgid(gid) || setuid(uid)) handle_error();

cap_t caps = cap_init();
cap_set_flag(caps, CAP_EFFECTIVE, 1, (cap_value_t[]){CAP_NET_BIND_SERVICE}, CAP_SET);
cap_set_proc(caps);
cap_free(caps);

#include <seccomp.h>
scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_KILL);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(read), 0);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(write), 0);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(exit_group), 0);
seccomp_load(ctx);

prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0);
```

## Validation Gates

| Gate | Tool |
|------|------|
| **Build** | `cmake --build -Werror` |
| **Static** | `clang-tidy`, `cppcheck` |
| **Sanitizers** | ASan/TSan/UBSan/MSan |
| **Unit Tests** | `ctest` |
| **Integration** | `pytest` / custom |
| **Chaos** | `chaos-mesh` |
| **Load** | `wrk` / `locust` |

## Boundaries

- Does not write kernel code (see `os-kernel-systems`)
- Does not manage C/C++ ownership (see `c-systems`)
- Does not cover Windows (see `windows-user`)
- Does not cover architecture patterns (see `sys-arch`)
- `stop linux-user`: revert.