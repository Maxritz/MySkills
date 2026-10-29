---
name: demoscene-opt
description: Apply size- and cycle-conscious optimisation techniques after establishing a measured bottleneck and a correctness reference.
license: MIT
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["demoscene", "tiny executable", "size optimisation", "size optimization", "code golf performance", "register pressure", "farbrausch", "ryg"]
---

# Demoscene Optimisation

Borrow the demoscene habit of treating code size, data movement, instruction scheduling and recomputation as explicit budgets. Optimisation is evidence-led: small code is not automatically fast, and fewer instructions are not automatically fewer cycles.

## First establish the constraint

Record the target, compiler/toolchain, binary-size budget, hot workload, correctness reference and measured baseline. Decide whether the target is code size, latency, throughput, memory traffic, register pressure, startup cost or a weighted combination.

## Technique families

| Technique | Opportunity | Required guardrail |
|---|---|---|
| Recompute instead of store | Intermediate value is cheap to regenerate and otherwise causes memory traffic | Measure arithmetic cost, cache traffic and total latency |
| Fuse stages | Producer and consumer can operate without materialising an intermediate | Preserve numerical order, aliasing rules and exception behaviour |
| Data layout | SoA/AoSoA or packed representation improves access/vectorisation | Validate ABI, alignment, cache and conversion cost |
| Integer/SIMD formulation | Integer operations or bit tricks suit the domain | Prove ranges, signedness, overflow and exact semantics |
| Specialisation | Known workload shapes allow simpler dispatch or loops | Keep a correct general path when required |
| Procedural generation | Data can be generated from compact parameters | Validate determinism, quality and runtime cost |
| Packing/compression | Storage or distribution size dominates | Include decompression cost and compatibility |
| Register scheduling | Independent operations can overlap and reduce spills | Inspect generated ISA and spills on the target |

## Workflow

1. Profile the complete workload and locate the dominant cost.
2. State one optimisation hypothesis and its predicted measurable effect.
3. Change one meaningful variable at a time.
4. Compare output against a trustworthy reference.
5. Inspect compiler output, register/spill reports and relevant counters when useful.
6. Measure repeated identical workloads, reporting median and spread with environment and configuration.
7. Keep the variant only if the measured benefit outweighs complexity and regressions.

## Reject

- Removing branches without proving that a branchless form is faster.
- Hand-written assembly before inspecting generated code and compiler behaviour.
- Hard-coded workload assumptions that silently break required inputs.
- Optimisation claims based on instruction counts alone or one noisy run.
- Techniques that reduce source size but increase runtime work or memory pressure without an accepted trade-off.

## Output

Report baseline, target budget, transformed mechanism, correctness result, binary-size delta, performance delta, generated-code evidence, and remaining trade-offs.

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Name the size/cycle budget and target before tuning. Measure the exact artifact and workload, change one technique at a time, compare output to a correctness reference, and reject gains that depend on unstable measurement or invalid language behaviour.


## Boundaries

Use \`optimization-toolkit\` or \`kernel-tuning\` for general profiling and tuning, and \`debug-verify\` for risk-appropriate correctness validation.