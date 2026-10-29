---
name: architecture-boundaries
description: "Component architecture: modular boundaries, backend demarcation, porting isolation. Enforce dependency direction, explicit interfaces, replacement seams, platform adapters."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: false
  trigger_keywords: ["component", "module", "architecture", "boundary", "backend", "service", "porting", "adapter", "interface", "dependency direction", "replacement seam"]
---
# Architecture Boundaries

Use explicit component boundaries so implementations can change without breaking contracts or inverting dependencies.

## Boundary checklist

For each component identify:
- **Responsibility/ownership:** what it owns and what it must not do.
- **Interface:** input/output schemas, errors, ownership/lifetime, concurrency and side effects.
- **Dependencies:** allowed direction; keep domain rules independent from transport and infrastructure.
- **Failure domain:** timeout, retry/idempotency, cancellation, cleanup, observability and rollback.
- **Replacement seam:** interface/adapter and tests that prove the alternate implementation is used.

## Backend and porting rules

- Keep transport thin; application logic coordinates policy and transactions; domain rules avoid direct I/O; persistence and platform SDKs sit behind deliberate interfaces.
- Put platform-specific code in adapters; probe target capabilities rather than guessing from host macros.
- Change one coherent boundary at a time; compare behaviour with a reference before proceeding.
- Verify runtime wiring, not only folder structure or interface declarations.

Detailed component examples and adapter patterns: [architecture examples](references/boundary-examples.md).

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

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Verify dependency direction, ownership, interface errors, timeout/cancellation, and failure/rollback behaviour against the actual call graph. Diagrams and directory structure alone do not prove that runtime wiring respects the boundary.


## Boundaries

- Does not write business logic (receives components to structure)
- Does not implement adapters (provides pattern)
- Does not manage deployment (see `app-engine-deploy` in `knowledge-process`)
- `stop architecture-boundaries`: revert.