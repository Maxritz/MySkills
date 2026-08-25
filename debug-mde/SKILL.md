---
name: debug-mde
description: "Cheapest experiment distinguishing hypotheses."
compatibility: opencode
metadata:
  role: debugging
  loading: on-demand
---

## Selection
Prefer tests that are:
- safe and reversible;
- cheap to run;
- deterministic;
- minimally invasive;
- predictive of different outcomes for different hypotheses.

Choose the best information gained per execution/reasoning cost.

Typical MDEs:
- disable one transformation;
- replace one dependency with a controlled value;
- compare one boundary to a trusted reference;
- reduce one input dimension;
- repeat to test nondeterminism.

Stop generating theories when one causal explanation is sufficiently supported.
