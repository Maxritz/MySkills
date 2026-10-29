---
name: debug-invariants
description: Check the contracts and invariants that can distinguish live failure hypotheses.
compatibility: opencode
metadata:
  role: debugging
---

# Debug Invariants

Identify properties that must hold for valid execution, then use the cheapest relevant check to determine where a live hypothesis fails.

## Questions

- What must always be true of the inputs?
- What must always be true of the internal state?
- What must always be true of outputs and side effects?
- Which type, bounds, alignment, ownership, lifetime, ordering, synchronisation, shape, range or numerical constraints apply?
- At which boundary can the property be checked without changing behaviour materially?

## Procedure

1. Derive invariants from the actual API contract, specification, format definition, code and trusted reference. Mark inferred invariants as assumptions.
2. Trace the relevant path and record the invariant before and after each transformation.
3. Classify each check as PASS, FAIL, NOT CHECKED or NOT APPLICABLE. Do not infer PASS merely because no crash occurred.
4. Use an invariant only if it can eliminate a live hypothesis or expose a violated contract.
5. Prefer a trusted reference comparison when it is cheaper and more decisive.
6. For numeric algorithms, specify data type, precision, absolute/relative/RMS tolerance and the point where comparison occurs.
7. Turn failed invariants into a minimal reproducer and a focused regression test where practical.

## Output

| Boundary | Invariant | Evidence | Status | Next discriminating check |
|---|---|---|---|---|
| Input | <required property> | <observed value> | <status> | <test> |

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- State invariants as observable predicates with an evaluation point and scope. Check them at state transitions, error paths and cleanup boundaries; do not present assumptions as verified properties.


## Boundaries

Do not add arbitrary assertions just to increase their count. Assertions must reflect a real contract and must not replace production error handling for invalid external input.