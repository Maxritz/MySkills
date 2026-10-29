---
name: debug-hypothesis
description: Form and rank falsifiable debugging hypotheses using evidence and distinguishing experiments.
compatibility: opencode
metadata:
  role: debugging
---

# Debug Hypothesis

Maintain a small set of testable explanations. Do not turn plausibility into certainty or patch code before the causal explanation is sufficiently supported.

## Hypothesis format

For each live hypothesis, record:

- ID and one-sentence causal claim.
- Evidence for and evidence against.
- A distinguishing experiment and predicted result for each plausible outcome.
- Cost, risk, and prerequisites.
- Status: UNKNOWN, SUPPORTED, ELIMINATED, CONFIRMED, or REGRESSION-CONFIRMED.

Use this compact form:

\`H1: <cause> | FOR: <evidence> | AGAINST: <evidence> | TEST: <experiment> | COST: low/medium/high | STATUS: <state>\`

## Workflow

1. Record facts separately from assumptions.
2. Form roughly 2–4 high-value hypotheses ranked by information gained per unit of cost.
3. Pick an experiment that can distinguish hypotheses, not merely reproduce the symptom.
4. Update status from the result. Eliminate contradicted hypotheses immediately.
5. If evidence supports none, revise the model instead of inventing more speculative variants.
6. Confirm a root cause only when evidence establishes the causal chain or the fix removes the failure under relevant tests.

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Keep credible competing explanations tied to supporting and contradicting observations, each with a falsifiable prediction and a distinguishing test. Retire a hypothesis only when a measured or inspected result warrants it.


## Boundaries

This skill generates and manages hypotheses. Use \`debug-mde\` to choose the experiment, \`debug-reproduce\` to capture the failure, \`debug-root-cause\` to establish causality, and \`debug-fix\` only after confirmation. Never fabricate a test result.