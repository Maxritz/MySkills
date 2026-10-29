---
name: kernel-tuning
description: Measure and improve CPU/GPU compute kernels using profiling, bandwidth and arithmetic-intensity models, memory/layout analysis and controlled experiments.
compatibility: opencode
---

# Kernel Tuning

Optimise the measured bottleneck while preserving the kernel's contract and numerical behaviour. Architecture-specific assumptions must be labelled and checked on the actual target.

## Measurement baseline

Record source revision, compiler and flags, hardware, runtime/driver, input shapes, dtype/precision, warm-up, synchronisation, iterations, output validation and timing boundary. Separate launch/dispatch overhead, host submission, queue waits, device execution, transfers and end-to-end latency.

Run enough repetitions to report a robust centre and variation. Do not describe the minimum as a universal hardware ceiling; it may reflect noise or an atypical run.

## Localise the limit

- **Compute-bound:** instruction throughput or dependencies dominate. Inspect generated ISA, instruction mix and achievable issue rates.
- **Memory-bandwidth-bound:** measured data traffic approaches the effective bandwidth for the relevant memory level.
- **Latency-bound:** dependency chains or memory latency dominate and parallel work cannot hide them.
- **Launch/dispatch-bound:** host submission, dispatch count or synchronisation is a large fraction of total time.
- **Occupancy/register-bound:** register or local-memory pressure limits active work or creates spills.
- **Synchronisation-bound:** barriers, atomics or queue dependencies stall otherwise available work.

Use a roofline model as a screening tool, not a replacement for profiling. Arithmetic intensity is useful only when byte counts and operation counts match the measured workload and memory level.

## Tuning loop

1. Preserve a known-good implementation and its test inputs.
2. Profile the whole operation and its hot regions.
3. Form one testable hypothesis from the measurements.
4. Change one variable: layout, tile sizes, vector width, unrolling, fusion, prefetch, launch geometry, staging or synchronisation.
5. Inspect compiler/vectorisation reports or generated machine code when they can explain the result.
6. Validate correctness, edge cases, memory safety and concurrency.
7. Repeat the same workload and compare latency/throughput, variance, resource use and end-to-end effects.
8. Retain only reproducible wins with an explicit trade-off statement.

## Platform notes

- CPU SIMD choices depend on the actual ISA, microarchitecture, compiler and workload. Runtime-dispatch specialisations must include a safe fallback and feature checks.
- GPU occupancy is a constraint, not a universal target. Higher occupancy can lose to register reuse, larger tiles or lower memory traffic.
- Cache-line size, wave/warp width, shared-memory banking and instruction latency differ by target. Verify before applying a numeric rule.
- Use device-specific profilers for counters; do not infer bandwidth or execution time from source code alone.

## Output contract

Provide baseline and result, raw measurements, repetitions/spread, target and compiler configuration, correctness evidence, first limiting resource, changed variables, expected-versus-observed effect and residual bottlenecks.

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Record workload shape, target/compiler, warm-up, synchronisation boundary, repetitions and spread. Establish correctness before tuning, identify the measured limiting resource, and report median plus variance rather than the fastest sample alone.


## Boundaries

Use \`optimization-toolkit\` for broader optimisation strategy, the relevant CPU/GPU stack skill for hardware specifics, and \`sherlock-it\` for multi-layer performance investigations.