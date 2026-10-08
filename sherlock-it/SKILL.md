---
name: sherlock-it
description: "Measurement-driven performance investigation and optimisation. Profiles every execution layer, creates instrumentation traps to expose hidden bottlenecks, identifies root causes, implements verified optimisations, and retests against measured baselines. Persistent analysis log with FULL/LOW/HIGH modes.
, /sherlock-it."
metadata:
  loading: on-demand
  auto_unload: true
---

# Sherlock-It

**Objective:** Find, prove, fix and verify every significant performance bottleneck. Never optimise by guesswork.

## Persistent Analysis Log

**File:** `.opencode/sherlock-analysis.md` (project root, append-only)

### Log Format (Dox-Style)
```markdown
# Sherlock Analysis Log

## [RUN-001] 2026-10-08T14:30:00Z — MODE: FULL — TARGET: llama.cpp
### BASELINE
- Hardware: H100 (CC 9.0), Driver 560.x, CUDA 12.6
- Workload: prefill 4096, decode 128, batch 32
- Baseline: 12,450 tok/s, TTFT 45ms, p99 latency 230ms

### FINDINGS
| Rank | Component | Cost | Evidence | Status |
|------|-----------|------|----------|--------|
| 1 | attention | 68% | ncu: SM throughput 34%, L2 78% | CONFIRMED |
| 2 | KV cache write | 12% | nsys: memcpy 1.2GB/s | SUSPECTED |
| 3 | token sampling | 5% | perf: 8% cycles in top-k | UNRESOLVED |

### HYPOTHESES
| ID | Claim | For | Against | Test | Cost | Status |
|----|-------|-----|---------|------|------|--------|
| H1 | FlashAttention-2 kernel underutilised | SM occupancy 34% | - | try FA-3 | low | PENDING |
| H2 | KV cache not paged | memcpy bottleneck | - | enable PagedAttention | med | PENDING |

### ACTIONS
- [ ] Implement FA-3 kernel (H1 test)
- [ ] Enable PagedAttention (H2 test)
- [ ] Profile with nsys after each

## [RUN-002] 2026-10-08T16:15:00Z — MODE: LOW — TARGET: llama.cpp
### DELTA from RUN-001
- FA-3 applied: attention 68% → 52% (-16pp)
- PagedAttention enabled: KV write 12% → 4% (-8pp)
- New bottleneck: token sampling 5% → 18% (now #2)

### UPDATED FINDINGS
| Rank | Component | Cost | Δ | Status |
|------|-----------|------|---|--------|
| 1 | attention | 52% | -16pp | IMPROVED |
| 2 | token sampling | 18% | +13pp | REGRESSED |
| 3 | KV cache write | 4% | -8pp | FIXED |

### NEW HYPOTHESES
| ID | Claim | For | Against | Test | Cost | Status |
|----|-------|-----|---------|------|------|--------|
| H3 | Speculative decoding reduces sampling | - | - | enable draft model | med | PENDING |

---

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

## Diagnostic Traps (8 Types)

| Trap | Captures | When to Create |
|------|----------|----------------|
| Dispatch | Launch count, grid size, workgroup dims, launch latency | Kernel launch overhead suspected |
| Memory | Bytes R/W, alignment, bandwidth, cache misses | Memory-bound suspected |
| Instruction | Generated ISA, vectorisation, instruction mix, fallback paths | Compute-bound suspected |
| Synchronisation | Barriers, fences, queue waits, idle gaps | Sync overhead suspected |
| Allocation | Alloc frequency, memory pressure, temp buffers | Alloc overhead suspected |
| Transfer | Host-device copies, staging, transfer latency | PCIe/NVLink bottleneck suspected |
| Dependency | Serial exec, critical path, hidden sync | False dependency suspected |
| Accuracy | Output diff, numerical error, precision-related perf | Precision loss suspected |

**Each trap:** clear hypothesis + measurable output + disable mechanism.

---

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

## Log Management

### Auto-Load on Session Start
```
On sherlock-it load: read .opencode/sherlock-analysis.md
If exists: show last 3 RUN entries summary
If missing: create new log, start with FULL
```

### Delta Comparison (Automatic)
```python
def compare_runs(current, previous):
    # Compare bottlenecks, costs, statuses
    # Mark: IMPROVED, REGRESSED, FIXED, NEW, UNCHANGED
    # Update hypothesis statuses: PENDING → TESTING → CONFIRMED/FALSIFIED
    # Carry forward UNRESOLVED hypotheses
```

### Sanitization
- No paths, keys, emails, phones, machine names
- Same rules as knowledge-base

### Validation Gates (Per RUN Entry)
- [ ] Baseline recorded with full config
- [ ] At least 3 measurements per bottleneck
- [ ] Hypothesis status updated
- [ ] Actions have checkboxes
- [ ] Next RUN knows where to continue

---

## Boundaries

- Does not write kernel code (receives kernels to validate/optimise)
- Does not manage CUDA/ROCm installation
- `stop sherlock-it`: revert
- Log persists across sessions; never auto-deleted