---
name: debug-fix
description: "Smallest patch for confirmed root cause. One causal hypothesis → one minimal patch → one verification cycle."
compatibility: opencode
metadata:
  role: debugging
  loading: on-demand
---

# Debug Fix

Apply the **smallest change** that addresses the **confirmed root cause**. No speculative patches.

## Rules

1. **Fix the cause, not the symptom.** Root cause must be `CONFIRMED` (fix removes failure under tests).
2. **No unrelated refactoring.** No "while I'm here" changes.
3. **Preserve interfaces.** Behavior outside affected contract unchanged.
4. **Build after smallest viable patch.** No batching speculative changes.
5. **If patch fails → update hypothesis, don't stack patches.**

Pattern: `one causal hypothesis → one minimal patch → one verification cycle`

## Input Contract (from debug-core/debug-deep)

Requires:
- `ROOT CAUSE: <file>:<line> — <one-line cause>`
- `CONFIRMED` status (hypothesis supported by evidence + fix removes failure)
- `PROBE: <line> <expr>` — exact location and assertion to add
- Affected contract: pre/post/invariant that was violated

## Fix Classification

| Class | Description | Example |
|-------|-------------|---------|
| **Guard** | Add missing precondition check | `if (!buf) return ERR_NULL;` |
| **Initialization** | Ensure state established before use | `buf[0] = MAGIC;` in init() |
| **Boundary** | Fix off-by-one, size, alignment | `if (len < 4) return ERR_SMALL;` |
| **Ordering** | Enforce correct call sequence | `assert(initialized);` |
| **Lifetime** | Fix use-after-free, double-free | Move `free()` after last use |
| **Logic** | Correct inverted condition, wrong operator | `if (a > b)` → `if (a < b)` |
| **Contract** | Fix violated postcondition/invariant | Return error instead of corrupting state |

## Minimal Patch Template

```diff
--- a/src/parse.c
+++ b/src/parse.c
@@ -39,6 +39,8 @@ int parse_token(token_t* tok, const uint8_t* buf, size_t len) {
     DBG_TRACE("[T-002] entry: len=%zu", len);
 
+    if (!buf) { DBG_TRACE("[T-002] FAIL: buf=NULL"); return -EINVAL; }
+    if (len < 4) { DBG_TRACE("[T-002] FAIL: len=%zu<4", len); return -EINVAL; }
+
     if (read_u32(buf) != MAGIC) {
         DBG_TRACE("[T-003] FAIL: bad magic 0x%08x", read_u32(buf));
         return -EBADMSG;
```

## Validation Gates (Before Claiming Fix)

| Gate | Command | Must Pass |
|------|---------|-----------|
| **Compile** | `cmake --build build -Werror` | ✅ |
| **Format** | `clang-format --dry-run --Werror` | ✅ |
| **Targeted test** | `ctest -R test_parse_token` | ✅ |
| **Original reproducer** | `./repro.bin` | ✅ |
| **Differential test** | `diff <(./ref) <(./patched)` | ✅ |
| **Sanitizers** | `ASan+UBSan clean` | ✅ |
| **Regression suite** | `ctest --output-on-failure` | ✅ |

**No gate skipped.** If any fails → update hypothesis, not patch.

## Fix Size Limits

- **Single file** unless contract spans boundary
- **≤10 lines changed** (excluding tests/comments)
- **One logical change** (one `if`, one assignment, one return)
- **No new functions** unless extracting shared guard

If fix exceeds limits → root cause not localized → return to debug-deep.

## Anti-Patterns (Reject These)

| Anti-pattern | Why | Correct Approach |
|--------------|-----|------------------|
| `if (ptr) { ... }` without else | Swallows NULL path | Explicit `if (!ptr) return ERR;` |
| `memset(ptr, 0, size)` to "fix" uninit | Masks missing init | Fix the init path |
| Adding retry loop for transient failure | Hides root cause | Fix the transient cause |
| Catching all exceptions | Swallows real errors | Catch specific, rethrow |
| `#ifdef WORKAROUND` | Accumulates tech debt | Fix properly or document TODO |

## Output Format

```
FIX: <class> at <file>:<line>
PATCH: <diff summary>
TESTS: <targeted test names>
VERIFICATION: <repro + regression status>
NEXT: <if any follow-up needed>
```

Example:
```
FIX: Guard at parse.c:42
PATCH: Added buf!=NULL && len>=4 checks before magic read
TESTS: test_parse_token_null, test_parse_token_small, test_parse_token_magic
VERIFICATION: repro.bin ✅ | regression suite ✅ (247/247)
NEXT: none
```

## Handoff

After all gates pass → emit:
```
HANDOFF: debug-verify ready — fix applied, all gates passed.
```

## Boundaries

- Does not diagnose (receives confirmed root cause)
- Does not validate beyond gates above (hands to debug-verify for extended validation)
- Does not write documentation (analysis-log captures fix)
- `stop debug-fix`: revert to diagnosis mode.