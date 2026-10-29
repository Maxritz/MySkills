---
name: architecture-boundaries
description: "Component architecture: modular boundaries, backend demarcation, porting isolation. Enforce dependency direction, explicit interfaces, replacement seams, platform adapters."
compatibility: opencode
---

# Architecture Boundaries

**Unified component architecture**: modular boundaries, backend service demarcation, and porting change isolation. Enforce dependency direction, explicit interfaces, and replacement seams.

---

## 1. Modular Component Boundaries

### Core Principle
Make components **independently understandable, testable, replaceable, and portable**.

### Component Definition

The following payment example is an architecture template, not a universal domain model. Choose contracts and guarantees that match the actual provider, ledger and persistence APIs.
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
- **Idempotency**: key + durable request identity + provider deduplication. This can provide effectively-once effects within documented retention bounds; it does not guarantee exactly-once across independent systems.

### Dependencies
- **Upstream**: API Gateway (auth, rate limit)
- **Downstream**: Provider API (external), Ledger (internal), Kafka (internal)
- **Platform**: PostgreSQL (persistence), Redis (cache), Vault (secrets)

### Failure Domains
- Provider API down → preserve a durable pending/unknown state; retry only with the same idempotency identity and provider guarantees. Never switch providers after an ambiguous timeout unless the first provider is proven not to have charged.
- Ledger down → keep a durable outbox item and retry idempotently, or hold the payment in a reconcilable pending state. Do not silently report settled success.
- DB down → fail state-changing payment requests closed with a documented error. Serve cached data only for reads whose contract explicitly permits staleness.

### Observability
- Metrics: `payments.total`, `payments.latency.p99`, `payments.errors`
- Traces: W3C traceparent, span per provider call
- Logs: Structured JSON, correlation ID

### Rollback Plan
- Feature flag: `payments.new_provider.enabled`
- Canary: 1% → 10% → 100%
- Rollback: flip flag, drain in-flight
```

### Rules
1. **One responsibility** per component (owner, lifecycle, data model, failure domain)
2. **Narrow interface** with versioning, validation, errors, ownership, concurrency, observability
3. **Enforce dependency direction**: platform, transport, persistence, policy behind adapters
4. **Separate composition/configuration** from implementation
5. **Migrate in small steps** with contract tests, differential checks, removal plan

### Anti-Patterns (FAIL)
- ❌ Single-impl interface
- ❌ One-product factory
- ❌ Unused config "for later"
- ❌ Circular dependencies
- ❌ Domain logic importing HTTP/DB SDKs

---

## 2. Backend Component Demarcation

### Layer Separation
```
TRANSPORT (HTTP/gRPC) 
  → APPLICATION (orchestration, validation, auth, transactions)
  → DOMAIN (pure business rules, no I/O)
  → PERSISTENCE (DB, cache, repos)
  → INFRASTRUCTURE (cloud SDK, filesystem, clock)
  → WORKERS/JOBS (background, external integrations)
  → CONFIG (process-global, feature flags)
```

### Boundary Rules
1. **Trace request** from transport to response; mark validation, authorization, transaction, domain, storage, queue, observability
2. **Domain logic independent** of HTTP, database, cloud SDK, process-global config
3. **DTO/schema translation at edges**; ownership, retries, idempotency, timeouts, errors explicit
4. **Background jobs & external integrations** behind interfaces; fake/test adapters **only in test code**
5. **Test each layer** + one E2E path; verify startup, migration, shutdown, failure recovery

### Implementation Pattern

Treat this example as an architectural flow, not drop-in payment code. The naive sequence “charge provider, then save payment, then write ledger” can lose the local record after a successful charge or return an ambiguous result after a crash.

Use explicit durable states and reconciliation:

1. Validate the request and bind the idempotency key to a canonical request hash. Reject reuse of the key with a different request.
2. Persist a PENDING payment and the idempotency record before starting the external effect.
3. Charge the provider with the same provider-supported idempotency key. Store the provider reference and result using a conditional state transition.
4. In the same database transaction as the state change, write an outbox event for ledger posting. A separate worker publishes it; the ledger consumer deduplicates by a stable event/payment ID.
5. On timeout or connection loss, store an UNKNOWN/RECONCILIATION_REQUIRED state and query the provider or retry only with the same safe idempotency identity. Never infer that a timeout means “not charged”.
6. Return the state that is actually durable. Do not report settlement merely because the provider call returned or because an in-memory object was updated.

Provider, repository and ledger interfaces should express timeouts, retryability, idempotency support and permanent versus transient failures. Exactly-once effects across independent systems are not assumed; document the deduplication and reconciliation guarantees.

---

## 3. Porting Change Isolation

### Principle
**Make platform deltas explicit, small, and reversible.**

### Isolation Checklist
| Check | Requirement |
|-------|-------------|
| **Stable contract identified** | Exact behavior spec frozen |
| **Narrow adapter** | Single capability, single file, ≤50 lines |
| **Capability probe** | Compile-time trait, not runtime `#ifdef` sprawl |
| **Fallback explicit** | Observable, semantically equivalent where possible |
| **One boundary at a time** | Land memory → test → thread → test → fs → test |
| **Contract/differential tests** | Before cleanup/optimization |
| **Temp code removal** | Only after target matrix proves safe |

### Adapter Pattern (Compile-Time)
```c
// capability.h - portable code includes ONLY this
#pragma once

/* API contract: zero size succeeds with *out == NULL. On error, *out
 * remains NULL and the function returns an errno-style error code. */
int platform_aligned_alloc(void **out, size_t align, size_t size);
void platform_aligned_free(void *ptr);
```

### Platform Adapters

Use the allocator API supported by the actual target. C99 does not include aligned_alloc, and the C11 aligned_alloc contract requires size to be an exact multiple of the requested alignment. POSIX posix_memalign does not have that size-multiple requirement and reports an error code directly. Windows _aligned_malloc memory must be released with _aligned_free, not free.

    #include <errno.h>
    #include <stddef.h>
    #include <stdlib.h>
    #if defined(_WIN32)
    #include <malloc.h>
    #endif

    int platform_aligned_alloc(void **out, size_t align, size_t size)
    {
        if (out == NULL)
            return EINVAL;
        *out = NULL;
        if (size == 0)
            return 0;
        if (align < sizeof(void *) || (align & (align - 1)) != 0)
            return EINVAL;

    #if defined(_WIN32)
        *out = _aligned_malloc(size, align);
        return *out != NULL ? 0 : ENOMEM;
    #elif defined(__unix__) || defined(__APPLE__)
        {
            int rc = posix_memalign(out, align, size);
            if (rc != 0)
                *out = NULL;
            return rc;
        }
    #else
    #error "Add a verified allocator adapter for this target"
    #endif
    }

    void platform_aligned_free(void *ptr)
    {
    #if defined(_WIN32)
        _aligned_free(ptr);
    #else
        free(ptr);
    #endif
    }

The POSIX implementation must be built with a feature-test macro that exposes posix_memalign in the target libc headers, where required. Keep the allocator contract consistent across platforms and test alignment, zero-size handling, allocation failure and matching deallocation.

### Delta Landing Template
```diff
# Commit: "port: add Linux memory adapter (1/5)"
+ platform/linux/memory.c (new, 45 lines)
+ platform/capability.h (updated: PLATFORM_ALIGNED_ALLOC)
  test/memory_adapter_test.c (new, differential vs reference)
```

### Test Before Next Delta
```bash
# Differential test: portable logic + new adapter vs reference
./test_memory_adapter --compare=reference_impl
```

---

## Cross-Cutting Validation

### Dependency Direction Check
```bash
# Tool: deptry / madge / custom script
# Fail if: domain imports transport, persistence imports application
python -c "
import ast, os
for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith('.py'):
            tree = ast.parse(open(os.path.join(root, f)).read())
            for node in ast.walk(tree):
                if isinstance(node, ast.ImportFrom):
                    if node.module and 'domain' in node.module and 'transport' in root:
                        print(f'VIOLATION: {root}/{f} imports domain from transport')
"
```

### Contract Tests

Use an asynchronous test function when awaiting an asynchronous service. These tests are test templates: adapt fixtures and expected status transitions to the real API and persistence model.

    async def test_payment_service_contract(payment_service, mock_provider, mock_ledger, mock_repo):
        req = PaymentRequest(amount=100, currency="USD", idempotency_key="case-001")
        mock_provider.charge.return_value = ProviderResponse(ref="pay_123", status="succeeded")

        resp = await payment_service.process(req)

        assert resp.status in {"pending_ledger", "completed"}
        mock_provider.charge.assert_awaited_once()
        # Also assert the durable payment state and outbox event exist.
        # Do not require ledger completion in the same request unless the
        # service contract explicitly guarantees synchronous ledger posting.

    async def test_payment_timeout_is_reconcilable(payment_service, mock_provider, payment_repo):
        mock_provider.charge.side_effect = TimeoutError()
        resp = await payment_service.process(
            PaymentRequest(amount=100, currency="USD", idempotency_key="case-timeout")
        )
        assert resp.status in {"unknown", "reconciliation_required", "pending"}
        assert await payment_repo.has_idempotency_record("case-timeout")

### Porting Differential Tests
```bash
# For each platform adapter
./test_<capability>_adapter --platform=linux --compare=reference
./test_<capability>_adapter --platform=windows --compare=reference
./test_<capability>_adapter --platform=baremetal --compare=reference
```

---

## Output Report

```
ARCHITECTURE BOUNDARIES: <layer> VALIDATION
LAYER: <modular|backend|porting>
COMPONENTS: <defined>/<total> (<violations>)
DEPENDENCY: <direction enforced ✅/❌>
INTERFACES: <versioned/validated> ✅/❌
ADAPTERS: <landed>/<planned>
CONTRACT TESTS: <passed>/<total>
DIFFERENTIAL: <platforms passing>/<total>
BLOCKERS: <circular dep|missing interface|untested adapter>
```

---

## Boundaries

- Does not write business logic (receives components to structure)
- Does not implement adapters (provides pattern)
- Does not manage deployment (see `app-engine-deploy`)
- `stop architecture-boundaries`: revert.