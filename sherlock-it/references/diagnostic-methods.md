# Sherlock-It: Diagnostic and Session-Log Details

Load for deeper diagnostic traps or when implementing the append-only analysis workflow. File names and helper commands are conventions; verify they exist before relying on them.

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
