---
name: c-systems
description: "Unified C/C++ systems: portable C99, C++ RAII/templates, ownership, ABI, concurrency, allocators, performance. Write, port, review, debug production systems code."
compatibility: opencode
---
# C/C++ Systems

Choose the C99, C++ or interop path that matches the changed boundary. Record language standard, compiler/flags, OS/architecture, ABI and dependencies.

## Core rules

- **Ownership:** name the owner, lifetime, valid range and release operation for every resource-bearing pointer/handle. Define borrowed versus transferred ownership.
- **Errors:** every fallible API has a documented result contract; propagate failures and clean up partially acquired resources. Never silently return success.
- **Memory/arithmetic:** validate pointer-length pairs, bounds, alignment, overflow, aliasing, object lifetime and allocation size before access.
- **C++ resources:** use RAII, clear move/copy semantics and exception-safe state transitions. Do not let exceptions cross a C ABI.
- **ABI/FFI:** use a stable C-facing interface where needed, opaque handles and fixed-width types; pin calling convention, layout, symbol visibility and allocator ownership.
- **Concurrency:** state thread-safety/reentrancy guarantees; define lock order and memory ordering.
- **Performance:** measure allocation, copying, cache, vectorisation and lock costs only after correctness.

## Workflow

1. Write contracts for changed public/non-trivial interfaces.
2. Implement the smallest coherent change, including error and cleanup paths.
3. Run strict build/static checks and focused contract tests; use sanitizers for relevant native-memory/concurrency risks.
4. For FFI/porting, validate both sides of the boundary and compare with a trusted reference.
5. Benchmark only performance-sensitive changes against the same workload and report variance.

Detailed C99, C++, interop and porting patterns: [recipes](references/c-systems-recipes.md).

## Report

Return contract, changed boundary, build/test commands with actual results, ABI/platform coverage and untested paths. Do not imply that code compiled or tools ran without evidence.

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

## Boundaries

Use `architecture-boundaries` for component decomposition and `rust-safety` for Rust-specific rules.
