---
name: debug-reference
description: "Compare against lowest-cost trusted reference."
compatibility: opencode
metadata:
  role: debugging
  loading: on-demand
---

## Reference ladder
0. Specification/property/math
1. Known-good input/output
2. Known-good component
3. Trusted implementation
4. Trusted end-to-end system

Use the lowest sufficient level. Compare intermediate states, not only final output.

Normalize inputs, configuration, precision, ordering, seeds, versions, and tolerances before declaring a mismatch.
