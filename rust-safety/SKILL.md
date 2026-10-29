---
name: rust-safety
description: "Rust safety and correctness: ownership, lifetimes, error handling, memory safety, unsafe contracts, FFI boundaries, testing, tooling. Production-grade Rust with zero unsafe leaks."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  trigger_keywords: ["Rust", "ownership", "lifetimes", "unsafe", "FFI", "thiserror", "proptest", "cargo", "borrow checker", "pin", "async"]
---

# Rust Safety

**Production-grade Rust: ownership, lifetimes, error handling, memory safety, unsafe contracts, FFI boundaries, testing, tooling. Zero unsafe leaks in production.**

---

## Ownership & Lifetimes

### Core Rules
- Every value has one owner; pass references (`&T`, `&mut T`) unless ownership transfer is needed.
- Lifetimes must be explicit for structs holding references; elide where the compiler allows.
- `Clone` only when deep copy is semantically required; prefer `Copy` for trivial types.
- Use `Arc`/`Rc` for shared ownership; `Arc` for thread-safe, `Rc` for single-threaded.
- `Weak` for breaking cycles; upgrade with `.upgrade()` returning `Option`.

### Lifetime Patterns
```rust
// Function with explicit lifetime
fn parse<'a>(input: &'a str) -> Result<Parsed<'a>, Error> { ... }

// Struct with lifetime
struct Config<'a> {
    path: &'a str,
    default: &'a str,
}

// Elided lifetime (allowed)
fn first_word(s: &str) -> &str { ... }
```

### Interior Mutability
- `RefCell` for single-threaded; `Mutex`/`RwLock` for multi-threaded.
- `Cell` for `Copy` types; `OnceCell`/`OnceLock` for lazy init.
- Never mix `RefCell` with async; use `Mutex` in async contexts.

---

## Error Handling

### Core Rules
- `Result<T, E>` for all fallible operations. **No `.unwrap()` or `.expect()` in production code.**
- Define custom error types with `thiserror`; map errors at boundaries.
- `?` operator for propagation; avoid nested `match` chains for simple forwarding.
- Use `anyhow` for application-level errors; custom types for library errors.

### Error Type Pattern
```rust
#[derive(Debug, thiserror::Error)]
pub enum ParseError {
    #[error("invalid token at position {pos}")]
    InvalidToken { pos: usize },
    #[error("unexpected EOF")]
    UnexpectedEof,
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

// Usage
fn parse(input: &str) -> Result<Ast, ParseError> { ... }
```

### Error Boundaries
- Convert external errors at crate boundaries.
- Use `#[from]` for automatic conversion.
- Never expose internal error variants in public API.
- Log with context: `tracing::error!(?error, "operation failed");`

---

## Memory & Safety

### Core Rules
- `#[derive(Debug, Clone, PartialEq)]` on public types.
- **No `unsafe` blocks unless interfacing with FFI**; document the safety invariant.
- Prefer `Option<T>` over null pointers; use `let-else` for early returns.
- Slice indexing must be bounds-checked; prefer `.get(i)` over `[i]`.

### Pin & Async
- `Pin<&mut T>` for self-referential structs; `Box::pin` for heap allocation.
- `Future` implementations must be `Unpin` or properly pinned.
- Never move a pinned value; use `Pin::as_mut` for projection.

### Zero-Cost Abstractions
- Use `const fn` for compile-time computation.
- `const` generics for array sizes.
- `impl Trait` in return position for abstraction without boxing.

---

## Unsafe Contracts (When Absolutely Required)

### FFI Boundaries
```rust
// Safe wrapper over unsafe FFI
extern "C" {
    fn lib_compute(input: *const f32, len: usize, output: *mut f32) -> i32;
}

pub fn compute(input: &[f32]) -> Result<Vec<f32>, Error> {
    let mut output = vec![0.0; input.len()];
    // SAFETY: lib_compute reads exactly input.len() and writes exactly output.len()
    // Both slices are valid, non-overlapping, and live for the call duration.
    let ret = unsafe { lib_compute(input.as_ptr(), input.len(), output.as_mut_ptr()) };
    if ret != 0 { return Err(Error::Ffi(ret)); }
    Ok(output)
}
```

### Safety Documentation Template
```rust
/// # Safety
/// 
/// - `ptr` must be valid for `len` elements and properly aligned.
/// - `ptr` must not be null.
/// - The caller must ensure no other thread accesses this memory during the call.
/// - The memory must not be freed until the operation completes.
unsafe fn raw_operation(ptr: *mut u8, len: usize) { ... }
```

### Miri Validation
```bash
# Run tests under Miri for UB detection
cargo +nightly miri test

# With strict provenance
cargo +nightly miri test -- -Zmiri-strict-provenance
```

---

## Build & Tooling

### Cargo Workspace
```toml
# Cargo.toml (workspace root)
[workspace]
members = ["crates/*"]
resolver = "2"

[workspace.dependencies]
anyhow = "1.0"
thiserror = "1.0"
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }
tracing = "0.1"
tracing-subscriber = "0.3"
```

### Linting & Formatting
```toml
# rustfmt.toml
max_width = 100
hard_tabs = false
tab_spaces = 4
wrap_comments = true
```

```bash
# CI checks
cargo fmt --check
cargo clippy -- -D warnings -D clippy::all -D clippy::pedantic -D clippy::nursery -D clippy::cargo
cargo check --all-targets
```

### Profiling
```bash
# Flamegraph
cargo install flamegraph
cargo flamegraph --bin myapp

# Perf integration
perf record -g ./target/release/myapp
perf report
```

---

## Testing

### Unit Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    #[test]
    fn parse_valid_input() {
        assert_eq!(parse("42"), Ok(Value::Int(42)));
    }

    proptest! {
        #[test]
        fn parse_roundtrip(s in "\\PC*") {
            let parsed = parse(&s);
            // Property: parse never panics
            let _ = parsed;
        }
    }
}
```

### Integration Tests
```rust
// tests/integration.rs
use my_crate::*;

#[tokio::test]
async fn full_pipeline() {
    let result = process("input.txt").await;
    assert!(result.is_ok());
}
```

### Property-Based Testing
```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn serialize_deserialize_roundtrip(data in any::<MyStruct>()) {
        let bytes = serialize(&data).unwrap();
        let decoded = deserialize(&bytes).unwrap();
        prop_assert_eq!(data, decoded);
    }
}
```

### Fuzzing
```bash
cargo install cargo-fuzz
cargo fuzz add parse_fuzz
cargo fuzz run parse_fuzz
```

### CI Pipeline
```yaml
# .github/workflows/rust.yml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt
      - run: cargo fmt --check
      - run: cargo clippy -- -D warnings
      - run: cargo test --all-targets
      - run: cargo +nightly miri test
```

---

## Async Safety

### Cancellation
- Use `tokio::select!` with cancellation tokens.
- Implement `Drop` for cleanup; never rely on `async drop`.
- `tokio::spawn` tasks must handle cancellation gracefully.

### Backpressure
```rust
use tokio::sync::Semaphore;

let semaphore = Arc::new(Semaphore::new(MAX_CONCURRENT));

async fn process(item: Item) {
    let _permit = semaphore.acquire().await?;
    // Process with bounded concurrency
}
```

---

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

## Boundaries

- Does not write FFI bindings (see `low-level-toolkit`)
- Does not cover async runtime internals (see `sys-arch`)
- Does not write proc-macros (separate skill)
- `stop rust-safety`: revert.