# Ponytail Diag: Deep-Dive Templates

Load only when the user requests a deep dive or the fast diagnostic loop needs a structured comparison. These templates organise evidence; they must not be filled with invented results.

## Truth tables (deep dive only)

Only when ≥2 flags combine. Mark reachability:

`flA=F flB=T → path-D  ← (failing)`
`flA=T flB=F → path-E  <untested>`
`flA=T flB=T → path-F  <unreachable>`

Boundary gaps → TODOs. One line per row.

## Hypothesis block (deep dive only)

```
H<n>: <claim>  For:<ev> Against:<ev> Test:<exp> Cost:low Status:<unknown|confirmed|falsified>
```

Keep ≤4 live. Eliminate contradicted ones immediately.

## To-do ledger (deep dive only)

`TODO<file>:<line>: [sev:P0|P1|P2] <issue> | fix: <candidate> | test: <repro>`

`P0` — root defect / blocks repro. `P1` — real defect, doesn't block repro.
`P2` — hardening gap. Only emit todos actionable today.

## Extended methods (deep dive only)

- **Fishbone / Ishikawa** — ≥3 subsystems at fault. Categories: Method,
  Machine, Material, Man. Test bottom-up.
- **5 Whys** — opaque single-cause. `Q: why? A: because.` Repeat to a choice
  (req/dep/config), not a component.
- **Waterfall trace** — intermittent/state-dependent. Trace one input through
  every call. First unexpected value = probe target. Cross-trace consistency:
  value materialising "from nowhere" = skipped branch or stale alias.
- **Barrier analysis** — what should have stopped this? Existence + bypass =
  logic error. Absent = design gap → TODO.
- **Change analysis** — "worked last week". Smallest code/env diff correlating
  with onset = prime suspect.
- **FTA (fault tree)** — logic-heavy. Top event → AND/OR gates → basic events.
  AND = all parents occur. OR = any suffices.
- **Pareto** — many suspects. Rank by frequency; probe the top 20%.
- **Concurrency/race** — enumerate interleavings. No happens-before = defect.
- **Timing/drift** — intermittent timeouts. Sample clocks + RSS + disk + CPU.
  Spike >2σ at the bad-state boundary = suspect.
