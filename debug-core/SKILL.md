---
name: debug-core
description: "Debug orchestrator: 12-step loop, truth tables, auto-unload, knowledge capture. Default entry for all debugging."
compatibility: opencode
metadata:
  auto_unload: true
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
| 10 | **Hand off confirmed cause** | HANDOFF | `debug-fix` receives the cause, contract and reproducer |
| 11 | **Verify the patch** | VALIDATION | `debug-verify` runs risk-appropriate checks |
| 12 | **Capture result** | VALIDATION | Actual verification status and knowledge updates are recorded |

**After VALIDATION (step 12):** document to both KB tiers:
```
kb.py add --category <domain> --bug ... --cause ... --fix ... --pattern ...
```
See `knowledge-process` → Knowledge Base for the two-tier protocol and Analysis Log for append-only session notes.

Evidence tags: `FACT=observed`, `HYPOTHESIS=unproven`, `RESULT=outcome`, `CONCLUSION=supported cause`, `VALIDATION=tests passed`.

## Escalate when needed

If the fast loop stalls, load [instrumentation and escalation](references/escalation-techniques.md) for state-flow traces, truth tables and diagnostic probes. Choose the method that distinguishes active hypotheses.

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

See `knowledge-process` → Context Tracker for session memory and unload logging.

## Compact Status

`repro | facts | boundary | hypotheses | next test | result | fix | validation | unknowns`

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Keep a coverage ledger of observations, hypotheses, experiments and results. Choose the cheapest experiment that separates live hypotheses; do not escalate through every diagnostic method by rote or close the issue without retesting the original failure.


## Boundaries

- Does not apply fixes; hands off to debug-fix and uses debug-verify for executed verification
- Does not run deep analysis (escalates to debug-deep)
- Does not validate fixes (hands off to debug-verify)
- `stop debug-core` or `normal mode`: revert to standard operation