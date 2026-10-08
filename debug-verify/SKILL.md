---
name: debug-verify
description: "Verification ladder: static→build→targeted→repro→differential→regression→integration. Never claim unrun PASS."
compatibility: opencode
metadata:
  role: debugging
  loading: on-demand
---

# Debug Verify

Verify fixes with **executed evidence only**. Escalate verification depth by risk.

## Verification Ladder

| Level | Check | Tool | When Required |
|-------|-------|------|---------------|
| **1. Static** | Compile, format, lint | `cmake --build -Werror`, `clang-format` | Always |
| **2. Build/Link/Load** | Symbol resolution, dynamic deps | `ldd`, `dumpbin`, `objdump` | Shared libs, plugins, FFI |
| **3. Targeted Test** | Unit test for fixed function | `ctest -R test_<fixed_fn>` | Always |
| **4. Original Reproducer** | Exact failure input | `./repro.bin` | Always |
| **5. Differential/Reference** | Compare to known-good | `diff <(ref) <(patched)` | When reference exists |
| **6. Regression Suite** | Full test suite | `ctest --output-on-failure` | Always |
| **7. Integration/Perf** | End-to-end, benchmarks | Custom scripts | High risk / perf fix |

**Use minimum sufficient levels.** Escalate with risk:
- Low risk (guard, init): Levels 1-4
- Medium risk (logic, boundary): Levels 1-6
- High risk (lifetime, concurrency, ABI): Levels 1-7

## Status Definitions

| Status | Meaning |
|--------|---------|
| **PASS** | Executed and passed |
| **FAIL** | Executed and failed |
| **NOT RUN** | Not executed (explicitly skipped) |
| **UNVALIDATED** | Execution/evidence unavailable |

**Never convert NOT RUN or UNVALIDATED to PASS.**

## Verification Protocol

### Pre-Verification (From debug-fix)
- Confirmed root cause: `CONFIRMED`
- Minimal patch applied
- Targeted test identified: `test_<fixed_fn>`
- Reproducer: `./repro.bin`

### Execution Order

```bash
# Level 1: Static
cmake --build build -Werror && clang-format --dry-run --Werror src/parse.c

# Level 2: Build/Link (if applicable)
ldd build/libparse.so | grep -v "not found"

# Level 3: Targeted Test
ctest -R "test_parse_token" --output-on-failure

# Level 4: Original Reproducer
./repro.bin  # Must produce expected output (exit 0, correct stdout)

# Level 5: Differential (if reference exists)
./ref_run.sh > ref.out && ./patched_run.sh > patched.out && diff -u ref.out patched.out

# Level 6: Regression Suite
ctest --output-on-failure -j$(nproc)

# Level 7: Integration/Perf (high risk only)
./bench_parse --iterations=1000 --compare=baseline.json
./integration_test.sh
```

## Evidence Recording

Log every level:

```
✅ L1: compile clean (0 warnings, 0 errors)
✅ L2: link clean (all symbols resolved)
✅ L3: test_parse_token ✅ (4/4 cases)
✅ L4: repro.bin ✅ (exit=0, output matches expected)
✅ L5: differential ✅ (ref vs patched: identical)
✅ L6: regression ✅ (247/247 passed, 0 failed, 3 skipped)
⚠️  L7: NOT RUN (risk=medium, not required)
```

If ANY level FAILS → **STOP**. Return to debug-fix with updated hypothesis.

## Risk-Based Escalation Matrix

| Fix Class | Risk | Min Levels | Extended If |
|-----------|------|------------|-------------|
| Guard/Init | Low | 1-4 | Flaky reproducer |
| Boundary/Logic | Medium | 1-6 | Complex state, multiple callers |
| Lifetime/Concurrency | High | 1-7 | Always |
| ABI/Contract | High | 1-7 | Always |
| Performance | Medium | 1-6 | >5% change claimed |

## Performance Regression Check

If fix touches hot path:
1. Capture baseline: `./bench --iterations=100 > baseline.json`
2. Apply fix
3. Capture patched: `./bench --iterations=100 > patched.json`
4. Compare: `python compare_bench.py baseline.json patched.json`
5. **Reject if >5% regression** on any metric without documented trade-off.

## Flaky Test Protocol

If targeted test or reproducer is flaky:
1. Run 20×: `for i in {1..20}; do ./repro.bin; done`
2. Record pass/fail rate
3. If <100% pass → **NOT VALIDATED**. Return to debug-deep for instrumentation.
4. Do not "fix flakiness" by weakening test.

## Output Format

```
VERIFICATION: <status>
LEVELS: <passed>/<total> (<list>)
EVIDENCE: <one-line per level>
REGRESSION: <passed>/<total> tests
PERF: <baseline> → <patched> (<delta>%)
BLOCKERS: <any NOT RUN/UNVALIDATED with reason>
```

Example:
```
VERIFICATION: PASSED
LEVELS: 6/6 (L1-L6)
EVIDENCE: L1 compile✅ L2 link✅ L3 targeted✅ L4 repro✅ L5 diff✅ L6 regression✅
REGRESSION: 247/247 passed
PERF: 12.3ms → 12.1ms (-1.6%)
BLOCKERS: none
```

## Knowledge Capture

On PASS → update both KB tiers:
```bash
kb.py add --category debugging \
  --bug "parse_token: ERR_BAD_MAGIC on valid input" \
  --cause "caller skipped init(), passed uninitialized buf" \
  --fix "added buf!=NULL && len>=4 guards at parse.c:42" \
  --pattern "always validate preconditions at API boundary"
```

Append to `.opencode/analysis.md`:
```
## 2026-10-08: parse_token magic validation
- Bug: ERR_BAD_MAGIC on valid file
- Cause: init() not called by caller
- Fix: guards at parse.c:42
- Pattern: validate preconditions at boundary
- Verification: L1-L6 ✅, perf -1.6%
```

## Boundaries

- Does not diagnose or fix (receives patched code)
- Does not skip levels based on "confidence"
- `stop debug-verify`: revert.
- If UNVALIDATED remains → mark explicitly, do not ship.