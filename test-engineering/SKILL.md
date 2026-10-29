---
name: test-engineering
description: Builds evidence-driven test strategies using unit, contract, integration, differential, property-based, fuzz, stress and regression tests.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["test strategy", "test coverage", "differential testing", "property-based test", "fuzz testing", "flaky test"]
---

# Test Engineering

Choose tests by the risk and contract being proved. Test count and line coverage alone do not establish correctness. Load debug-verify for verifying a specific fix and goli-mat-de when checking whether existing tests conceal incomplete implementation.

## Build the test model

For each requirement, record expected behaviour, preconditions, observable outputs, failure modes, reference/oracle, boundary cases and the cheapest decisive test. Map critical requirements to tests before implementation.

## Test layers

- **Unit:** deterministic local rules, arithmetic, state transitions and error conversion.
- **Contract:** public API preconditions, postconditions, ownership, ABI and invariants.
- **Integration:** real component boundaries, configuration, persistence, scheduler and runtime wiring.
- **Differential:** compare with a trusted implementation, old version, scalar oracle or reference model.
- **Property-based:** assert invariants across generated valid inputs and metamorphic relationships.
- **Fuzz:** explore malformed parsers, protocol inputs and stateful APIs; preserve minimized crashers as regressions.
- **Stress/concurrency:** pressure, cancellation, shutdown, contention, resource exhaustion and ordering.
- **Performance/regression:** fixed workloads with baseline, warm-up, repeated trials and correctness checks.

## Oracle quality

Prefer an independent, simple reference. Avoid duplicating the production algorithm in the test oracle. Mock only boundaries whose behaviour is not under test; keep at least one test through the real public entry point for critical paths. Make tolerances and nondeterminism policy explicit.

## Test quality traps

Detect vacuous assertions, tests skipped in CI, swallowed exceptions, hard-coded expected outputs copied from the implementation, flaky timing assumptions, mocks that bypass the bug, unseeded randomness and tests that assert implementation details rather than contracts. A passing test with a non-exercised code path is not evidence for that path.

## Execution protocol

1. Run the narrowest deterministic test first and preserve the failing output.
2. Run relevant regression and integration suites after the change.
3. Add boundary, negative and resource-failure tests for new branches.
4. Use sanitizers, race detectors and fuzzing when appropriate and supported.
5. Repeat flaky or concurrency-sensitive tests and distinguish product failures from harness failures.
6. Record exact commands, exit status, test count, skips, environment and result. Separate NOT RUN from PASS.

## Report

Provide requirement-to-test traceability, uncovered high-risk behaviours, oracle limitations, commands and evidence. Never claim completeness from coverage percentage alone.
