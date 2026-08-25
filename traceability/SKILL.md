---
name: traceability
description: "Flow markers [T-XXX]. addr2line. -g3 debug."
license: MIT
compatibility: opencode
metadata:
  auto_trigger: true
---

# Traceability (Lean)

## Trace Markers

Every function gets `[T-XXX]` markers. Comments stay in source; stripped from binary only.

```c
/**
 * @brief Parse GGUF header. TRACE: [T-001] entry, [T-002] magic check, [T-003] bounds.
 */
int gguf_parse(gguf_t* ctx, const uint8_t* buf, size_t len) {
    DBG_TRACE("[T-001] enter: len=%zu", len);
    if (read_u32(buf) != GGUF_MAGIC) { DBG_TRACE("[T-002] FAIL: bad magic"); return -1; }
    uint64_t n = read_u64(buf + 16);
    if (n > MAX_TENSORS) { DBG_TRACE("[T-003] FAIL: n=%llu", (unsigned long long)n); return -2; }
    ...
    DBG_TRACE("[T-001] exit: ok");
    return 0;
}
```

## Reversibility
@see c99-standards for opaque handles / checked arithmetic.

Binary to source mapping must survive stripping:
- `-g3` (GCC/Clang) / `/Zi` (MSVC) — debug info + line tables.
- `addr2line -e app addr` — crash address -> file:line.
- Stripped: `objcopy --only-keep-debug` + `--add-gnu-debuglink`.


## Validation

- [ ] Every non-trivial function has `[T-XXX]` in DBG_TRACE + Doxygen `@brief`.
- [ ] DBG_TRACE at entry + every exit path.
- [ ] DBG_ASSERT on all pre-conditions.
- [ ] `-g` in build flags; `addr2line` works on sample address.
