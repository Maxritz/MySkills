---
name: debug-core
description: "Debug orchestrator: 12-step loop, truth tables, auto-unload, knowledge capture. Default entry for all debugging."
compatibility: opencode
metadata:
  role: debugging
  loading: on-demand
  auto_trigger: true
  priority: critical
---

# Debug Core

Route debugging through the cheapest evidence path. Stay domain-neutral until evidence requires specialization.

## Default Loop (12 Steps)

| Step | Action | Evidence Type | Exit Condition |
|------|--------|---------------|----------------|
| 1 | **Reproduce** | FACT | Deterministic reproducer captured |
| 2 | **Record facts** | FACT | All observed: input, output, env, config |
| 3 | **Classify** | FACT | Type: crash/hang/wrong-output/perf/regression |
| 4 | **Localize deviation** | FACT | Boundary: INPUT→STATE→TRANSFORM→OUTPUT |
| 5 | **Identify contract** | FACT | Pre/post/invariant that was violated |
| 6 | **Form 2-4 hypotheses** | HYPOTHESIS | Ranked by info-gain/cost |
| 7 | **Choose MDE** | HYPOTHESIS | Cheapest experiment to falsify most |
| 8 | **Run + eliminate** | RESULT | ≥1 hypothesis eliminated or supported |
| 9 | **Confirm root cause** | CONCLUSION | Causal chain: failure→bad-state→op→expectation→defect |
| 10 | **Apply smallest fix** | RESULT | One causal hypothesis → one minimal patch |
| 11 | **Rebuild/retest** | VALIDATION | Original reproducer passes |
| 12 | **Validate + capture** | VALIDATION | Regression suite passes; KB updated |

**After VALIDATION (step 12):** document to both KB tiers:
```
kb.py add --category <domain> --bug ... --cause ... --fix ... --pattern ...
```
@see knowledge-base for two-tier protocol. Append analysis to `.opencode/analysis.md`. @see analysis-log.

Evidence tags: `FACT=observed`, `HYPOTHESIS=unproven`, `RESULT=outcome`, `CONCLUSION=supported cause`, `VALIDATION=tests passed`.

## Instrumentation (Required)

Every function MUST use trace markers:
```c
#define DBG_TRACE(fmt, ...) fprintf(stderr, "[T] %s:%d %s: " fmt "\n", __FILE__, __LINE__, __func__, ##__VA_ARGS__)
#define DBG_ASSERT(cond) do { if(!(cond)) { DBG_TRACE("ASSERT: %s", #cond); abort(); } } while(0)
```
Mark branches: `DBG_TRACE("path=A: n<32 -> skip quant")`.

## Truth Table Escalation (When Fast Loop Stalls)

Tag every conditional branch with [T] or [F] based on DBG_TRACE:

```
FUNCTION: parse_token()
  if (!buf)            [F] -> ERR_NULL   (trace: buf=NULL)
  if (len < 4)         [T] -> continue    (trace: len=1024)
  if (buf[0]!=MAGIC)   [F] -> ERR_BAD    (trace: buf[0]=0x00, expected 0x46)
```

| Branch | Cond | T | F | Observed | Result |
|--------|------|---|---|----------|--------|
| buf    |!buf  |   | X | NULL     | FAIL   |
| len    |<4    | X |   | 1024     | PASS   |
| magic  |!=M   |   | X | 0x00     | FAIL   |

First [F] = root cause candidate. @see debug-deep to validate.

## Specialization (Conditional Loading)

When domain knowledge needed, call `debug-domain-router`:
> "What fact cannot be interpreted without domain knowledge?"

Load ONLY the smallest debug skill:
- C/C++ UB/lifetime → `debug-localize` + `debug-reference`
- GGUF/tensor → `debug-invariants` + `debug-reference`
- Network/protocol → `debug-reproduce` + `debug-root-cause`
- Quantization → `debug-invariants` + `debug-mde`
- Forensics → `debug-deep`

**Never preload domain packs.** Max 2 specialized skills per cycle.

## Auto-Skill Unload (Prevent Lingering Context)

On-demand debug skills must be UNLOADED after serving their purpose:

1. **Unload trigger:** After `VALIDATION: tests passed` (step 12)
2. **Unload scope:** All debug-* skills loaded during this cycle, EXCEPT debug-core + debug-domain-router
3. **Unload action:** Remove skill body from context. Keep only summary:
   > "debug-localize: applied, fixed n%32 check, validated."
4. **Context-tracker:** Log unload via `ctx.py unload debug-localize` — summary persists in sessions/
5. **Exception:** Keep debug-deep loaded until root cause is confirmed+validated

@see context-tracker for session memory + unload logging.

## Compact Status

`repro | facts | boundary | hypotheses | next test | result | fix | validation | unknowns`

## Boundaries

- Does not apply fixes (hands off to debug-fix)
- Does not run deep analysis (escalates to debug-deep)
- Does not validate fixes (hands off to debug-verify)
- `stop debug-core` or `normal mode`: revert to standard operation