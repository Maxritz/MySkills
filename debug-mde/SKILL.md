---
name: debug-mde
description: Choose the minimum distinguishing experiment that best separates competing failure hypotheses.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  role: debugging
  trigger_keywords: ["minimum distinguishing experiment", "MDE", "cheapest experiment", "falsify hypothesis"]
---

# Debug MDE: Minimum Distinguishing Experiment

Choose the smallest safe experiment whose possible results separate the most important live hypotheses.

## Selection criteria

Prefer an experiment that is safe and reversible, low-cost, deterministic, minimally invasive, and predictive of different outcomes for different hypotheses. Estimate information gained per cost rather than counting how many commands are run.

## Procedure

1. List the live hypotheses and the observation that would support or falsify each.
2. Identify the smallest variable, boundary, dependency, input dimension, feature flag or execution mode that distinguishes them.
3. Predict the outcome of each experiment result before running it.
4. Run the experiment with controlled inputs and record command, configuration, environment, output and limitations.
5. Update the hypothesis list; do not reinterpret an unexpected result as confirmation without explanation.
6. Stop generating theories when one causal explanation is adequately supported, or state what evidence remains unavailable.

## Common experiments

- Disable one transformation while preserving the rest of the path.
- Replace one dependency with a controlled value.
- Compare one intermediate result with a trusted reference.
- Shrink one input dimension while preserving the failure.
- Repeat controlled runs to test nondeterminism.
- Compare a feature-enabled path with a supported baseline fallback.

## Boundaries

Do not use destructive experiments or alter production state without permission. An experiment that only repeats the symptom is a reproducer, not necessarily a distinguishing experiment.