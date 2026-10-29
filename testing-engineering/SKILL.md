---
name: testing-engineering
description: Design meaningful unit, contract, integration, property, fuzz and regression tests with explicit acceptance criteria and honest execution evidence.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["testing strategy", "test design", "property-based testing", "fuzz testing", "regression test", "coverage", "flaky test", "test oracle"]
---

# Testing Engineering

Choose tests that can disprove the required behaviour, not tests that merely execute code.

## Workflow

1. Convert each requirement into an observable acceptance predicate and name the failure it is intended to catch.
2. Choose the cheapest test level that provides sufficient confidence, then add broader coverage for important integration boundaries.
3. Establish the baseline or known-good reference before changing behaviour.
4. Make tests deterministic where possible. Control seed, clock, filesystem, network, environment and concurrency; record what cannot be controlled.
5. Verify that the test fails for the defect or a deliberately injected equivalent, then passes for the fix. Do not weaken assertions to green the build.
6. Run tests against the current source revision and report exact commands, selection filters and results.
7. Keep tests independently runnable, bounded in runtime and clear about environmental prerequisites.

## Test selection

| Test type | Best use | Failure to watch for |
|---|---|---|
| Unit | Local logic and boundary conditions | Mocked away behaviour |
| Contract | API, ABI, schema and invariant guarantees | Test mirrors implementation rather than specification |
| Integration | Wiring across real modules or services | Only mocks were exercised |
| End-to-end | Critical real user path | Excessive scope and poor failure localisation |
| Property/model-based | Invariants across many generated states | Properties too weak to catch plausible defects |
| Fuzz | Parser and hostile or malformed inputs | Inputs vary but failures are not detected |
| Differential/golden | Compared with a pinned oracle | Oracle version or tolerance is unknown |
| Performance | Measured regression on representative load | Setup, warm-up or synchronisation differs |

## Coverage and reliability

- Use branch/state coverage to locate untested decisions, not as a proxy for correctness.
- Track skipped, flaky, quarantined and expected-failure tests explicitly, with an owner and reason.
- Retry a flaky test for diagnosis, not to erase its first failure.
- For random tests, record seeds and preserve minimized failing cases.
- Include timeout, cancellation, cleanup and error-path assertions for asynchronous and resource-owning code.
- Match floating-point tolerances to dtype and operation; do not use broad tolerances solely to make a test pass.

## Output

Report acceptance predicates, tests selected and why, exact executed commands, PASS/FAIL/BLOCKED/NOT RUN status, gaps and next highest-value test. Never infer suite success from a subset.

## Goli-mat-de integrity gate

Tie each test to a requirement and real code path. A test name, coverage percentage, compile success or mock-only test is not proof that the intended behaviour works.
