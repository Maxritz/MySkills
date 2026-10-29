---
name: traceability-gate
description: "On-demand gate for trace markers, code contracts and implementation-integrity verification."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: false
  trigger_keywords: ["traceability gate", "Doxygen contract check", "implementation integrity gate"]
  priority: critical
---
# Traceability Gate

Use this focused gate when trace markers, source mapping or behavioural contracts are in scope. For ordinary implementation edits, `code-quality-gate` owns the overall quality pipeline; do not run two duplicate full gates.

## Procedure

1. Identify public APIs and non-trivial paths whose behaviour must be traceable.
2. Document preconditions, postconditions, ownership/lifetime, errors and side effects that callers cannot infer from types and names.
3. Trace entry, dispatch, state/resource changes, success and error exits. Add stable markers only where they answer a concrete diagnostic question.
4. Check marker IDs, source mapping, build flags and release behaviour. Confirm whether tracing is compiled out, disabled or retained by design; do not assume.
5. Ensure instrumentation does not disclose secrets, add unbounded I/O or change concurrency/timing enough to hide the defect.
6. Run focused tests and inspect the resulting trace or binary/disassembly when the claim depends on it. If execution is unavailable, report the required verification as NOT RUN.

## Output

Report scope/revision, missing contracts or trace paths, exact evidence, impact, minimal remediation and validation status. Separate source inspection from executed tracing.

## Boundaries

- This skill does not replace `code-quality-gate`, `goli-mat-de` or domain-specific testing.
- Do not add markers to every line by default; optimise for diagnostic value and low overhead.

