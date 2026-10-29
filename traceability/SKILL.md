---
name: traceability
description: Trace non-trivial execution paths from entry to exit with stable markers, contracts and source-level evidence.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  role: code-quality
  trigger_keywords: ["traceability", "trace markers", "source mapping", "DBG_TRACE", "execution trace"]
---

# Traceability

Make important execution paths inspectable without flooding production logs or imposing trace overhead on hot paths.

## Trace contract

For a non-trivial function or investigation target, record:
- Entry point and stable function/symbol identity.
- Preconditions and relevant input dimensions.
- Meaningful branch decisions, including the observed value when available.
- State or resource changes that affect the result.
- Error exits, success exit and cleanup path.
- Source mapping and the evidence needed to reproduce a finding.

A marker scheme such as \`[T-001]\` can link a function's contract, runtime trace, findings and tests. Markers must be unique within the agreed scope and useful for tracing, not merely decorative.

## Instrumentation rules

1. Prefer existing logging, tracing, debugger or profiler facilities before adding a new macro system.
2. Add probes at branch decisions, API boundaries, resource transitions and the first divergence likely to distinguish hypotheses.
3. Keep arguments and output safe: redact secrets, avoid dumping large buffers and avoid sensitive user data.
4. Make verbose tracing controllable and ensure disabled tracing does not materially change hot-path behaviour.
5. Trace every relevant error path, but do not add logging mechanically to every line.
6. For stripped binaries, preserve platform-appropriate symbols or separate debug information and verify address-to-source mapping with the actual toolchain.
7. Record which observations are static analysis versus runtime measurements.

## Validation

- [ ] Marker-to-function mapping is unambiguous.
- [ ] Relevant entry, branch, error and success paths are observable.
- [ ] Instrumentation is safe and can be disabled.
- [ ] Source mapping works for a sample address where relevant.
- [ ] The trace actually distinguishes a live hypothesis or explains execution.

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Trace entry through dispatch, state/resource effects and every meaningful exit, including errors and cancellation. Markers must be low-overhead, configurable and free of secrets; source claims require matching execution evidence.


## Boundaries

Traceability is an investigation aid, not proof of correctness by itself. Use \`debug-verify\` for executed verification and \`traceability-gate\` for the broader quality-gate workflow.