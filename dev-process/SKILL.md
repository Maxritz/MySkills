---
name: dev-process
description: "Arch-first. 10-iteration validation protocol."
license: MIT
compatibility: opencode
metadata:
  auto_trigger: true
  priority: critical
---

# Development Process

## Before Writing Code

1. **Architecture first.** Component diagram with: data flow, interfaces, ownership, error paths, cleanup. No code until this covers inputs, outputs, edge cases, resource lifecycle.
2. **Plan vetting.** Every task cross-checked against the architecture. No orphaned modules. Plans version-controlled, updated via diff.
3. **Task breakdown.** ≤30-line units. Each: 1 purpose, 1 test, 1 file/function change.

Task format: `[component]: [action] → [expected invariant]`

## 10-Iteration Validation

Never skip. Every change passes:

| Iter | Check | Tool |
|------|-------|------|
| 1 | Compile | `cmake --build -Werror` |
| 2 | Format | `clang-format` |
| 3 | Unit test | `ctest` / `pytest` |
| 4 | Reproduce | Capture repro case before fixing |
| 5 | Golden test | Known input → known output |
| 6 | Fuzz test | Malformed/random → graceful reject |
| 7 | Sanitizer | ASan + UBSan clean |
| 8 | Flow analysis | debug-core: truth table + data trace |
| 9 | Resource audit | Every alloc→free, handle→close |
| 10 | Performance | No >5% regression vs baseline |

Log: `✅ I1: compile clean` or `❌ I3: test_gguf failed (offset mismatch)`

## Failure Protocol

1. Generate truth table (debug-tracing).
2. Generate data model trace.
3. Inject to `ponytail`: "Trace: [truth table]. Fix minimally."
4. Re-run all 10 iterations. No advancement until ✅.

## Plan Adherence

No deviation from vetted plan. If approach changes → update plan first via diff. Rationale recorded for every change. "I'll fix it later" is forbidden.
