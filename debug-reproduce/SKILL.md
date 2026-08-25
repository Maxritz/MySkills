---
name: debug-reproduce
description: "Establish minimal reproducible failure."
compatibility: opencode
metadata:
  role: debugging
  loading: on-demand
---

## Procedure
1. Capture exact input/invocation and expected vs actual result.
2. Repeat to determine deterministic vs intermittent behavior.
3. Capture only environment/configuration that can affect the result.
4. Reduce the input while preserving failure when practical.
5. Preserve the smallest reliable reproducer.

If reproduction is impossible, do not invent a root cause. Use instrumentation, repetition, stress, or state capture and mark the result UNVALIDATED.
