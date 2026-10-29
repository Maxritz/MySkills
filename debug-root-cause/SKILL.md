---
name: debug-root-cause
description: Establish a causal chain from the observed failure to the first bad state, triggering operation and violated contract.
compatibility: opencode
metadata:
  role: debugging
---

# Debug Root Cause

A root cause is more than a plausible explanation. Establish how the observed failure follows from a specific operation or violated contract.

## Causal chain

\`failure → first bad state → triggering operation → violated expectation → defect\`

## Procedure

1. Confirm the symptom and the evidence at the failure boundary.
2. Find the first incorrect state or observable divergence.
3. Trace backwards to the operation that created it, considering callers, state ownership, configuration and external inputs.
4. State the violated requirement, invariant or API contract.
5. Challenge alternatives with the cheapest distinguishing experiment.
6. Confirm causality through direct evidence, a reliable reference, or a fix that removes the failure under the original reproducer and relevant regression tests.
7. Record confidence as SUSPECTED, SUPPORTED, CONFIRMED or REGRESSION-CONFIRMED. Explain what would invalidate the conclusion.

## Output

- Symptom and reproducer.
- First bad state and triggering operation.
- Violated contract.
- Evidence for/against competing causes.
- Confirmation test and result.
- Residual uncertainty.

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Connect trigger to the first bad state, operation and violated contract, and explain why competing causes fit less well. Validate the cause through an intervention or distinguishing test before recommending a fix.


## Boundaries

Do not infer intent from a shortcut or commit message. Do not call a cause confirmed solely because a patch compiles or the symptom disappears once. Handoff confirmed causes to \`debug-fix\`, then verify with \`debug-verify\`.