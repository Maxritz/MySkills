---
name: porting-change-isolation
description: Isolate platform-specific changes during cross-porting, backend replacement, compiler migration, or OS/ISA/GPU/API changes.
---

# Porting change isolation

Make platform deltas explicit, small, and reversible.

1. Identify the stable behavior contract and the exact source/target capability difference.
2. Add a narrow adapter, capability probe, or compile-time trait instead of spreading conditionals through portable logic.
3. Keep fallback behavior explicit, observable, and semantically equivalent where possible.
4. Land one boundary change at a time and use contract/differential tests before cleanup or optimization.
5. Remove temporary compatibility code only after the target matrix proves it is safe.

Read `_systems-ml-shared/porting-checklist.md`; add `cross-compilation` and `toolchains` when build artifacts or ABI change.
