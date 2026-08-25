---
name: debug-reduce
description: "Shrink failing case, preserve failure."
compatibility: opencode
metadata:
  role: debugging
  loading: on-demand
---

## Procedure
1. Define an explicit failure predicate.
2. Remove or shrink one dimension.
3. Re-run the predicate.
4. Keep the reduction only if failure remains.
5. Repeat until further reduction loses the failure.

Reduce input size, execution length, state, dependencies, features, data dimensions, or concurrency as appropriate.
