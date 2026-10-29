---
name: debug-core
description: "Evidence-first debugging workflow: reproduce, localise divergence, test hypotheses, establish causality and verify fixes."
compatibility: opencode
metadata:
  role: debugging
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

## Context budget and continuity

OpenCode does not guarantee removal of a loaded skill body from the current conversation. Do not claim that a skill was unloaded or that its tokens were reclaimed unless the active runtime exposes and confirms such an operation.

After a diagnostic phase, stop repeating specialist instructions and keep a compact status record: applied skill, evidence collected, current hypothesis status, tests actually run and the next action. Read additional reference files only when they answer a live question. If a local context-management command is proposed, first verify that the command exists and inspect its implementation; otherwise record the action as a recommendation, not an executed operation.

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