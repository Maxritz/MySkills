---
name: debug-domain-router
description: "Load domain debug knowledge only when needed. Maps unresolved facts to minimal debug specializations."
compatibility: opencode
metadata:
  role: debugging
  loading: on-demand
---

# Debug Domain Router

**Ask:** "What fact or test cannot be interpreted correctly without domain knowledge?"

Load the **smallest specialization** needed. Max 2 per cycle. Never preload entire domain packs.

## Routing Table

| Domain | Unresolved Fact | Load Skills | Evidence Needed |
|--------|-----------------|-------------|-----------------|
| **C/C++** | Lifetime, UB, ABI, ownership, build/link | `debug-localize` + `debug-reference` | ASan/UBSan, addr2line, symbol table |
| **Windows** | Toolchain, DLL/ABI, filesystem, threading | `debug-localize` + `debug-reproduce` | WinDbg, ETW, procmon |
| **LLM/Tensor** | Tensor/state/inference semantics | `debug-invariants` + `debug-reference` | Logit diff, KV cache dump, ref model |
| **GGUF** | Metadata/tensor encoding | `debug-invariants` + `debug-mde` | Hex dump, ggml-dequant, tokenizer verify |
| **Quantization** | Block formats, numerical reconstruction | `debug-invariants` + `debug-mde` | Per-tensor error, scale/zero-point verify |
| **Networking** | Protocol/state/packet semantics | `debug-reproduce` + `debug-root-cause` | PCAP, state machine, RFC compliance |
| **GPU Kernels** | Launch config, occupancy, sync | `debug-localize` + `debug-invariants` | rocprof/Nsight, ISA, timeline |
| **Model Serving** | Routing, batching, cache, fallback | `debug-reproduce` + `model-pool` | Request trace, latency breakdown |
| **Filesystem** | Path resolution, locking, atomicity | `debug-localize` + `debug-reproduce` | strace, lockdep, fsck |
| **Distributed** | Consensus, partition, clock sync | `debug-root-cause` + `debug-hypothesis` | Jepsen-style, vector clocks |

## Specialization Skills (Minimal Profiles)

### debug-localize (C/C++/Systems)
- **Model:** `INPUT → STATE → TRANSFORMATION → OUTPUT`
- **Probe:** Coarse boundaries first, bisect failing region
- **Track:** Failure boundary / Causal boundary / First bad write
- **Checkpoint:** Compare intermediate outputs (pipelines) or state before/after transitions (stateful)

### debug-reference (Reference Comparison)
- **Ladder:** 0: Spec/math → 1: Known-good I/O → 2: Known-good component → 3: Trusted impl → 4: Trusted E2E
- **Normalize:** Inputs, config, precision, ordering, seeds, versions, tolerances
- **Compare:** Intermediate states, not just final output

### debug-invariants (Contract Checking)
- **Ask:** What must always be true of inputs/state/outputs?
- **Rules:** Ownership, lifetime, bounds, type
- **Use only if:** Eliminates a live hypothesis. Reference comparison preferred if cheaper.

### debug-mde (Minimum Distinguishing Experiment)
- **Prefer:** Safe, reversible, cheap, deterministic, minimally invasive, predictive
- **Typical:** Disable one transform, replace dep with controlled value, compare to reference, reduce input dimension, repeat for nondeterminism

### debug-reproduce (Minimal Reproducer)
- **Capture:** Exact input/invocation, expected vs actual
- **Determine:** Deterministic vs intermittent
- **Reduce:** Preserve failure while shrinking input/state/deps

### debug-root-cause (Causal Chain)
- **Chain:** `failure → first bad state → triggering operation → violated expectation → defect`
- **Confidence:** suspected → supported → confirmed → regression-confirmed
- **Confirmed only when:** Fix demonstrably removes failure under relevant tests

## Anti-Patterns

| Anti-pattern | Correction |
|--------------|------------|
| Preload "Linux debugging" because repo is Linux | Load only `debug-localize` for the specific lifetime question |
| Load all GPU skills for kernel issue | Load `debug-localize` + `debug-invariants` for the specific launch/occupancy question |
| Load `debug-deep` immediately | Run fast loop first; escalate only when evidence insufficient |

## Unload Protocol

After domain knowledge consumed:
1. **Trigger:** After `VALIDATION: tests passed` (debug-core step 12)
2. **Scope:** All domain skills loaded this cycle
3. **Action:** Remove skill body, keep summary: `"debug-localize: applied, fixed n%32 check, validated."`
4. **Log:** `ctx.py unload debug-localize` — summary persists in sessions/

## Output Format

```
ROUTE: <domain> → <skill1> + <skill2>
REASON: <unresolved fact requiring domain knowledge>
EVIDENCE NEEDED: <specific evidence each skill will produce>
ESTIMATED COST: <low/medium/high>
```

## Boundaries

- Does not diagnose (routes only)
- Does not run techniques (delegates to specialized skills)
- `stop debug-domain-router`: revert.