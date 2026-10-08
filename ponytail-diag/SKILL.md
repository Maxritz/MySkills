---
name: ponytail-diag
description: "Structured debugging from code-as-data, one-line verdict by default. Trigger: what should vs did happen, /ponytail-diag."
metadata:
  loading: on-demand
  auto_unload: true
---

# Ponytail Diag

Diagnose failures by building an internal model of the code (call graph,
control-flow branches, data-state transitions) and emitting only the verdict.
All heavy analysis happens in reasoning — **zero output tokens** until the
final verdict line.

## Default (minimal output)

Emit exactly one line:

`ROOT CAUSE: <file>:<line> — <one-line cause> | FIX: <one-line direction> | PROBE: <line> <expr>`

Example: `ROOT CAUSE: parser.py:42 — len(fields)<3 not guarded before unpack | FIX: add guard or use unpack-safe pattern | PROBE: 42 assert len(fields)>=3`

No prose. No tables. No templates. If the user asks "more",
expand to minimal (4 lines). If the user asks "show work" or "deep dive",
expand to full.

## Internal model (no output unless asked)

Build a data model of the failure path, never emitted:

1. **Call graph.** Trace entry → exit. Name every branch and its static
   condition. If static analysis can't resolve it, mark `[dynamic]`.
2. **Branch truth table.** For every `if`/`switch`/`match` on the failing
   path, record `[taken=true/false]` with the concrete value that caused it.
3. **Data-state flow.** Track each variable: `[init → assign → mutate → use]`.
   A `nil`/`None`/`undefined` that appears at a branch with no preceding
   assignment in the trace = untraced branch or stale alias → flag internally.
4. **Invariant check.** At each step, check the contract: type, non-null,
   range, count. Record `[OK | BROKEN]` internally.
5. **Root-cause filter.** Map surviving evidence to the
   `failure → first bad state → triggering operation → violated expectation →
   defect` chain. Rank hypotheses by information-gain-per-cost (cheapest
   experiment that falsifies the most).

This model drives the one-line verdict. It is **not printed**.

## When to expand

Two modes, distinguished by trigger phrase:

### More (minimal expansion)

Trigger: "more" → emit only:

```
FLOW: <entry> → fn_A[br1:F] → fn_B[br2:T] → crash
DATA: var_x=100 → fn_A → nil → fn_B  ← nil appears without reassignment
H1: <claim>  For:<ev> Against:<ev> Test:<exp> Cost:low Status:unknown
TODO:fn_B.py:12:fix nil-guard Test:feed_nil_repro
```

Four lines. No prose. No tables. No extended methods.

### Show work / deep dive (full expansion)

Trigger: "show work" or "deep dive" → emit all sections in this exact order:

```
FLOW: <entry> → fn_A[br1:F] → fn_B[br2:T] → crash
DATA: var_x=100 → fn_A → nil → fn_B  ← nil appears without reassignment
BRANCHES: br1: fn_A:27 if len(fields)<3 [taken=false] — static-resolvable
TRUTH TABLES:
  flA=F flB=T → path-D  ← (failing)
  flA=T flB=F → path-E  <untested>
  flA=T flB=T → path-F  <unreachable>
H1: <claim>  For:<ev> Against:<ev> Test:<exp> Cost:low Status:unknown
H2: <claim>  For:<ev> Against:<ev> Test:<exp> Cost:low Status:unknown
H3: <claim>  For:<ev> Against:<ev> Test:<exp> Cost:low Status:unknown
H4: <claim>  For:<ev> Against:<ev> Test:<exp> Cost:low Status:unknown
FISHBONE: 3 subsystems — Method:[], Machine:[], Material:[], Man:[]
5 WHYS: Q1: why? A: because. Q2: ... Q3: ...
BARRIER: <what should have stopped this> Existence:Y/N Bypass:Y/N
FTA: top-event → AND(gate1, gate2) OR(basic-event)
CHANGE: last-diff ≈ 7d ago — commit abc123 — fn_B:12 changed
TODO:<file>:<line>: [sev:P0|P1|P2] <issue> | fix: <candidate> | test: <repro>
```

`BRANCHES` emitted when ≥1 branch on the failing path is static-resolvable.
`TRUTH TABLES` emitted only when ≥2 flags combine.
`HYPOTHESES` capped at 4; eliminate contradicted ones immediately.
Extended methods emitted only when the case calls for them (see method map
below). `TODO` ledger always last.

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

## Handoff

When a hypothesis reaches `confirmed` (fix removes failure under tests):
emit `HANDOFF: debug-fix ready — one repro, one patch, one verify.`
Do not apply fixes in diag mode.

## Boundaries

- Zero guessing. Every branch annotation and hypothesis traces to real input,
  call site, or evidence. If static-only, say `PROBE NEEDED` in the verdict.
- If no known-good reference exists, validate by invariants alone.
  Do not fabricate a reference.
- Probe placement: branch decision → function entry with args → invariant
  assert before `nil` propagates. Suggest exact line + expression.
- Does not apply fixes. Does not write study docs unless asked.
- `stop ponytail-diag` or `normal mode`: revert.
