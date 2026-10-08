---
name: traceability-gate
description: "Code quality gate: trace markers [T-XXX], Doxygen contracts, implementation integrity (no fake code), 10-iter validation. Auto-triggers on all code changes."
compatibility: opencode
metadata:
  auto_trigger: true
  trigger_keywords: ["write", "edit", "create", "add", "refactor", "implement", "fix", "Doxygen", "trace", "implementation integrity", "contracts"]
  priority: critical
---

# Traceability Gate

**Auto-triggered for ALL code changes.** Enforces traceability, contracts, no-fake-code, and validation in one pass.

---

## Pipeline (Run in Order)

```
WRITE → TRACE MARKERS → DOXYGEN CONTRACTS → NO-FAKE-CODE → 10-ITER-VALIDATE → REPORT
```

Each stage must PASS before next runs. Failure → STOP, fix, re-run from stage 1.

---

## Stage 1: Trace Markers (Lean, Stripped from Binary)

Every non-trivial function gets `[T-XXX]` markers in source (comments stripped from binary only):

```c
/**
 * @brief Parse GGUF header. TRACE: [T-001] entry, [T-002] magic check, [T-003] bounds.
 */
int gguf_parse(gguf_t* ctx, const uint8_t* buf, size_t len) {
    DBG_TRACE("[T-001] enter: len=%zu", len);           // Entry marker
    if (read_u32(buf) != GGUF_MAGIC) { 
        DBG_TRACE("[T-002] FAIL: bad magic"); return -1; 
    }
    uint64_t n = read_u64(buf + 16);
    if (n > MAX_TENSORS) { 
        DBG_TRACE("[T-003] FAIL: n=%llu", (unsigned long long)n); return -2; 
    }
    // ...
    DBG_TRACE("[T-001] exit: ok");                       // Success exit
    return 0;
}
```

**Requirements:**
- [ ] Every non-trivial function has `[T-XXX]` in DBG_TRACE + Doxygen `@brief`
- [ ] DBG_TRACE at entry + **every exit path** (success + each error)
- [ ] DBG_ASSERT on all pre-conditions
- [ ] `-g3` (GCC/Clang) / `/Zi` (MSVC) in build flags
- [ ] `addr2line -e app <addr>` works on sample crash address

**Stripped binary debugging:**
```bash
objcopy --only-keep-debug app app.debug
objcopy --strip-debug app
objcopy --add-gnu-debuglink=app.debug app
```

---

## Stage 2: Doxygen Contracts (Every Function/Struct/Enum/Module)

**Required tags:** `@brief`, `@param[in|out|in,out]`, `@return`, `@pre`, `@post`, `@note`, `@warning`

```c
/**
 * @brief Dequantize Q4_0 block to FP32.
 * @param[in]  src          Quantized block pointer (non-NULL)
 * @param[out] dst          Output FP32 buffer (caller-allocated, >= block_count*32 floats)
 * @param[in]  block_count  Number of 32-element blocks
 * @return 0 on success, -EINVAL if src==NULL or dst==NULL or block_count==0
 * @pre src points to valid block_size bytes; dst has >= block_count*32 floats
 * @post dst contains dequantized values
 * @note Quantization scale stored in block[0]; zero-point in block[1]
 * @warning Do NOT call with overlapping src/dst buffers
 */
int ggml_dequantize_q4_0(const void* src, float* dst, int block_count);
```

**Opaque handle pattern:**
```c
/**
 * @brief Opaque handle for tensor context.
 * @note Created by tensor_init(), destroyed by tensor_free().
 * @warning Do NOT dereference; treat as opaque cookie.
 */
typedef struct tensor tensor_t;
```

**Validation:** `doxygen -u` + custom checker for required tags. Missing `@pre`/`@post` on public API = FAIL.

---

## Stage 3: Code Contracts (Behavior Documentation)

Document what a maintainer **cannot infer** from names and types:

| Contract Element | Required When |
|------------------|---------------|
| **Purpose** | Every public function |
| **Ownership/Lifetime** | Any pointer param or return |
| **Preconditions** | Non-trivial input requirements |
| **Postconditions** | Non-trivial output guarantees |
| **Errors** | Any fallible operation (list all return codes) |
| **Side Effects** | Mutates global state, I/O, allocates, locks |
| **Thread/Async Safety** | Shared state, reentrancy, signal safety |
| **Synchronization** | Locks held/required, memory ordering |
| **Performance Constraints** | O(n), allocation count, syscall count |

**Example:**
```c
/**
 * @brief Parse GGUF header from memory buffer.
 * 
 * Ownership: Caller retains buffer ownership. Returns allocated ctx on success.
 * Lifetime: ctx valid until gguf_free(ctx). Buffer must outlive ctx.
 * 
 * Preconditions:
 *   - buf != NULL
 *   - len >= GGUF_MIN_HEADER_SIZE (24 bytes)
 *   - buf aligned to 8 bytes
 * 
 * Postconditions (on success):
 *   - *ctx != NULL
 *   - ctx->magic == GGUF_MAGIC
 *   - ctx->tensor_count <= MAX_TENSORS
 * 
 * Errors:
 *   - -EINVAL: buf NULL, len too small, misaligned
 *   - -EBADMSG: bad magic, version, or tensor count
 *   - -ENOMEM: allocation failure
 * 
 * Side Effects: Allocates ctx via malloc. No global state.
 * Thread Safety: Not thread-safe. Caller must synchronize.
 * Performance: O(1) header parse, 1 malloc.
 */
int gguf_parse(gguf_t** ctx, const uint8_t* buf, size_t len);
```

---

## Stage 4: No Fake Code Rule (Zero Tolerance)

**FORBIDDEN — automatic FAIL:**
- `TODO`, `FIXME`, `HACK`, `XXX` comments in committed code
- `pass`, `unimplemented!()`, `todo!()`, `assert!(false)`, `panic!()`
- `// write your code here` or similar placeholders
- Stub functions: `void foo() {}`, `int foo() { return 0; }`
- Example/demo modules unless explicitly requested
- `print("Hello World")` or placeholder outputs
- Hardcoded expected outputs to make tests pass
- Mock implementations in production paths

**IF a function cannot be fully implemented:**
1. State this BEFORE coding
2. Ask for clarification or scope reduction
3. Do NOT emit incomplete code

---

## Stage 5: 10-Iteration Validation (Every Change)

| Iter | Check | Tool | Pass Criteria |
|------|-------|------|---------------|
| **1** | Compile | `cmake --build build -Werror` | 0 warnings, 0 errors |
| **2** | Format | `clang-format --dry-run --Werror` | 0 diffs |
| **3** | Unit Tests | `ctest -R <component> --output-on-failure` | 100% pass |
| **4** | Reproduce | Capture repro case before fixing | Repro deterministic |
| **5** | Golden Test | Known input → known output | Bit-exact match |
| **6** | Fuzz Test | Malformed/random → graceful reject | 0 crashes, 0 hangs, 0 sanitizer hits |
| **7** | Sanitizers | `ASan + UBSan` (MSVC: `/fsanitize=address,undefined`) | 0 leaks, 0 UB |
| **8** | Flow Analysis | `debug-core`: truth table + data trace | All branches resolved |
| **9** | Resource Audit | Every alloc→free, handle→close, lock→unlock | 0 leaks, 0 double-free |
| **10** | Performance | Benchmark vs baseline | No >5% regression |

**Log format:**
```
✅ I1: compile clean (0W, 0E)
✅ I2: format clean
✅ I3: test_gguf ✅ (12/12)
✅ I4: repro captured (test/inputs/corrupt.bin)
✅ I5: golden test_gguf_golden ✅
✅ I6: fuzz 10000 iterations ✅
✅ I7: ASan+UBSan clean
✅ I8: truth table: 3 branches, all resolved
✅ I9: resource audit: 3 alloc/3 free, 0 leaks
✅ I10: perf 12.3ms → 12.1ms (-1.6%)
```

**Bypass ONLY if user explicitly says:** "skip validation", "trust me", "I'll validate later", "no tests needed for this".

---

## Stage 6: Rust Safety (When Rust Code Touched)

| Rule | Enforcement |
|------|-------------|
| **Ownership** | Every value has one owner; pass `&T`/`&mut T` unless transfer needed |
| **Lifetimes** | Explicit for structs holding refs; elide where compiler allows |
| **Cloning** | `Clone` only for semantic deep copy; prefer `Copy` for trivial types |
| **Errors** | `Result<T, E>` for all fallible ops; **no `.unwrap()`/.expect()` in prod** |
| **Error Types** | Custom with `thiserror`; map at boundaries |
| **Propagation** | `?` operator; avoid nested `match` for simple forwarding |
| **Public Types** | `#[derive(Debug, Clone, PartialEq)]` |
| **Unsafe** | Only for FFI; document safety invariant in `// SAFETY:` comment |
| **Null** | Prefer `Option<T>`; use `let-else` for early returns |
| **Indexing** | Prefer `.get(i)` over `[i]`; bounds-checked |
| **Testing** | `#[cfg(test)]` module per file; `proptest`/`quickcheck` for parsers/core logic |
| **Build** | `cargo build --release` for perf; `cargo flamegraph` for profiling |
| **Workspace** | `Cargo.toml` at root, crates in `src/`, no dev-deps leak |

---

## Output Report

```
TRACEABILITY GATE: PASSED/FAILED
STAGE: <failed stage> / 6
TRACE: <missing markers>
DOXYGEN: <missing tags>
CONTRACTS: <missing elements>
FAKE_CODE: <violations found>
VALIDATION: I<failed_iter> <reason>
RUST: <violations>
```

---

## Boundaries

- Does not design architecture (receives code to validate)
- Does not write tests for untested code (flags missing tests in I3/I5/I6)
- `stop traceability-gate`: revert to manual review (not recommended).