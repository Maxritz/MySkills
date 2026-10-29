---
name: code-quality-gate
description: "Unified code quality gate: behavioural contracts, no-fake-code, risk-sized verification, traceability, Rust safety and component boundaries. Auto-triggers on implementation changes."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: true
  trigger_keywords: ["write", "edit", "create", "add", "refactor", "implement", "fix"]
  priority: critical
---

# Code Quality Gate

**Auto-triggered for ALL code changes.** Enforces contracts, validation, traceability, and no-fake-code in one pass.

## Pipeline (Run in Order)

```
WRITE → CONTRACTS → NO-FAKE-CODE → RISK-SIZED VALIDATION → TRACEABILITY → COMPONENT-BOUNDARIES → REPORT
```

Every applicable stage must PASS before completion. If a stage fails, fix it and repeat relevant upstream checks. Mark NOT APPLICABLE only with a reason; never recast an unrun or blocked check as PASS.

---

## Stage 1: Doxygen Contracts (Public APIs and non-trivial interfaces)

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
 * @note Verify the exact Q4_0 block layout and signed-nibble decoding against the pinned GGML revision; layouts differ by quantisation type
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

## Stage 2: Code Contracts (Behavior Documentation)

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

## Stage 3: No Fake Code Rule (Zero Tolerance)

**FORBIDDEN — automatic FAIL:**
- `TODO`, `FIXME`, `HACK`, `XXX` markers that identify in-scope behaviour as missing or incomplete; harmless future-work notes should be triaged rather than treated as proof of a broken feature
- `pass`, `unimplemented!()`, `todo!()`, `assert!(false)`, `panic!()`
- `// write your code here` or similar placeholders
- Empty or constant-return bodies when the declared contract promises meaningful work and no intentional no-op or constant-return contract justifies the body
- Example/demo modules unless explicitly requested
- `print("Hello World")` or placeholder outputs
- Hardcoded expected outputs to make tests pass
- Mock implementations in production paths

**IF a function cannot be fully implemented:**
1. State this BEFORE coding
2. Ask for clarification or scope reduction
3. Do NOT emit incomplete code

---

## Stage 4: Risk-sized validation (repeat until stable)

The ten checks below form a validation catalogue. Do not force an irrelevant build, fuzz run or benchmark onto a documentation-only or unrelated edit. For every code change, inspect the diff and run the cheapest applicable checks; increase depth for changes to binary parsing, memory safety, concurrency, numerical code, kernels, public ABI, security boundaries or critical paths. Mark each check PASS, FAIL, BLOCKED, NOT RUN or NOT APPLICABLE with a reason. Repeat failed checks after the patch, and re-run linked regression gates when the change alters shared contracts.

| Gate | Tool/example | Pass criteria | When required |
|---|---|---|---|
| 1. Static/build | Project build, strict warnings, formatter | Applicable build/lint checks pass | Buildable code change |
| 2. Unit/contract | Project test runner | Assertions exercise the changed behaviour | Behaviour or contract change |
| 3. Reproducer | Exact failing invocation | Original failure is reproduced before fix where possible, then no longer occurs | Bug fix, regression or incident |
| 4. Golden/reference | Pinned oracle or known vectors | Results match exact expected contract/tolerance | Parsers, formats, numerical paths, conversions |
| 5. Fuzz/property | Bounded fuzz/property run | No crash, hang or invariant violation in tested corpus | Untrusted parsers, complex state or broad input domains |
| 6. Sanitizers | ASan/UBSan/TSan or platform equivalent | No relevant reported violation | Native memory/concurrency paths where supported |
| 7. Flow/branch | Call/data-flow, state model or truth table | Material paths and error branches accounted for | Multi-branch, async or stateful change |
| 8. Resource/lifecycle | Allocation/handle/lock/cancellation audit | Ownership and cleanup hold across success/failure | Resource, async, OS or GPU changes |
| 9. Integration | Target runtime/platform/hardware | Real wiring and completion path exercised | Cross-layer or platform-dependent change |
| 10. Performance | Repeated workload benchmark with baseline | No unexplained material regression; correctness retained | Performance-sensitive change |

A compile is not an end-to-end pass. A skipped test is not evidence. The user can narrow requested scope, but the report must retain all unrun checks and residual risks.

## Stage 5: Traceability Markers (Lean)

Every non-trivial function gets `[T-XXX]` markers in source (stripped from binary only):

```c
int gguf_parse(gguf_t** ctx, const uint8_t* buf, size_t len) {
    DBG_TRACE("[T-001] enter: len=%zu", len);           // Entry
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

## Stage 7: Component Boundaries (Backend Demarcation)

Keep layers **visibly separate**:

```
TRANSPORT (HTTP/gRPC) 
  → APPLICATION (orchestration, validation, auth, transactions)
  → DOMAIN (pure business rules, no I/O)
  → PERSISTENCE (DB, cache, repos)
  → INFRASTRUCTURE (cloud SDK, filesystem, clock)
  → WORKERS/JOBS (background, external integrations)
  → CONFIG (process-global, feature flags)
```

**Rules:**
1. Trace request from transport to response; mark every boundary
2. Domain logic independent of HTTP, DB, cloud SDK, process-global config
3. DTO/schema translation at edges; ownership, retries, idempotency, timeouts, errors explicit
4. Background jobs & external integrations behind interfaces; fake/test adapters **only in test code**
5. Test each layer + one E2E path; verify startup, migration, shutdown, failure recovery

**Anti-patterns (FAIL):**
- HTTP handler calls SQL directly
- Domain struct has `http.ResponseWriter` field
- Global `config` variable used in domain logic
- Worker imports web framework

---

## Output Report

```
QUALITY GATE: PASSED/FAILED
STAGE: <failed stage> / 7
DOXYGEN: <missing tags>
CONTRACTS: <missing elements>
FAKE_CODE: <violations found>
VALIDATION: I<failed_iter> <reason>
TRACEABILITY: <missing markers>
RUST: <violations>
BOUNDARIES: <cross-layer violations>
```

## Goli-mat-de integrity gate

Apply Goli-mat-de's evidence rule: tie claims to the actual execution path and observed checks; report unrun or blocked work honestly.

- Choose verification by change risk and touched contract. Treat the ten checks as a reusable validation catalogue, not ten mandatory executions for every trivial edit; every N/A needs a reason and every unrun check stays UNVALIDATED.


## Boundaries

- Does not design architecture (receives code to validate)
- Does not write tests for untested code (flags missing tests in I3/I5/I6)
- `stop code-quality-gate`: revert to manual review (not recommended).