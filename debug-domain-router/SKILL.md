---
name: debug-domain-router
description: "Load domain debug knowledge only when needed. Maps unresolved facts to minimal debug specializations."
compatibility: opencode
metadata:
  role: debugging
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
| **Model Serving** | Routing, batching, cache, fallback | `debug-reproduce` + `llm-serving` | Request trace, latency breakdown |
| **Filesystem** | Path resolution, locking, atomicity | `debug-localize` + `debug-reproduce` | strace, lockdep, fsck |
| **Distributed** | Consensus, partition, clock sync | `debug-root-cause` + `debug-hypothesis` | Jepsen-style, vector clocks |

## Specialist selection

The route table above selects a narrow debugging skill. Inspect the target skill's header and read its body only when needed. The longer per-specialist profiles remain in [router reference](references/specialist-profiles.md); avoid duplicating their procedures in this orchestrator.

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

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Load only the specialist that matches the unresolved fact; verify every routed skill path exists. After the fact is resolved, hand back the result and unload irrelevant specialists instead of stacking overlapping orchestrators.


## Boundaries

- Does not diagnose (routes only)
- Does not run techniques (delegates to specialized skills)
- `stop debug-domain-router`: revert.