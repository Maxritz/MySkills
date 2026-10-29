---
name: debug-reduce
description: Minimise a failing input or execution while preserving a defined failure predicate.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  role: debugging
  trigger_keywords: ["reduce reproducer", "minimise test case", "minimize test case", "shrink failing input", "delta debugging"]
---

# Debug Reduce

Reduce a failure to the smallest reliable case while preserving the same failure mechanism as far as evidence permits.

## Procedure

1. Define a precise failure predicate, including exit status, output mismatch, crash signature, invariant, timeout or numerical tolerance.
2. Save the original reproducer, invocation, expected/actual output and environment.
3. Remove or shrink one dimension at a time: input bytes, sequence length, tensor dimensions, steps, dependencies, features, concurrency or state.
4. Re-run the predicate after each reduction. Keep a reduction only when the failure remains.
5. Repeat until further reduction loses the failure or the reduction budget is exhausted.
6. Re-run the minimal case more than once when nondeterminism is plausible.
7. Compare the reduced case with the original to ensure the same failure signature remains.

## Safety and reporting

Preserve a copy of the original input. Do not reduce away the condition under investigation or claim a minimal case when the search was partial. Report the remaining dimensions and any non-deterministic behaviour.

## Output

- Original case and failure predicate.
- Reduced case and exact invocation.
- Reduction steps retained/rejected.
- Reproduction rate and signature comparison.
- Known limitations.