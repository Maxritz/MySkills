---
name: sherlock-it
description: "Measurement-driven performance investigation and optimisation with instrumentation, baseline comparison and retesting. Trigger: /sherlock-it."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
---

# Sherlock-It

**Objective:** Find, prove, fix and verify every significant performance bottleneck. Never optimise by guesswork.

## Persistent Analysis Log

**File:** `.opencode/sherlock-analysis.md` (project root, append-only)

### Compact run record

Record run ID, timestamp, target/revision, environment, workload, baseline, measurements, hypotheses, actions and validation status. Use the [run-log template](references/run-log-template.md); do not keep dated sample runs in the core.

## Run Modes

| Mode | Trigger | Depth | Time | Use Case |
|------|---------|-------|------|----------|
| **FULL** | `/sherlock-it FULL` | Complete workflow (1-6) + all traps | 30-120 min | First run, major changes, new target |
| **HIGH** | `/sherlock-it HIGH` | Baseline + Decompose + Investigate + top 3 traps | 10-30 min | After changes, verify specific area |
| **LOW** | `/sherlock-it LOW` | Read log, compare delta, top 1 bottleneck | 2-5 min | Quick check, CI gate, daily |

### Mode Behaviour

**FULL:**
- Runs all 6 workflow stages
- Creates all 8 trap types as needed
- Produces complete evidence-backed report
- Appends new RUN-XXX entry to log
- Updates hypothesis statuses

**HIGH:**
- Reads last RUN entry
- Re-runs Baseline (verify no regression)
- Re-runs Decompose for changed components
- Runs Investigate on top 3 hypotheses
- Appends DELTA entry to log

**LOW:**
- Reads last RUN entry only
- Runs single targeted measurement (top bottleneck)
- Appends QUICK-CHECK entry (10 lines max)
- No trap creation

---

## Mandatory Workflow (6 Stages)

### 1. Baseline
- Build and run unmodified target
- Record: hardware, driver, compiler, build flags, workload, input sizes, runtime config
- Capture: throughput, latency, resource utilisation, correctness
- Preserve reproducible baseline results

### 2. Decompose
- Map complete execution and data flow
- Enumerate every kernel, shader, operator, dispatch, transfer, sync point, fallback
- Record: invocation counts, tensor dimensions, formats, bytes moved, dependencies
- Distinguish: host time, device exec time, queue wait, launch overhead, wall time

### 3. Instrument
- Add targeted diagnostic traps where visibility insufficient
- Capture: per-call latency, launch dimensions, memory transactions, cache behaviour, occupancy, register pressure, stalls, sync
- Add: execution markers, timestamp queries, counters, trace events, selective debug logging
- Use sampling/selective instrumentation when tracing overhead distorts results
- Compare instrumented vs uninstrumented runs

### 4. Investigate
- Rank bottlenecks by cumulative cost and end-to-end latency impact
- Compare actual throughput against workload-specific hardware ceilings (not theoretical peak)
- Investigate: inefficient algorithms, poor instruction selection, scalar fallbacks, memory-bound exec, redundant transfers, serial deps, excessive dispatches, underutilisation
- Form explicit hypotheses; design measurements to disprove them

### 5. Optimise
- Prioritise by measured expected impact, implementation complexity, correctness risk
- Research: hardware-specific instructions, compiler behaviour, alternative algorithms, established implementations
- Change one meaningful variable at a time
- Preserve known-good implementation; isolate experimental variants
- Avoid speculative rewrites and unrelated refactoring

### 6. Verify
- Rebuild and rerun identical workloads
- Compare: raw per-kernel perf, aggregate operator costs, end-to-end throughput
- Verify: numerical correctness, edge cases, memory safety, concurrency
- Reject regressions and improvements that cannot be reproduced
- Retain results, measurements, exact config for every accepted change

---

## Diagnostic routing

Use the [diagnostic detail](references/diagnostic-methods.md) only when the first-pass investigation cannot explain the result: classify instrumentation, cache, scheduling, workload, environment, measurement-boundary, concurrency or observer effects. Prefer one experiment that distinguishes live hypotheses.

## Output Contract

Produce evidence-backed report:

- **Findings:** Ranked bottlenecks with raw measurements, invocation counts
- **Root causes:** Proven/suspected/unresolved — explicitly distinguished
- **Hardware analysis:** Architectural limits vs observed utilisation
- **Optimisation plan:** Specific changes, expected impact, validation criteria
- **Results:** Before/after measurements, % change, correctness, reproducibility
- **Next actions:** Highest-impact unresolved investigation

Use tables for per-kernel/per-shader measurements. Include raw timings and workload dimensions, not just percentages.

---

## Enforcement Rules

- Never assume kernel optimal because it uses specialised instruction
- Never equate aggregate device time with individual invocation latency
- Never confuse theoretical peak with achievable workload performance
- Never accept optimisation based on single noisy measurement
- Never claim root cause without evidence
- Never stop at first bottleneck if another significant bottleneck remains
- Never discard original baseline or correctness tests
- Always redirect investigation towards highest-impact measurable performance gap

**Success criterion:** Reproducible performance improvement with verified correctness, explained by evidence at relevant execution layer.

---

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Give each run an immutable ID, revision, target, workload and timing boundary; compare only compatible baselines. Keep hypotheses, observations and interventions separate, and re-run the measured bottleneck after each optimisation without inventing profiler data.


## Detailed examples

Use the [run-log template](references/run-log-template.md) for the full record format. Session-log mechanics are in [diagnostic and log details](references/diagnostic-methods.md).

## Boundaries

- Does not write kernel code (receives kernels to validate/optimise)
- Does not manage CUDA/ROCm installation
- Stop using the workflow; preserve existing project state.
- Log persists across sessions; never auto-deleted

