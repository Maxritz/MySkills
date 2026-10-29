---
name: rust-safety
description: "Rust safety and correctness: ownership, lifetimes, error handling, memory safety, unsafe contracts, FFI boundaries, testing, tooling. Production-grade Rust with zero unsafe leaks."
compatibility: opencode
---

# Rust Safety

**Production-grade Rust: ownership, lifetimes, error handling, memory safety, unsafe contracts, FFI boundaries, testing, tooling. Zero unsafe leaks in production.**

---

## Safety workflow

| Area | Required question |
|---|---|
| Ownership/lifetimes | Who owns each value, how long are borrows valid, and what can be aliased/mutated? |
| Errors | Are failures typed and propagated without silently losing context? |
| Unsafe/FFI | Which invariant makes each unsafe operation sound, and where is the contract checked? |
| Concurrency/async | What happens under cancellation, panic, re-entrancy, races, backpressure and shutdown? |
| ABI | Do layout, calling convention, symbol versions, allocator ownership and panic/error boundaries match? |
| Testing | Which unit, property, fuzz, Miri, sanitizer or integration checks apply to this target? |

Use safe Rust by default. Every unsafe block needs a precise safety invariant; comments do not prove it. Avoid panics/unwraps in recoverable production paths, do not suppress cancellation casually, and test FFI boundaries independently.

Detailed patterns and validation commands: [Rust safety recipes](references/safety-patterns.md).

## Output Report

```
RUST SAFETY: ANALYSIS
CRATE: <name> <version>
OWNERSHIP: explicit lifetimes ✅/❌
ERRORS: custom types + thiserror ✅/❌
UNSAFE: <count> blocks, all documented ✅/❌
MIR: clean ✅/❌
CLIPPY: clean ✅/❌
TESTS: unit✅/❌ integration✅/❌ property✅/❌ fuzz✅/❌
BLOCKERS: <list>
```

---

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- For each unsafe block, document the invariant that makes it sound and test the boundary where that invariant can fail. Verify ownership, FFI layouts, panic/error propagation, async cancellation and backpressure; run Miri/fuzzing only where supported and report gaps.


## Boundaries

- Does not write FFI bindings (see `low-level-toolkit`)
- Does not cover async runtime internals (see `sys-arch`)
- Does not write proc-macros (separate skill)
- `stop rust-safety`: revert.