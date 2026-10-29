---
name: debug-reproduce
description: Capture a reliable, minimal reproduction of an observed failure with expected and actual behaviour.
compatibility: opencode
metadata:
  role: debugging
---

# Debug Reproduce

Establish exactly what fails and under which conditions before claiming a root cause or applying a fix.

## Procedure

1. Capture the exact invocation, input or fixture, expected result and actual result.
2. Record only environment facts that could affect the failure: source revision, OS, runtime/compiler, build options, relevant hardware, dependencies and configuration.
3. Repeat the case to determine whether it is deterministic, intermittent or not currently reproducible.
4. Preserve logs, exit codes, relevant state and failure signatures, while removing secrets and unrelated personal data.
5. Reduce the input when practical using \`debug-reduce\`.
6. Confirm that the saved reproduction still triggers the same symptom from a clean invocation.
7. If reproduction is impossible, use targeted instrumentation, stress or state capture and mark the cause UNVALIDATED.

## Reproducer record

\`REPRO: <command> | INPUT: <fixture/version> | EXPECTED: <contract> | ACTUAL: <observation> | RATE: <passes/fails> | ENV: <relevant details>\`

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Record exact revision, command, input, environment, expected/actual result, seed and failure frequency. Redact secrets and private paths. A plausible narrative without an observed reproducer stays unconfirmed.


## Boundaries

Do not invent expected behaviour, logs or a root cause. Avoid sharing secrets in reproducer files. A reproducible symptom is not yet a confirmed causal explanation.