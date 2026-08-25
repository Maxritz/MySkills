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

## Instrumentation (always-on, auto-triggered)

Every function MUST use trace markers for evidence collection:
```c
#define DBG_TRACE(fmt, ...) fprintf(stderr, "[T] %s:%d %s: " fmt "\n", __FILE__, __LINE__, __func__, ##__VA_ARGS__)
#define DBG_ASSERT(cond) do { if(!(cond)) { DBG_TRACE("ASSERT: %s", #cond); abort(); } } while(0)

int tensor_add(const float* a, float* b, size_t n) {
    DBG_TRACE("enter: a=%p b=%p n=%zu", (void*)a, (void*)b, n);  /* evidence */
    DBG_ASSERT(a != NULL && b != NULL && n > 0);                  /* invariant */
    for (size_t i = 0; i < n; i++) b[i] += a[i];
    DBG_TRACE("exit: ok");
    return 0;
}
```

Mark key decision points: `DBG_TRACE("path=A: n<32 -> skip quant")` or `DBG_TRACE("path=B: fallback to scalar")`.
These become FACTs in the debug loop below.

## Purpose
Route debugging through the cheapest evidence-producing path. Stay domain-neutral until evidence requires specialization.

## Default loop
1. Reproduce.
2. Record verified facts only.
3. Classify broadly.
4. Localize the earliest observable deviation.
5. Identify the relevant contract/invariant.
6. Keep a small hypothesis set.
7. Choose the minimum discriminating experiment (MDE).
8. Run it and eliminate hypotheses.
9. Confirm root cause.
10. Apply the smallest justified fix.
11. Rebuild/retest the original failure.
12. Add regression coverage.

## Evidence labels
- FACT: directly observed or verified.
- HYPOTHESIS: plausible, unproven cause.
- RESULT: actual experiment outcome.
- CONCLUSION: evidence-supported cause.
- VALIDATION: tests actually executed and passed.

Never present a hypothesis as a fact. Never call an unrun test PASS.

## Escalate only when needed
Use reduction, instrumentation, state/data models, flow analysis, truth/logic tables, fault trees, or fishbone analysis only when the fast loop cannot resolve the uncertainty.

## Specialization (conditional loading)

When domain knowledge is needed, call `debug-domain-router`:
> "What fact or test cannot be interpreted without domain knowledge?"

Based on the answer, load ONLY the smallest debug skill that resolves it:
- C/C++ lifetime/UB → `debug-localize` + `debug-reference`
- GGUF/tensor encoding → `debug-invariants` + `debug-reference`
- Network protocol/state → `debug-reproduce` + `debug-root-cause`
- Quantization block formats → `debug-invariants` + `debug-mde`
- General forensics → `debug-deep`

**Never preload domain packs.** Each debug-* skill loads on-demand only for its specific question. Do not load more than 2 specialized skills per diagnostic cycle.

## Compact status
Maintain:
`repro | facts | boundary | hypotheses | next test | result | fix | validation | unknowns`

Do not repeat established facts unless they change a decision.
