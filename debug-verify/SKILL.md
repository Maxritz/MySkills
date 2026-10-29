---
name: debug-verify
description: "Verification ladder: static→build→targeted→repro→differential→regression→integration. Never claim unrun PASS."
compatibility: opencode
metadata:
  auto_unload: true
  auto_trigger: false
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

## Detailed protocol (on demand)

Use [verification protocol](references/verification-protocol.md) for evidence records, escalation, benchmark regression and flaky-test diagnosis. Keep the verification ladder and status definitions in the core; never mark an unrun or blocked test PASS.

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
## Evidence hygiene

Do not preserve one dated debug case as evergreen policy. Store reusable patterns separately from case-specific facts, include the revision and reproduction conditions, and revalidate any saved example before reuse.

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Verify the exact changed revision and the original failure predicate. Report commands and results separately; distinguish PASS, FAIL, BLOCKED, NOT RUN and NOT APPLICABLE, and repeat the smallest affected regression set after each subsequent edit.


## Boundaries

- Does not diagnose or fix (receives patched code)
- Does not skip levels based on "confidence"
- `stop debug-verify`: revert.
- If UNVALIDATED remains → mark explicitly, do not ship.