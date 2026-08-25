---
name: debug-core
description: "Debug orchestrator: DBG_TRACE. 12-step loop."
compatibility: opencode
metadata:
  role: debugging
  loading: on-demand
  auto_trigger: true
  priority: critical
---

## Instrumentation
@see c99-standards, dox-validate, traceability.

Every function MUST use trace markers:
```c
#define DBG_TRACE(fmt, ...) fprintf(stderr, "[T] %s:%d %s: " fmt "\n", __FILE__, __LINE__, __func__, ##__VA_ARGS__)
#define DBG_ASSERT(cond) do { if(!(cond)) { DBG_TRACE("ASSERT: %s", #cond); abort(); } } while(0)
```
Mark branches: `DBG_TRACE("path=A: n<32 -> skip quant")`.

## Purpose
Route debugging through the cheapest evidence path. Stay domain-neutral
until evidence requires specialization.

## Default loop (12 steps)
Reproduce. Record facts only. Classify. Localize deviation. Identify contract.
Keep 2-4 hypotheses. Choose MDE. Run + eliminate. Confirm root cause.
Apply smallest fix. Rebuild/retest. Validate.

**After VALIDATION (step 12):** document to both KB tiers:
`kb.py add --category <domain> --bug ... --cause ... --fix ... --pattern ...`
@see knowledge-base for two-tier protocol. Append analysis to
`.opencode/analysis.md`. @see analysis-log.

Evidence: FACT=observed, HYPOTHESIS=unproven, RESULT=outcome,
CONCLUSION=supported cause, VALIDATION=tests passed.

Evidence: FACT=observed, HYPOTHESIS=unproven, RESULT=experiment outcome,
CONCLUSION=supported cause, VALIDATION=tests passed.

## Escalate only when needed
Use reduction, instrumentation, state/data models, truth tables, fault trees
only when the fast loop cannot resolve uncertainty. Escalate to **debug-deep**.

## Truth Table Escalation (last resort)
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

First [F] = root cause candidate. @see debug-domain-router to validate.

## Specialization (conditional loading)
When domain knowledge needed, call `debug-domain-router`:
> "What fact cannot be interpreted without domain knowledge?"

Load ONLY the smallest debug skill:
- C/C++ UB/lifetime -> `debug-localize` + `debug-reference`
- GGUF/tensor -> `debug-invariants` + `debug-reference`
- Network/protocol -> `debug-reproduce` + `debug-root-cause`
- Quantization -> `debug-invariants` + `debug-mde`
- Forensics -> `debug-deep`

**Never preload domain packs.** Max 2 specialized skills per cycle.

## Auto-Skill Unload (prevent lingering context)

On-demand debug skills must be UNLOADED after serving their purpose:

1. **Unload trigger:** After `VALIDATION: tests passed` (step 12 of loop)
2. **Unload scope:** All debug-* skills loaded during this cycle, EXCEPT debug-core + debug-domain-router
3. **Unload action:** Remove skill body from context. Keep only the summary:
   > "debug-localize: applied, fixed n%32 check, validated."
4. **Context-tracker:** Log unload via `ctx.py unload debug-localize` — summary persists in sessions/
5. **Exception:** Keep debug-deep loaded until root cause is confirmed+validated

@see context-tracker for session memory + unload logging.

## Compact status
`repro | facts | boundary | hypotheses | next test | result | fix | validation | unknowns`

