# Ponytail Diag: Conditional Diagnostic Methods

Load this file only when a selected method resolves a live question. These are method selectors, not a requirement to produce every diagram.

## Truth tables

Use when two or more boolean conditions interact on the failing path. Enumerate reachable combinations, record observed versus untested combinations, and derive reachability from source or runtime evidence. Do not label a path unreachable merely because it has not been observed.

## Hypothesis block

~~~text
H<n>: <falsifiable explanation>
Supports: <observed evidence>
Contradicts: <evidence against it>
Prediction: <result expected if true>
Probe: <smallest distinguishing experiment>
Status: LIVE | SUPPORTED | FALSIFIED | CONFIRMED
~~~

Keep no more live hypotheses than are useful. A ranked list is better than four invented alternatives.

## Task ledger

TODO <file>:<line-or-symbol> | severity: <P0/P1/P2> | issue | candidate fix | reproducer/test | status

Do not invent exact line numbers when source is unavailable. Use a symbol or mark location unknown. A task is not complete merely because it is written down.

## Method selector

- **Waterfall/data-flow trace:** trace one concrete input through calls and mutations; find the earliest unexpected value supported by evidence.
- **Fault tree:** use for a multi-condition failure. Define the top event and ensure AND/OR gates match the actual causal logic.
- **Fishbone:** use to organise broad candidate categories for multi-subsystem incidents; each branch is a hypothesis until tested.
- **5 Whys:** use when a causal chain is known but the upstream design/process choice is unclear. Stop when further answers become speculative.
- **Barrier analysis:** identify a required guard or synchronisation contract, then establish whether it is absent, ineffective or bypassed. An absent barrier is a defect only if the contract requires it.
- **Change analysis:** compare source, configuration, dependency, workload and environment changes across the last known-good and first bad run. Correlation nominates a suspect; it does not prove causation.
- **Pareto:** rank suspects by observed impact or frequency when there are enough comparable incidents. Do not assume the familiar 80/20 ratio applies.
- **Concurrency:** establish whether accesses conflict on the same shared state, whether at least one access writes, and whether the language/runtime's synchronisation rules order the accesses. In C++, conflicting non-atomic accesses without a happens-before relationship can constitute a data race and undefined behaviour. A missing happens-before relation alone does not prove a race if the accesses do not conflict or the state is otherwise protected.
- **Timing/drift:** collect repeated, comparable measurements and correlate latency with the relevant boundary, CPU/GPU state, memory, I/O, locks and queue depth. Treat a two-standard-deviation threshold only as a heuristic when distributional assumptions and sample size make it meaningful. Prefer the observed distribution and a predeclared acceptance threshold.
- **Instrumentation audit:** check whether tracing, logging, sanitizers, counters or synchronisation added for the diagnosis alter timing or scheduling.

## Evidence discipline

For every method, distinguish measured observations, source-derived facts, assumptions and predictions. Write the predicted result before running the probe. Record exact command, revision, configuration, exit status and relevant output. If a test was not run, use NOT RUN or BLOCKED, never PASS.
