# Code Quality Gate: Detailed Recipes

Load this reference when writing or reviewing detailed API contracts, trace markers, Rust rules or component-boundary examples. The core skill retains the decision process and verification gates.

## Stage 1: Doxygen Contracts (Public APIs and non-trivial interfaces)

**Document what callers cannot infer:** `@brief` for public or non-trivial interfaces; `@param` for meaningful parameter contracts; `@return` for non-void or fallible results; `@pre`/`@post` when they express non-trivial conditions; `@note`/`@warning` only when relevant. Do not add empty boilerplate tags.

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

**Validation:** use Doxygen and project-specific checks where available. Flag missing contract information that affects correctness or callers; do not fail a public API only because an irrelevant tag is absent.

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

**Red flags: inspect the live path and contract before classifying:**
- TODO/FIXME/HACK/XXX markers that coincide with required, in-scope behaviour not implemented
- `pass`, `unimplemented!()`, `todo!()`, unconditional panic/assertion or placeholder comments on reachable production paths where they violate the declared contract
- Empty or constant-return bodies where meaningful behaviour is promised
- Canned outputs, fake progress/metrics, mock leakage or hard-coded test answers in production paths
- Tests weakened, disabled or skipped to conceal a failure

A marker or pattern alone is not proof. Expected test fixtures, examples, deliberate no-ops, explicit unsupported-operation errors and invariant assertions can be valid. Confirm reachability and contract before declaring a defect.

**If requirements cannot be fully satisfied:** state the limitation before presenting the result. Ask only when missing information blocks a safe/correct decision; otherwise implement a coherent bounded scope, label omissions and do not present a stub as finished.

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

Add stable `[T-XXX]` markers at diagnostic boundaries where they answer a concrete question. Do not instrument every function by default; marker density and overhead must be justified:

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
- [ ] Important entry, state transition and failure boundaries are traceable where needed
- [ ] Material error exits have useful context without exposing secrets
- [ ] Input preconditions are checked at the boundary; use recoverable errors for untrusted/runtime input rather than assertions that abort production
- [ ] Debug symbols are available in the diagnostic build for the target toolchain; do not force debug symbols into release artefacts without policy approval
- [ ] Validate source mapping with the platform's matching tooling, such as `addr2line` for ELF or PDB-aware tools on Windows

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
| **Public Types** | Implement `Debug`, `Clone` or equality traits only when semantically appropriate and needed |
| **Unsafe** | Only for FFI; document safety invariant in `// SAFETY:` comment |
| **Null** | Prefer `Option<T>`; use `let-else` for early returns |
| **Indexing** | Prefer `.get(i)` over `[i]`; bounds-checked |
| **Testing** | `#[cfg(test)]` module per file; `proptest`/`quickcheck` for parsers/core logic |
| **Build** | `cargo build --release` for perf; `cargo flamegraph` for profiling |
| **Workspace** | Follow the repository's declared workspace layout; keep development-only dependencies out of runtime builds |

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

**Boundary violations (when they contradict the declared architecture):**
- Transport-specific types leak into domain interfaces
- Domain rules depend directly on infrastructure or mutable process-wide configuration
- Background jobs couple themselves to transport frameworks without a justified reason
- Handlers bypass required authorisation, transaction or validation boundaries

---
