---
name: debug-root-cause
description: "symptom -> bad state -> cause -> defect."
compatibility: opencode
metadata:
  role: debugging
  loading: on-demand
---

## Causal chain
`failure -> first bad state -> triggering operation -> violated expectation -> defect`

Confidence:
- suspected
- supported
- confirmed
- regression-confirmed

A root cause is confirmed only when targeted evidence establishes causality or the fix demonstrably removes the failure under the relevant tests.
