---
name: debug-localize
description: Find the earliest observable boundary where behaviour diverges from its expected contract.
compatibility: opencode
metadata:
  role: debugging
---

# Debug Localize

Model the path as \`INPUT → STATE → TRANSFORMATION → OUTPUT\`. Find the earliest boundary where evidence changes from expected to incorrect.

## Procedure

1. Reproduce or capture the reported behaviour. Record expected versus actual result.
2. Map entry points, relevant callers and callees, branches, state changes and external boundaries.
3. Probe coarse component boundaries first. Narrow the failing region by bisecting the path.
4. Track separately:
   - **Failure boundary:** first point where the wrong result is visible.
   - **Causal boundary:** earliest operation that caused the wrong state.
   - **First bad write:** earliest invalid mutation when corruption is suspected.
5. For pipelines, compare intermediate outputs. For stateful systems, capture state before and after transitions.
6. Record values and branch decisions only when obtained from source analysis, logs, a debugger or instrumentation. Mark unknown branches as dynamic or unobserved.
7. Hand the localised boundary, evidence and remaining uncertainty to hypothesis testing.

## Output

\`ENTRY → call_A[branch/value] → call_B[branch/value] → FIRST DIVERGENCE\`

Include file/line or symbol at each meaningful boundary, the expected value, observed value, and the smallest next probe.

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Compare expected and observed state at progressively narrower boundaries until the earliest divergence is evidenced. Record instrumentation effects and do not infer cause from proximity alone.


## Boundaries

Localisation is not root-cause confirmation. A first bad value may be a symptom of an earlier write or violated contract. Use \`debug-root-cause\` before claiming causality.