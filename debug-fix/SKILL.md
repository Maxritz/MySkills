---
name: debug-fix
description: "Smallest patch for confirmed root cause."
compatibility: opencode
metadata:
  role: debugging
  loading: on-demand
---

## Rules
- Fix the cause, not merely the symptom.
- Avoid unrelated refactoring during diagnosis.
- Preserve interfaces and behavior outside the affected contract.
- Build after the smallest viable patch.
- If the patch fails, update the hypothesis instead of stacking speculative patches.

Pattern:
`one causal hypothesis -> one minimal patch -> one verification cycle`
