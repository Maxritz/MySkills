---
name: linux-user-systems
description: "Unified Linux/Windows userspace: syscalls, pthreads, epoll, mmap, signals, IPC, systemd/cgroups, Win32/NT, ETW, processes/threads/handles, architecture (components, boundaries, data flow). User-space systems programming and design."
compatibility: opencode
metadata:
  loading: on-demand
  auto_trigger: true
  trigger_keywords: ["syscall", "pthread", "epoll", "mmap", "signal", "IPC", "systemd", "cgroup", "Win32", "NT", "ETW", "handle", "process", "thread", "architecture", "component", "boundary", "data flow"]
---

# Linux/Windows Userspace Systems

**Unified across Linux, Windows, and system architecture.** Choose the platform layer matching your task.

---

## 1. Linux Userspace

### Process & Thread Management
```c
// Process creation
pid_t pid = fork();
if (pid == 0) {
    // Child: exec new program
    execl("/bin/ls", "ls", "-la", (char*)NULL);
    _exit(127);  // Only if exec fails
} else if (pid > 0) {
    // Parent: wait
    int status;
    waitpid(pid, &status, 0);
    if (WIFEXITED(status)) printf("Exit code: %d\n", WEXITSTATUS(status));
}

// Thread creation (pthreads)
void* worker(void* arg) {
    // ... work ...
    return NULL;
}

pthread_t thread;
pthread_attr_t attr;
pthread_attr_init(&attr);
pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_JOINABLE);
pthread_create(&thread, &attr, worker, arg);
pthread_join(thread, NULL);

// Thread-local storage
__thread int tls_var = 0;  // GCC/Clang
// or
static pthread_key_t tls_key;
pthread_key_create(&tls_key, destructor);
pthread_setspecific(tls_key, value);
void* val = pthread_getspecific(tls_key);
```

### Synchronization
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
// ... critical section ...
pthread_mutex_unlock(&mutex);

// Signal to wake one/all
pthread_cond_signal(&cond);
pthread_cond_broadcast(&cond);

// Read-write lock
pthread_rwlock_t rwlock = PTHREAD_RWLOCK_INITIALIZER;
pthread_rwlock_rdlock(&rwlock);  // Multiple readers
pthread_rwlock_wrlock(&rwlock);  // Exclusive writer
pthread_rwlock_unlock(&rwlock);
```

### Signals
```c
// Async-signal-safe handler
volatile sig_atomic_t shutdown_requested = 0;

void sig_handler(int sig, siginfo_t* info, void* ucontext) {
    (void)info; (void)ucontext;
    shutdown_requested = 1;
    // Only async-signal-safe functions: write, _exit, sigatomic_t ops
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
// ... critical section ...
pthread_sigmask(SIG_SETMASK, &old_set, NULL);
```

### I/O Multiplexing (epoll)
```c
// Edge-triggered epoll
int epfd = epoll_create1(EPOLL_CLOEXEC);

struct epoll_event ev = {
    .events = EPOLLIN | EPOLLET,  // Edge-triggered
    .data = {.fd = listen_fd},
};
epoll_ctl(epfd, EPOLL_CTL_ADD, listen_fd, &ev);

// Event loop
struct epoll_event events[MAX_EVENTS];
while (!shutdown_requested) {
    int n = epoll_wait(epfd, events, MAX_EVENTS, -1);
    if (n < 0) {
        if (errno == EINTR) continue;
        perror("epoll_wait");
        break;
    }
    for (int i = 0; i < n; i++) {
        if (events[i].data.fd == listen_fd) {
            // Accept new connections (loop until EAGAIN)
            while (1) {
                int conn_fd = accept4(listen_fd, NULL, NULL, SOCK_NONBLOCK | SOCK_CLOEXEC);
                if (conn_fd < 0) {
                    if (errno == EAGAIN || errno == EWOULDBLOCK) break;
                    perror("accept");
                    break;
                }
                // Add to epoll with EPOLLONESHOT
                ev.events = EPOLLIN | EPOLLET | EPOLLONESHOT;
                ev.data.fd = conn_fd;
                epoll_ctl(epfd, EPOLL_CTL_ADD, conn_fd, &ev);
            }
        } else {
            // Handle client (re-arm with EPOLL_CTL_MOD after read)
            handle_client(events[i].data.fd, epfd);
        }
    }
}
```

### Memory Mapping
```c
// Anonymous (private)
void* ptr = mmap(NULL, size, PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS | MAP_POPULATE, -1, 0);
if (ptr == MAP_FAILED) handle_error();

// File-backed (shared)
int fd = open("data.bin", O_RDWR);
void* ptr = mmap(NULL, size, PROT_READ | PROT_WRITE,
                 MAP_SHARED, fd, offset);
close(fd);  // fd no longer needed after mmap

// Change protection
mprotect(ptr, size, PROT_READ);  // Read-only

// Sync to disk
msync(ptr, size, MS_SYNC);  // Or MS_ASYNC

// Shared memory (POSIX)
int shm_fd = shm_open("/my_shm", O_CREAT | O_RDWR, 0600);
ftruncate(shm_fd, size);
void* ptr = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_SHARED, shm_fd, 0);
```

### IPC
```c
// Pipes (always use O_CLOEXEC)
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
// ... use ...
shmdt(ptr);
shmctl(shmid, IPC_RMID, NULL);
```

### systemd & cgroups v2
```ini
# /etc/systemd/system/myapp.service
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

# Resource limits (cgroups v2)
CPUQuota=200%
MemoryMax=4G
IOReadBandwidthMax=/dev/sda 100M
IOWriteBandwidthMax=/dev/sda 50M

# Security
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/myapp
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
```

```bash
# Runtime resource control
systemd-run --scope -p CPUQuota=50% -p MemoryMax=2G myapp

# cgroups v2 inspection
cat /sys/fs/cgroup/myapp.slice/cpu.max
cat /sys/fs/cgroup/myapp.slice/memory.current
```

### Security Hardening
```c
// Drop privileges after binding
if (setgid(gid) || setuid(uid)) handle_error();

// Capabilities (minimal)
cap_t caps = cap_init();
cap_set_flag(caps, CAP_EFFECTIVE, 1, (cap_value_t[]){CAP_NET_BIND_SERVICE}, CAP_SET);
cap_set_proc(caps);
cap_free(caps);

// seccomp-bpf (kill on forbidden syscall)
#include <seccomp.h>
scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_KILL);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(read), 0);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(write), 0);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(exit_group), 0);
seccomp_load(ctx);

// Prevent new privileges
prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0);
```

---

## 2. Windows System Architecture

### Process & Thread (Win32/NT)
```c
// Process creation
STARTUPINFOEXW si = {0};
si.StartupInfo.cb = sizeof(si);
PROCESS_INFORMATION pi;
BOOL ok = CreateProcessW(
    L"C:\\path\\app.exe",  // lpApplicationName
    L"app.exe arg1 arg2",  // lpCommandLine
    NULL,                  // lpProcessAttributes
    NULL,                  // lpThreadAttributes
    FALSE,                 // bInheritHandles
    EXTENDED_STARTUPINFO_PRESENT | CREATE_UNICODE_ENVIRONMENT,
    NULL,                  // lpEnvironment
    NULL,                  // lpCurrentDirectory
    &si.StartupInfo,
    &pi
);
CloseHandle(pi.hThread);
WaitForSingleObject(pi.hProcess, INFINITE);
DWORD exit_code;
GetExitCodeProcess(pi.hProcess, &exit_code);
CloseHandle(pi.hProcess);

// Thread creation
DWORD WINAPI Worker(LPVOID lpParameter) {
    // ... work ...
    return 0;
}
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

### Synchronization
```c
// Critical section (user-mode, fast)
CRITICAL_SECTION cs;
InitializeCriticalSectionEx(&cs, 4000, CRITICAL_SECTION_NO_DEBUG_INFO);
EnterCriticalSection(&cs);
// ... critical section ...
LeaveCriticalSection(&cs);
DeleteCriticalSection(&cs);

// Condition variable
CONDITION_VARIABLE cv;
InitializeConditionVariable(&cv);
EnterCriticalSection(&cs);
while (!predicate) SleepConditionVariableCS(&cv, &cs, INFINITE);
// ...
LeaveCriticalSection(&cs);
WakeConditionVariable(&cv);  // or WakeAllConditionVariable

// SRW Lock (slim reader-writer)
SRWLOCK srw = SRWLOCK_INIT;
AcquireSRWLockExclusive(&srw);  // Writer
AcquireSRWLockShared(&srw);     // Reader
ReleaseSRWLockExclusive(&srw);
ReleaseSRWLockShared(&srw);

// Events (kernel objects)
HANDLE event = CreateEvent(NULL, TRUE, FALSE, NULL);  // Manual-reset
SetEvent(event);  // Signal
ResetEvent(event);  // Non-signaled
WaitForSingleObject(event, INFINITE);
```

### I/O Completion Ports (IOCP)
```c
// Create IOCP
HANDLE iocp = CreateIoCompletionPort(INVALID_HANDLE_VALUE, NULL, 0, 0);

// Associate file/socket
HANDLE file = CreateFile(L"data.bin", GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_FLAG_OVERLAPPED, NULL);
CreateIoCompletionPort(file, iocp, (ULONG_PTR)file, 0);

// Post async read
OVERLAPPED ol = {0};
ol.Offset = offset;
ReadFile(file, buffer, size, NULL, &ol);

// Worker threads
DWORD WINAPI IOCPWorker(LPVOID lpParam) {
    HANDLE iocp = (HANDLE)lpParam;
    while (TRUE) {
        DWORD bytes;
        ULONG_PTR key;
        LPOVERLAPPED ol;
        BOOL ok = GetQueuedCompletionStatus(iocp, &bytes, &key, &ol, INFINITE);
        if (!ok && ol == NULL) break;  // Shutdown
        // Handle completion (ol contains context)
    }
    return 0;
}
```

### ETW (Event Tracing for Windows)
```c
// Provider registration
TRACEHANDLE reg_handle;
EVENT_DESCRIPTOR event = {0, 0, 0, 0, 0, 0, 0, 0};
ULONG status = EventRegister(&PROVIDER_GUID, EnableCallback, NULL, &reg_handle);

// EnableCallback
void NTAPI EnableCallback(LPCGUID source_id, ULONG is_enabled, UCHAR level, ULONGLONG match_any, ULONGLONG match_all, ULONGLONG filter, PVOID callback_context) {
    if (is_enabled) {
        // Start tracing
    } else {
        // Stop tracing
    }
}

// Log event
EventWrite(reg_handle, &event, 0, NULL);

// Unregister
EventUnregister(reg_handle);
```

### Driver Model (WDDM/KMDF/UMDF)
```c
// KMDF driver entry
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
    // Configure queues, interrupts, DMA
    return status;
}
```

### Deployment & Servicing
```powershell
# MSI packaging (WiX)
<Package Id="*" Manufacturer="MyCorp" InstallerVersion="500" />

# MSIX (modern)
MakeAppx.exe pack /d "PackageRoot" /p "MyApp.msix"
SignTool.exe sign /fd SHA256 /a /tr http://timestamp.digicert.com /td SHA256 MyApp.msix

# Silent install
msiexec /i MyApp.msi /qn /norestart
```

---

## 3. System Architecture (Platform-Agnostic)

### Architecture Decomposition
```
Requirements → Actors & Trust Boundaries → Data/Control Flow → Component Contracts → Non-Functional Budgets → Testable Architecture
```

### Component Contract Template
```markdown
## Component: PaymentService

### Responsibility
Process payment transactions, manage refunds, reconcile with providers.

### Ownership
- Team: Payments
- SLA: 99.9% availability, p99 < 200ms

### Interfaces
- **Inbound**: `POST /payments` (HTTP/JSON), `PaymentRequested` (Kafka)
- **Outbound**: `ProviderClient` (gRPC), `LedgerClient` (gRPC), `AuditLog` (Kafka)

### Data Model
- `Payment`: id, amount, currency, status, provider_ref, created_at
- `Refund`: id, payment_id, amount, reason, status

### Contracts
- **Precondition**: `amount > 0`, `currency` in supported list
- **Postcondition**: `Payment` persisted, `ProviderClient.charge` called, `AuditLog` emitted
- **Errors**: `InsufficientFunds`, `ProviderUnavailable`, `InvalidCurrency`
- **Idempotency**: `Idempotency-Key` header → exactly-once

### Dependencies
- **Upstream**: API Gateway (auth, rate limit)
- **Downstream**: Provider API (external), Ledger (internal), Kafka (internal)
- **Platform**: PostgreSQL (persistence), Redis (cache), Vault (secrets)

### Failure Domains
- Provider API down → queue for retry, degrade to alternative provider
- Ledger down → reject new payments, return 503
- DB down → read-only mode, serve from cache

### Observability
- Metrics: `payments.total`, `payments.latency.p99`, `payments.errors`
- Traces: W3C traceparent, span per provider call
- Logs: Structured JSON, correlation ID

### Rollback Plan
- Feature flag: `payments.new_provider.enabled`
- Canary: 1% → 10% → 100%
- Rollback: flip flag, drain in-flight
```

### Non-Functional Budgets
| Budget | Target | Measurement |
|--------|--------|-------------|
| **Latency (p99)** | < 200ms | HTTP server metrics |
| **Throughput** | 10K req/s | Load test |
| **Availability** | 99.95% | Uptime monitor |
| **Memory** | < 2GB RSS | Process metrics |
| **CPU** | < 70% avg | Container metrics |
| **Cold start** | < 5s | Deploy metrics |
| **Recovery** | < 30s | Chaos test |

### Dependency Direction (Enforced)
```
Transport (HTTP/gRPC) 
  → Application (orchestration, validation, auth)
  → Domain (pure business rules)
  → Persistence (repos, SQL)
  → Infrastructure (cloud SDK, FS, clock)
  → Workers (background jobs)
  → Config (feature flags, secrets)
```

**Rule:** Inner layers never import outer layers. Domain has zero external deps.

---

## Cross-Platform Patterns

### Portable Threading
```c
#if defined(_WIN32)
    typedef HANDLE thread_t;
    #define THREAD_CREATE(t, fn, arg) ((*(t) = CreateThread(NULL, 0, fn, arg, 0, NULL)) != NULL)
    #define THREAD_JOIN(t) WaitForSingleObject(*(t), INFINITE)
    #define THREAD_CLOSE(t) CloseHandle(*(t))
#else
    typedef pthread_t thread_t;
    #define THREAD_CREATE(t, fn, arg) (pthread_create((t), NULL, fn, arg) == 0)
    #define THREAD_JOIN(t) (pthread_join(*(t), NULL) == 0)
    #define THREAD_CLOSE(t) /* nothing */
#endif
```

### Portable Event Loop
```c
#if defined(_WIN32)
    // IOCP-based
    typedef HANDLE event_loop_t;
#else
    // epoll-based
    typedef int event_loop_t;
#endif

event_loop_t loop_create();
void loop_add(event_loop_t, int fd, uint32_t events, void (*cb)(int, uint32_t, void*), void* ctx);
void loop_run(event_loop_t);
void loop_stop(event_loop_t);
```

---

## Validation Gates

| Gate | Linux | Windows | Architecture |
|------|-------|---------|--------------|
| **Build** | `cmake --build -Werror` | MSVC `/W4 /WX` | N/A |
| **Static** | `clang-tidy`, `cppcheck` | `/analyze`, `PREfast` | Dependency check |
| **Sanitizers** | ASan/TSan/UBSan/MSan | ASan (experimental) | N/A |
| **Unit Tests** | `ctest` | `ctest` / GoogleTest | Contract tests |
| **Integration** | `pytest` / custom | `pytest` / custom | E2E path |
| **Chaos** | `chaos-mesh` | `chaos-mesh` | Failure injection |
| **Load** | `wrk` / `locust` | `wrk` / `locust` | Budget check |

---

## Output Report

```
LINUX/WINDOWS USERSpace: <platform> ANALYSIS
PLATFORM: <Linux|Windows|Architecture>
ISSUE: <deadlock|leak|performance|correctness|design>
LOCALIZATION: <syscall|pthread|epoll|IOCP|component>
ROOT CAUSE: <locking|lifetime|race|design|resource>
FIX: <patch summary>
VALIDATION: build✅ sanitizers✅ unit✅ integration✅ chaos✅ budget✅
BLOCKERS: <kernel version|driver|privilege|legacy API>
```

---

## Boundaries

- Does not write kernel code (see `os-kernel-systems`)
- Does not manage C/C++ ownership (see `c-systems`)
- Does not optimize GPU kernels (see `amd-gpu-stack`/`nvidia-cuda-stack`)
- `stop linux-user-systems`: revert.