---
name: debug-deep
description: "Escalation techniques: flow/state/contract/fishbone/FTA/5-whys/barrier/change/waterfall. Use only when fast loop cannot resolve."
compatibility: opencode
metadata:
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

## 1. Data/State Model

Build `INPUT → STATE → TRANSFORMATION → OUTPUT` model:

```
STATE: 
  buf: NULL → allocated(1024) → corrupted(offset 512)
  len: 0 → 1024 → 1024
  magic: unset → 0x46464646 → 0x00000000

TRANSITIONS:
  init()        → buf=alloc, len=1024, magic=MAGIC
  parse()       → reads buf[0], expects MAGIC
  corrupt()     → buf[512]=0 (buffer overflow from caller)

INVARIANTS:
  [OK] buf != NULL after init
  [OK] len == allocated_size
  [BROKEN] buf[0] == MAGIC at parse entry
```

Emit when: failure involves state corruption, use-after-free, or invalid transitions.

## 2. Control/Data Flow

Annotated call graph with branch decisions:

```
ENTRY: main()
  → parse_file() [br1: file_exists=T]
    → open() [br2: fd>=0=T]
    → read_header() [br3: magic_ok=F] ← FAILURE BOUNDARY
      → validate_magic() [br4: magic==0x46=F]
        → return ERR_BAD_MAGIC
```

Mark each branch: `[taken=true/false]` with concrete value. Static-resolvable vs `[dynamic]`.

Emit when: failure path unclear, multiple entry points, or async boundaries.

## 3. Contracts/Invariants

For each function on failing path:

| Function | Precondition | Postcondition | Invariant | Status |
|----------|--------------|---------------|-----------|--------|
| parse_token | buf!=NULL, len>=4 | token.valid | buf[0]==MAGIC | BROKEN |
| allocate | size>0 | ptr!=NULL | aligned(ptr, 8) | OK |
| dequantize | src!=NULL, dst!=NULL | dst filled | quantization_scale>0 | OK |

Only use invariants that eliminate a live hypothesis. If trusted reference comparison is cheaper, use that instead.

## 4. Truth Tables (≥2 flags combine)

```
flA = len<4       flB = buf[0]!=MAGIC
flA=F flB=T → path-D  ← (failing)
flA=T flB=F → path-E  <untested>
flA=T flB=T → path-F  <unreachable>
```

Boundary gaps → TODOs. One line per row.

## 5. Fault Tree Analysis (FTA)

Logic-heavy causal decomposition:

```
TOP: parse_token returns ERR_BAD_MAGIC
  AND:
    GATE1: magic check executes
      - parse_token called
      - len >= 4 (br1=F)
    GATE2: magic mismatch
      - buf[0] != MAGIC
        OR:
          - buffer not initialized (basic event)
          - buffer corrupted after init (basic event)
          - wrong buffer passed (basic event)
```

AND = all parents occur. OR = any suffices.

## 6. Fishbone / Ishikawa (≥3 subsystems)

```
FAILURE: parse_token returns ERR_BAD_MAGIC
  Method:   [init not called] [wrong API sequence]
  Machine:  [memory corruption] [hardware fault] [compiler bug]
  Material: [bad input file] [truncated download] [wrong format]
  Man:      [developer error] [config mistake] [env mismatch]
```

Test bottom-up: eliminate Man first (cheapest), then Material, Machine, Method.

## 7. 5 Whys (Opaque Single Cause)

```
Q1: Why ERR_BAD_MAGIC? A: buf[0] != MAGIC at parse entry
Q2: Why buf[0] != MAGIC? A: init() never wrote MAGIC
Q3: Why init() not called? A: caller skipped init for "optimization"
Q4: Why allowed? A: no API enforcement, no static check
Q5: Why no enforcement? A: ownership model not documented → REQ/DEP/CONFIG choice
```

Stop at a **choice** (requirement/dependency/config), not a component.

## 8. Barrier Analysis

```
BARRIER: magic validation in parse_token()
  Existence: YES (br3: magic_ok check)
  Bypass: YES (caller passed uninitialized buf)
  → Logic error: parse_token validates but caller violates precond

BARRIER: init() writes MAGIC
  Existence: YES
  Bypass: NO (init not called)
  → Design gap: no API enforcement → TODO: add init-required attribute
```

## 9. Change Analysis ("Worked Last Week")

```
ONSET: 2026-10-01 14:30
LAST GOOD: 2026-09-28 09:00
DIFF: commit abc123 (parse.c:42) — changed buf[0] check from MAGIC to 0x46
CORRELATION: 100% — only change touching magic validation
PRIME SUSPECT: commit abc123
```

Smallest code/env diff correlating with onset = prime suspect.

## 10. Waterfall Trace (Intermittent/State-Dependent)

Trace ONE input through EVERY call:

```
INPUT: file.bin (1024 bytes, MAGIC at offset 0)
  main:100     → parse_file("file.bin")
  parse_file:25  → open() → fd=3
  parse_file:30  → read_header(fd) → reads 16 bytes
  parse_file:35  → validate_magic(buf) → buf[0]=0x00 ← FIRST UNEXPECTED VALUE
  validate_magic:10 → if (buf[0]!=MAGIC) → return ERR_BAD
```

Cross-trace consistency: value materialising "from nowhere" = skipped branch or stale alias.

## 11. Instrumentation Traps

Add dynamically when visibility insufficient:

| Trap | Captures | Hypothesis |
|------|----------|------------|
| Dispatch | Launch count, grid size, launch latency | Kernel not launching |
| Memory | Bytes R/W, alignment, bandwidth, cache misses | Memory-bound |
| Instruction | Generated ISA, vectorisation, fallback paths | Scalar fallback |
| Sync | Barriers, fences, queue waits, idle gaps | Serial dependency |
| Allocation | Freq, pressure, temp buffers | Allocation overhead |
| Transfer | Host-device copies, staging, latency | Transfer bottleneck |
| Dependency | Serial exec, critical path, hidden sync | False dependency |
| Accuracy | Output diff, numerical error, precision | Precision loss |

Each trap: clear hypothesis + measurable output + disable mechanism.

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

## Boundaries

- Never guess. Every annotation traces to real input/call site/evidence.
- If no known-good reference exists, validate by invariants alone.
- Probe placement: branch decision → function entry with args → invariant assert before nil propagates.
- Does not write study docs unless asked.
- `stop debug-deep`: revert.