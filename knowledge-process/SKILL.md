---
name: knowledge-process
description: "Sanitised analysis logs, compact context tracking, knowledge retention and risk-sized development validation. Session continuity and evidence capture."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: true
  priority: high
---

# Knowledge & Process

**Sanitised analysis logs, compact context tracking, knowledge retention and risk-sized development validation.**

---

## 1. Analysis Log (Append-Only Delta)

### Flow
1. **Useful findings** → append to `.opencode/analysis.md`
2. **Every update** → append a timestamped delta; never rewrite prior findings — `@appended {timestamp}: ...`
3. **Next analysis** → read prior deltas first, then re-check current source before reusing any recorded fact; logs are leads, not source truth.

### Format (Append-Only Markdown)
```markdown
## [T+0s] analysis-start
- scope: src/ include/ tests/
- files: 127 | findings: 3

## [T+5s] finding: bounds-check-missing
- file: src/tensor.c:87 @see c-systems
- severity: critical
- desc: tensor_load() missing n < MAX_TENSORS check

## [T+5s] finding: DBG_TRACE gap
- file: src/quant.c:42 @see debug-core
- desc: no DBG_TRACE at loop entry

## [T+10s] analysis-complete
- total: 3 | open: 3
```

### Sanitization (Mandatory)
**Never write:** personal paths, API keys, emails, phone numbers, machine names, credentials, endpoints.
- Apply a tested sanitisation implementation when available; if absent, review writes manually until the implementation exists.
- Run the corresponding sanitisation tests if present. Do not claim they pass without executing them.

### Lookup (Summary first, source verification when needed)
```bash
grep -n "finding:" .opencode/analysis.md | grep "severity: critical"
grep "pattern:" .opencode/analysis.md
```

### Validation Gates
- [ ] File at project root `.opencode/analysis.md`
- [ ] Append-only (no rewrite of prior sections)
- [ ] Sanitized (no secrets)
- [ ] Next session reads delta only

---

## 2. Context Tracker (Local Store)

### Storage Layout
```
~/.config/opencode/contexts/
├── {topic}.json     # summary + key points + refs
├── {topic}.link     # pointer to related contexts
└── _index.json      # topic → file mapping (tiny lookup)
```

### Context Entry (JSON, ≤500 tokens)
```json
{
  "id": "gguf-parser-v1",
  "topic": "gguf-parser",
  "summary": "Added Q4_0 dequant, header validation, overflow guard at tensor_load().",
  "key_points": ["block_size=32", "overflow check on n_tensors", "Q4_0 block layout verified against the pinned GGML revision"],
  "refs": ["gguf.c:87", "test_gguf.c:23"],
  "last_updated": "2026-08-25T22:00:00Z",
  "tokens": 420
}
```

### Operations

The names `ctx.py` and `kb.py` below describe optional interfaces, not proof that the scripts exist in this repository. Check that a tool is installed and inspect its implementation before using it; if absent, use the documented files manually and do not claim an operation succeeded.

**Save/Update** (idempotent, append-style):
```
Save {topic}: "{new info}" → append to existing summary, update refs, bump timestamp. Recheck the current source for claims that may have changed.
Max 500 tokens. Overflow → trim oldest key_points to `{topic}.history`.
```

**Retrieve**:
```
Get {topic} → read {topic}.json → return summary (≤500 tokens).
Search "gguf" → fuzzy match topics → show top 3 summaries.
```

### Unload Protocol (After Task Completion)
```
Unload {topic} → remove from context, keep 1-line summary.
Example output only: a tool may report unloaded topics and an estimated token delta. Never emit a success message unless the unload actually occurred.
```
@see debug-core:Auto-Skill-Unload for full protocol.

### Usage Flow
1. **Session start:** `Get "current-task"` → load prior context
2. **After each step:** `Save {topic}: "{what was learned}"`
3. **Before user interaction:** `Get {related_topics}` → avoid redundant explanation
4. **Task completion:** `Unload {topic}` → remove, keep summary
5. **Context grows incrementally**, not by re-reading full logs

---

## 3. Development Process (Risk-Sized Validation)

### Before Writing Code
1. **Architecture first.** Component diagram: data flow, interfaces, ownership, error paths, cleanup. No code until covers inputs, outputs, edge cases, resource lifecycle.
2. **Plan vetting.** Cross-check each task against architecture, dependencies and acceptance criteria; keep plans in version control when their decision history matters.
3. **Task breakdown.** Give each task one observable outcome and acceptance check. Prefer small, coherent units, but do not split code at an arbitrary line count when that hides a contract or creates artificial seams.
   Format: `[component]: [action] -> [expected invariant]`

### Ten-check validation catalogue

Use these checks according to risk. Always inspect the diff and run relevant targeted checks for behavioural changes. Add golden/differential, fuzz, sanitizer, state-flow, lifecycle, integration and performance checks when the changed contract justifies them. A check may be NOT APPLICABLE only with a reason. Use PASS, FAIL, BLOCKED, NOT RUN or NOT APPLICABLE honestly; an unrun check is never PASS.

| Gate | Check | Tool |
|------|-------|------|
| **1** | Compile | `cmake --build -Werror` |
| **2** | Format | `clang-format` / `ruff format` |
| **3** | Unit test | `ctest` / `pytest` |
| **4** | Reproduce | Capture repro case before fixing |
| **5** | Golden test | Known input → known output |
| **6** | Fuzz test | Malformed/random → graceful reject |
| **7** | Sanitizer | ASan + UBSan clean |
| **8** | Flow analysis | debug-core: truth table + data trace |
| **9** | Resource audit | Every alloc→free, handle→close |
| **10** | Performance | No >5% regression vs baseline |

**Illustrative log format:**

The following values are examples of the report shape only. Replace every status and measurement with actual observed results; never copy sample PASS claims into a real report.
```
✅ I1: compile clean
✅ I2: format clean
✅ I3: test_gguf ✅ (12/12)
✅ I4: repro captured (test/inputs/corrupt.bin)
✅ I5: golden test_gguf_golden ✅
✅ I6: fuzz 10000 iterations ✅
✅ I7: ASan+UBSan clean
✅ I8: truth table: 3 branches, all resolved
✅ I9: resource audit: 3 alloc/3 free, 0 leaks
✅ I10: perf 12.3ms → 12.1ms (-1.6%)
```

### Failure protocol
1. Record the failing check and minimal evidence.
2. Use a truth table or data-flow trace only when it can distinguish live hypotheses.
3. Apply a minimal change tied to the confirmed cause.
4. Re-run the failing check and affected regression gates; add broader checks when risk or coupling warrants it. A check marked NOT APPLICABLE needs a reason; an unrun check is never PASS.

### Plan Adherence
- Keep implementation aligned with agreed scope and acceptance criteria.
- If scope or approach materially changes, update the plan and record why; do not require a plan edit for every routine implementation detail.
- Record rationale for material trade-offs and deferred work.
- Do not present deferred work as completed.

---

## 4. Knowledge Base (Two-Tier, Sanitized)

### Tiers
- **Central** `~/.config/opencode/knowledge/{cat}/{slug}.json` — cross-project, never committed
- **Project** `.opencode/knowledge.md` — appendix to code, append-only table

### Entry (Sanitized JSON)
```json
{"category":"gguf","bug":"q4_0 crash n=50","root_cause":"n%32!=0","fix":"validate boundary","pattern":"check block-multiple","tags":["gguf","bounds"]}
```

### CLI
```bash
kb.py add --category gguf --bug "..." --cause "..." --fix "..." --pattern "..." --tags gguf
kb.py search "block size"     # max 3 results
```

### Sanitization (Every Write)
**Strip:** personal paths, API keys, emails, phone numbers, credentials, endpoints, machine names.
- Keys **never committed**.
- Run knowledge-base sanitisation tests if present; record their actual output.

### Usage
- **Before debugging:** `kb.py search` — known pattern skips full cycle.
- **After a verified fix:** add a sanitised entry only if the knowledge-base tooling exists and the project permits it; otherwise update the documented knowledge file manually.

---

## Deployment boundary

For platform-specific deployment, release, rollback and runtime operations, load `deployment-operations` and `ci-release-engineering`. This skill maintains sanitised knowledge and development continuity; do not treat illustrative commands, SDK flags or configuration as valid for a target until checked against its current version and project policy.

## Cross-Cutting Validation

### Per-Session Checklist
```
[ ] Context loaded (Get "current-task")
[ ] Analysis log exists (.opencode/analysis.md)
[ ] Plan vetted against architecture
[ ] Tasks have a clear outcome, acceptance check and coherent scope
[ ] Risk-sized verification plan ready
[ ] Knowledge base search done before debug
[ ] Sanitization rules understood
```

### Per-Change Checklist (select applicable gates)

- [ ] Exact revision and diff inspected
- [ ] Applicable build, format and static checks run
- [ ] Targeted behaviour test and original reproducer/regression checked when relevant
- [ ] Golden/differential reference checked where one exists
- [ ] Fuzzing and sanitizers considered for parser, unsafe-memory or concurrency risk
- [ ] Control flow, ownership, cleanup and failure paths checked when touched
- [ ] Integration/runtime check executed for cross-layer changes
- [ ] Performance baseline compared for performance-sensitive changes
- [ ] Every unrun, blocked or not-applicable gate recorded honestly

### Post-Validation (Step 12 of debug-core)
```
[ ] Store a sanitised, verified knowledge entry if the repository has an authorised mechanism
[ ] Append to .opencode/analysis.md
[ ] Unload completed context only if the context tool is available
[ ] Sanitization verified
```

---

## Output Report

```
KNOWLEDGE & PROCESS: <phase> STATUS
PHASE: <analysis|context|dev|kb|handoff>
SESSION: <id> | CONTEXT: <topics loaded> | KB: <entries added>
VALIDATION: <gate/status/result for each applicable check>
ANALYSIS: <findings> critical, <findings> high, <findings> medium
CONTEXT: <stored> entries, <unloaded> topics
KB: <central> + <project> entries
DEPLOY: delegated to deployment-operations / ci-release-engineering
BLOCKERS: <sanitisation gap|source not rechecked|failed gate|tool unavailable|unrun check>
```

---

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Persist only verified, sanitised deltas. Keep hypotheses distinct from facts, avoid recording secrets or personal identifiers, and never make a saved note or example authoritative for a newer repository revision without rechecking it.


## Boundaries

- Does not write code (receives code to validate/process)
- Does not provision or manage infrastructure; use deployment-operations and ci-release-engineering
- Does not replace git history (context tracker supplements)
- Do not revert unrelated work to stop this skill; stop using the workflow and preserve existing project state.