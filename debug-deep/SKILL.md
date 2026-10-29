---
name: debug-deep
description: "Escalation techniques: flow/state/contract/fishbone/FTA/5-whys/barrier/change/waterfall. Use only when fast loop cannot resolve."
compatibility: opencode
metadata:
  auto_unload: true
  auto_trigger: false
  role: debugging
  loading: on-demand
---

# Debug Deep

Use **only the technique** that answers a specific unresolved question. Do not run every technique automatically.

## Technique Selector

| Unresolved Question | Technique | Output |
|---------------------|-----------|--------|
| What states lead to failure? | **Data/State Model** | State transition diagram + invariant violations |
| What path was taken? | **Control/Data Flow** | Annotated call graph with branch decisions |
| What contract was broken? | **Contracts/Invariants** | Pre/post/invariant check table |
| Which boolean combination? | **Truth Tables** | All flag combos + reachability |
| What caused this? | **Fault Tree (FTA)** | Top event → AND/OR gates → basic events |
| Multiple cause categories? | **Fishbone** | Method/Machine/Material/Man branches |
| Opaque single cause? | **5 Whys** | Q/A chain to req/dep/config choice |
| What should have stopped it? | **Barrier Analysis** | Existence + bypass = logic error |
| "Worked last week"? | **Change Analysis** | Smallest code/env diff correlating with onset |
| Intermittent/state-dependent? | **Waterfall Trace** | One input through every call; first unexpected value |
| Many suspects? | **Pareto** | Rank by frequency; probe top 20% |
| Concurrency/race? | **Interleaving Enum** | All thread interleavings; no happens-before = defect |
| Intermittent timeouts? | **Timing/Drift** | Sample clocks+RSS+disk+CPU; spike >2σ at boundary |

## Technique detail (on demand)

Use [diagnostic techniques](references/diagnostic-techniques.md) for the stepwise methods and working templates. Select only the needed method: state/data model for stale state; flow trace for lost or reordered work; invariants for contract violations; truth table for interacting flags; fault tree/fishbone for multi-subsystem failures; change analysis for regressions; waterfall trace for intermittent state-dependent faults; instrumentation audit when measurement may perturb behaviour.

## Evidence rule

Write the expected predicate and observed result first. Choose an experiment that distinguishes hypotheses; record sources, times, revisions and uncertainty. Do not fill every diagnostic template by rote.

## Output Contract

Produce evidence-backed report:

- **Findings:** Ranked bottlenecks with raw measurements
- **Root causes:** Proven/suspected/unresolved — explicitly distinguished
- **Hardware analysis:** Architectural limits vs observed utilisation
- **Optimisation plan:** Specific changes, expected impact, validation criteria
- **Results:** Before/after measurements, % change, correctness
- **Next actions:** Highest-impact unresolved investigation

## Handoff

When root cause confirmed → emit:
```
HANDOFF: debug-fix ready — one repro, one patch, one verify.
```

Do not apply fixes in deep mode.

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Select the diagnostic structure that resolves the current uncertainty, state why it fits, and stop when evidence distinguishes the cause. Do not generate a truth table, fishbone or fault tree merely to fill a template.


## Boundaries

- Never guess. Every annotation traces to real input/call site/evidence.
- If no known-good reference exists, validate by invariants alone.
- Probe placement: branch decision → function entry with args → invariant assert before nil propagates.
- Does not write study docs unless asked.
- `stop debug-deep`: revert.