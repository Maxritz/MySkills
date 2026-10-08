---
name: architecture-boundaries
description: "Component architecture: modular boundaries, backend demarcation, porting isolation. Enforce dependency direction, explicit interfaces, replacement seams, platform adapters."
compatibility: opencode
metadata:
  loading: on-demand
  auto_trigger: true
  trigger_keywords: ["component", "module", "architecture", "boundary", "backend", "service", "porting", "adapter", "interface", "dependency direction", "replacement seam"]
---

# Architecture Boundaries

**Unified component architecture**: modular boundaries, backend service demarcation, and porting change isolation. Enforce dependency direction, explicit interfaces, and replacement seams.

---

## 1. Modular Component Boundaries

### Core Principle
Make components **independently understandable, testable, replaceable, and portable**.

### Component Definition
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
```python
# transport/http/routes.py (thin)
@router.post("/payments")
async def create_payment(req: PaymentRequest, service: PaymentService = Depends()):
    return await service.process(req)

# application/services/payment_service.py
class PaymentService:
    def __init__(self, provider: ProviderClient, ledger: LedgerClient, repo: PaymentRepo):
        self.provider = provider
        self.ledger = ledger
        self.repo = repo
    
    async def process(self, req: PaymentRequest) -> PaymentResponse:
        # Validation (application layer)
        if req.amount <= 0: raise ValidationError("amount > 0")
        
        # Domain logic (pure, no I/O)
        payment = Payment.create(req)
        
        # External calls (infrastructure)
        provider_resp = await self.provider.charge(payment)
        payment.provider_ref = provider_resp.ref
        
        # Persistence
        await self.repo.save(payment)
        await self.ledger.record(payment)
        
        return PaymentResponse.from_domain(payment)

# domain/models/payment.py (no imports outside domain)
class Payment:
    @staticmethod
    def create(req) -> "Payment":
        # Pure business rules
        pass

# persistence/repos/payment_repo.py
class PaymentRepo:
    async def save(self, payment: Payment): ...

# infrastructure/clients/provider_client.py
class ProviderClient:
    async def charge(self, payment: Payment) -> ProviderResponse: ...
```

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

#ifndef PLATFORM_ALIGNED_ALLOC
#  if defined(_WIN32)
#    define PLATFORM_ALIGNED_ALLOC(align, size) _aligned_malloc(size, align)
#    define PLATFORM_ALIGNED_FREE(ptr) _aligned_free(ptr)
#  elif defined(__linux__) || defined(__APPLE__)
#    define PLATFORM_ALIGNED_ALLOC(align, size) aligned_alloc(align, size)
#    define PLATFORM_ALIGNED_FREE(ptr) free(ptr)
#  else
#    error "PLATFORM_ALIGNED_ALLOC not defined for this target"
#  endif
#endif
```

### Platform Adapters
```c
// platform/linux/memory.c
#include "capability.h"
#include <stdlib.h>
#include <errno.h>

void* platform_aligned_alloc(size_t align, size_t size) {
    void* ptr = aligned_alloc(align, size);
    if (!ptr) errno = ENOMEM;
    return ptr;
}

void platform_aligned_free(void* ptr) {
    free(ptr);
}
```

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
```python
# tests/contract/test_payment_service.py
def test_payment_service_contract(payment_service, mock_provider, mock_ledger, mock_repo):
    # Given
    req = PaymentRequest(amount=100, currency="USD")
    mock_provider.charge.return_value = ProviderResponse(ref="pay_123")
    
    # When
    resp = await payment_service.process(req)
    
    # Then
    assert resp.status == "completed"
    mock_provider.charge.assert_called_once()
    mock_ledger.record.assert_called_once()
    mock_repo.save.assert_called_once()

def test_payment_service_failure_domain(payment_service, mock_provider):
    mock_provider.charge.side_effect = ProviderUnavailable()
    
    with pytest.raises(ProviderUnavailable):
        await payment_service.process(PaymentRequest(amount=100, currency="USD"))
```

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
- Does not manage deployment (see `app-engine-deploy` in `knowledge-process`)
- `stop architecture-boundaries`: revert.