---
name: rust-safety
description: "Rust: ownership, lifetimes, no unsafe."
license: MIT
compatibility: opencode
---

# Rust Safety

## Ownership & Lifetimes

- Every value has one owner; pass references (`&T`, `&mut T`) unless ownership transfer is needed.
- Lifetimes must be explicit for structs holding references; elide where the compiler allows.
- `Clone` only when deep copy is semantically required; prefer `Copy` for trivial types.

## Error Handling

- Use `Result<T, E>` for all fallible operations. No `.unwrap()` or `.expect()` in production code.
- Define custom error types with `thiserror`; map errors at boundaries.
- `?` operator for propagation; avoid nested `match` chains for simple forwarding.

## Memory & Safety

- `#[derive(Debug, Clone, PartialEq)]` on public types.
- No `unsafe` blocks unless interfacing with FFI; document the safety invariant.
- Prefer `Option<T>` over null pointers; use `let-else` for early returns.
- Slice indexing must be bounds-checked; prefer `.get(i)` over `[i]`.

## Build & Tooling

- Use `cargo build --release` for performance; profile with `cargo flamegraph`.
- Workspace structure: `Cargo.toml` at root, crates in `src/`.
- No dev-dependencies leak into production builds.

## Testing

- `#[cfg(test)]` module in every file; `#[test]` for unit tests.
- `proptest` or `quickcheck` for property-based tests on parsers and core logic.
