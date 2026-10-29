---
name: code-quality-gate
description: "Lightweight automatic gate for implementation contracts, fake-code detection, focused verification, traceability and safe handoff."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: true
  trigger_keywords: ["write", "edit", "create", "add", "refactor", "implement", "fix"]
  priority: critical
---

# Code Quality Gate

Run this lightweight gate on code changes. Scale checks to risk and scope; do not require ten iterations, blanket comments on every local function, or expensive full-suite testing for every trivial edit.

## 1. State the contract

Identify the in-scope behaviour, public interfaces, invariants, error semantics and compatibility promises. For a small change, one sentence is sufficient. For cross-module or safety-critical work, use architecture-boundaries or Goli-mat-de.

## 2. Inspect the real path

Trace the modified entry point through configuration, callers, implementation, failure/cleanup paths and observable output. Check for placeholders, hidden stubs, unwired flags, success-shaped fallback, swallowed errors and tests that never exercise the real path. Search markers are leads, not proof of defects.

## 3. Make the smallest complete change

Preserve unrelated behaviour. Document public API contracts, ownership/lifetime and non-obvious invariants where they help maintenance. Do not require Doxygen on every trivial local function or duplicate comments that merely restate the code. Keep implementation, tests, registration, build wiring and user-facing documentation in sync.

## 4. Verify proportionally

1. Run the narrowest decisive build/test first.
2. Run relevant regression and integration tests.
3. Add boundary/negative tests for new error paths. Use sanitizers, fuzzing or concurrency tests when the risk warrants them and the environment supports them.
4. Inspect the final diff and rerun checks affected by any follow-up edits.
5. Repeat trials only where flakiness, concurrency or statistical variance is material. A fixed ten-pass rule is not evidence.

If a check cannot run, label it BLOCKED or NOT RUN with the reason. Never invent output, claim unexecuted tests passed, or hide failed exit codes.

## 5. Route deeper review

- Repository or feature completeness, TODO/stub audit: goli-mat-de.
- Source/runtime markers and execution-path tracing: traceability.
- Test strategy, fuzz/property/differential testing: test-engineering.
- Cross-module ownership or dependency direction: architecture-boundaries.
- Rust unsafe/FFI invariants: rust-safety.
- A confirmed runtime defect: debug-core, followed by debug-verify.

Load references/implementation-checklist.md only for higher-risk, multi-module or release-gate reviews.

## Output

Report changed scope, contract, tests/commands actually run, results, known limitations and remaining risks. Do not create issues or tasks from findings until the user acknowledges the proposed list and authorises the destination.

## Optional references

- [quality-recipes.md](references/quality-recipes.md)
