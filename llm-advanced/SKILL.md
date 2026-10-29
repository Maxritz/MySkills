---
name: llm-advanced
description: "LLM advanced components: MoE (router, expert capacity, shared experts), speculative decoding (standard, Medusa, EAGLE, Lookahead), numerical tolerances per component per precision. Advanced/specialised LLM subsystems."
compatibility: opencode
---
# LLM Advanced Components

Use only the subsystem relevant to the change. Pin model architecture/configuration, weights revision, runtime, dtype and workload.

## Component router

| Component | Required contract | Key verification |
|---|---|---|
| MoE | router scores/top-k, expert mapping, capacity/drop policy, shared experts and combine weights | routing/expert IDs, token conservation, load balance, reference output |
| Speculative decoding | draft/target token alignment, acceptance/rejection, cache rollback and stopping rules | exact output distribution/sequence semantics, acceptance rate and cache consistency |
| Quantised/numerical path | scale/zero-point/layout, accumulation precision, rounding and overflow | dequant reference, dtype-aware tolerances and end-to-end quality |

Detailed algorithm choices, model-specific examples, tolerances and test procedures: [advanced LLM recipes](references/advanced-recipes.md).

## Shared acceptance gates

1. Validate intermediates before end-to-end generation.
2. Compare with a trustworthy version-pinned reference and justified precision-specific tolerances.
3. Cover boundary shapes, empty experts/batches, capacity overflow, rejected speculative tokens, cancellation and cache rollback when applicable.
4. Benchmark only after correctness; report active parameters, routing/cache behaviour and the exact prefill/decode workload.

## Report

State model/config/revision, changed path, reference and tolerance, tests executed, measured performance and unresolved cases. Mark blocked/unrun checks honestly.

## Evidence gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

## Boundaries

Use `llm-core` for shared model components, `llm-serving` for serving runtime and `llm-hardcode` for hand-written kernels.
