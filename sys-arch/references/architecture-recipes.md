# System Architecture: Component and Platform Recipes

Load when defining a component contract or selecting a cross-platform adapter. Examples are illustrative; map contracts, dependencies and failure behaviour to the actual system.

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
