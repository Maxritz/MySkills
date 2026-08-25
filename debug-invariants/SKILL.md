---
name: debug-invariants
description: "Check contracts relevant to failure."
compatibility: opencode
metadata:
  role: debugging
  loading: on-demand
---

Ask:
- What must always be true of inputs?
- What must always be true of state?
- What must always be true of outputs?
- What ownership/lifetime/bounds/type rules apply?

Use an invariant only if it can eliminate a live hypothesis. If a trusted reference comparison is cheaper and more decisive, use that instead.
