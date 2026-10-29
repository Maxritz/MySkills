---
name: implementation-integrity
description: Lightweight entry point for auditing whether implementation, wiring, tests and completion claims are real and traceable.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["implementation integrity", "fake implementation", "completion audit", "missing wiring"]
---

# Implementation Integrity

This is a router, not a second copy of the audit checklist.

- For repository, feature or multi-file completeness audits, load goli-mat-de. Establish scope, track actual coverage, inspect entry points and callers, and record evidence for each finding.
- For a code-change gate, use code-quality-gate.
- For trace markers and source-to-runtime correlation, use traceability-gate or traceability.
- For a single runtime defect, start with debug-core; use debug-verify to establish fix evidence.
- For test architecture, load test-engineering.

## Mandatory questions

1. Which requirement or contract should this code satisfy?
2. Is the complete path wired from entry point through configuration and data/control flow?
3. What happens on invalid input, partial failure, timeout, cancellation and cleanup?
4. Does a test exercise real behaviour, or merely a mock or constant return?
5. What command or observed result justifies the completion claim?

Search terms such as TODO, FIXME, stub and mock are discovery aids only. They are not findings without contextual evidence. Do not claim exhaustive coverage from a sample, do not fabricate tool output, and do not create tasks until the user acknowledges the proposed list and authorises the destination.
