---
name: traceability-gate
description: "Routes traceability and implementation-quality requests to the authoritative tracing and quality skills."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: false
  trigger_keywords: ["traceability gate", "Doxygen contract check", "implementation integrity gate", "trace marker audit"]
---

# Traceability Gate

This is a router, not a duplicated second quality gate.

- For stable runtime/source markers and path observability, use traceability.
- For ordinary code-change review, use code-quality-gate.
- For suspicious stubs, incomplete wiring, unverified claims or a whole-repository audit, use goli-mat-de.
- For a specific fix, use debug-core then debug-verify.
- For cross-module dependencies and ownership, use architecture-boundaries.

## Traceability completion criteria

1. The entry point and relevant exit/error/cleanup paths have stable identities.
2. Instrumentation distinguishes the live hypothesis without changing hot-path semantics or leaking secrets.
3. Source/symbol mapping is verified for the actual build and binary, including stripped-binary handling where relevant.
4. Markers correlate the source, runtime observation, test and finding without being decorative or duplicated.
5. The trace records what was observed, not what the reviewer expected to observe.

Do not add a marker to every function mechanically. Select the minimum points that distinguish the hypotheses, and remove or disable noisy instrumentation after the investigation when it is not part of the product. A trace is evidence of observed execution, not by itself proof of correctness.

## Output

Record the symbol/path traced, instrumentation, build and runtime revision, observed branches/errors, tests run and any coverage gaps. Do not claim a trace was executed unless it was.
