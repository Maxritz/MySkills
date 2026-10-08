---
name: sys-arch
description: "System architecture (platform-agnostic): architecture decomposition, component contracts, non-functional budgets, dependency direction, cross-platform patterns, validation gates. Platform-agnostic architecture design and review."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  trigger_keywords: ["architecture", "component", "boundary", "dependency direction", "non-functional", "budget", "contract", "decomposition", "failure domain", "observability", "rollback"]
---

# System Architecture

**Platform-agnostic architecture design and review.** Covers decomposition, component contracts, budgets, dependency direction, cross-platform patterns, and validation.

---

## Architecture Decomposition

```
Requirements → Actors & Trust Boundaries → Data/Control Flow → Component Contracts → Non-Functional Budgets → Testable Architecture
```

## Component Contract Template

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

## Non-Functional Budgets

| Budget | Target | Measurement |
|--------|--------|-------------|
| **Latency (p99)** | < 200ms | HTTP server metrics |
| **Throughput** | 10K req/s | Load test |
| **Availability** | 99.95% | Uptime monitor |
| **Memory** | < 2GB RSS | Process metrics |
| **CPU** | < 70% avg | Container metrics |
| **Cold start** | < 5s | Deploy metrics |
| **Recovery** | < 30s | Chaos test |

## Dependency Direction (Enforced)

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
    typedef HANDLE event_loop_t;
#else
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
SYS-ARCH: <phase> ANALYSIS
PHASE: <decomposition|contracts|budgets|validation>
COMPONENTS: <defined>/<total>
DEPENDENCY: direction enforced ✅/❌
CONTRACTS: versioned/validated ✅/❌
BUDGETS: <met>/<total>
BLOCKERS: <circular dep|missing interface|budget breach>
```

## Boundaries

- Does not write platform-specific code (see `linux-user` / `windows-user`)
- Does not write kernel code (see `os-kernel-systems`)
- Does not manage C/C++ ownership (see `c-systems`)
- `stop sys-arch`: revert.