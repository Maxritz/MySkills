---
name: debug-reference
description: Compare a failing result with the lowest-cost trustworthy specification or implementation reference.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  role: debugging
  trigger_keywords: ["differential test", "golden reference", "reference comparison", "oracle", "expected output"]
---

# Debug Reference

Use the least expensive trustworthy reference that can settle the question. A reference is not trustworthy merely because it is familiar or produces a plausible result.

## Reference ladder

0. Specification, mathematical property or invariant.
1. Known-good input/output fixture with verified provenance.
2. Trusted component that covers the relevant behaviour.
3. Independent or established implementation.
4. Trusted end-to-end system.

Use the lowest sufficient level.

## Comparison procedure

1. Freeze the failing input and expected observable behaviour.
2. Record reference source, version, configuration and limitations.
3. Normalise input, configuration, precision, ordering, seeds, hardware-sensitive behaviour and tolerances.
4. Compare intermediate states before comparing only final output.
5. For numeric work, use explicit absolute, relative or RMS criteria appropriate to the algorithm. Do not assume bit-exact equality across different valid implementations.
6. For model runtimes, compare tokenisation, tensor shapes, intermediate tensors, logits, cache state and final output as relevant.
7. Distinguish reference defect, implementation defect and undefined or underspecified behaviour.
8. Preserve the smallest useful golden case as a regression test.

## Output

State the reference, what was compared, tolerance, first divergence, raw evidence, and remaining uncertainty.

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Pin the reference source and version. Compare contract-relevant outputs, not incidental formatting; normalise only known nondeterminism and distinguish specification violations from differences between implementations.


## Boundaries

Never fabricate an oracle or tune tolerances merely to pass. If no trustworthy reference exists, use specification-derived properties and invariants, and state the limitation.