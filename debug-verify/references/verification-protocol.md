# Debug Verify: Detailed Verification Protocol

Use the levels justified by risk; record exact commands and real results. The checks below are a selection catalogue, not evidence that they have run.

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
