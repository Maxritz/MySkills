---
name: knowledge-process
description: "Unified knowledge & process: analysis-log (append-only delta), context-tracker (local store), dev-process (10-iter validation), knowledge-base (two-tier sanitized), app-engine-deploy. Session continuity, validation gates, deployment."
compatibility: opencode
metadata:
  loading: on-demand
  auto_trigger: true
  priority: high
---

# Knowledge & Process

**Unified across analysis logging, context tracking, development process, knowledge capture, and deployment.**

---

## 1. Analysis Log (Append-Only Delta)

### Flow
1. **Full analysis** → append to `.opencode/analysis.md`
2. **Every change** → **append** (never rewrite) — `@appended {timestamp}: ...`
3. **Next analysis** → read only appended delta, never full codebase

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
- Same regex enforcement as knowledge-base.
- Validate: `test_analysis_log.py` — 6 tests pass.

### Lookup (Never Open Full File)
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
  "key_points": ["block_size=32", "overflow check on n_tensors", "q4_0 scale at offset 10"],
  "refs": ["gguf.c:87", "test_gguf.c:23"],
  "last_updated": "2026-08-25T22:00:00Z",
  "tokens": 420
}
```

### Operations

**Save/Update** (idempotent, append-style):
```
Save {topic}: "{new info}" → append to existing summary, update refs, bump timestamp.
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
ctx.py unload debug-localize → "debug-localize: applied, validated. 42 tokens freed."
```
@see debug-core:Auto-Skill-Unload for full protocol.

### Usage Flow
1. **Session start:** `Get "current-task"` → load prior context
2. **After each step:** `Save {topic}: "{what was learned}"`
3. **Before user interaction:** `Get {related_topics}` → avoid redundant explanation
4. **Task completion:** `Unload {topic}` → remove, keep summary
5. **Context grows incrementally**, not by re-reading full logs

---

## 3. Development Process (10-Iteration Validation)

### Before Writing Code
1. **Architecture first.** Component diagram: data flow, interfaces, ownership, error paths, cleanup. No code until covers inputs, outputs, edge cases, resource lifecycle.
2. **Plan vetting.** Every task cross-checked against architecture. No orphaned modules. Plans version-controlled, updated via diff.
3. **Task breakdown.** ≤30-line units. Each: 1 purpose, 1 test, 1 file/function change.
   Format: `[component]: [action] → [expected invariant]`

### 10-Iteration Validation (Never Skip)
| Iter | Check | Tool |
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

**Log format:**
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

### Failure Protocol
1. Generate truth table (debug-tracing).
2. Generate data model trace.
3. Inject to `ponytail`: "Trace: [truth table]. Fix minimally."
4. Re-run all 10 iterations. **No advancement until ✅.**

### Plan Adherence
- No deviation from vetted plan.
- If approach changes → update plan first via diff.
- Rationale recorded for every change.
- "I'll fix it later" is **forbidden**.

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
- Test: `test_knowledge_base.py:6` passes.

### Usage
- **Before debugging:** `kb.py search` — known pattern skips full cycle.
- **After fix (VALIDATION step 12):** `kb.py add` to both tiers.

---

## 5. App Engine Deployment

### app.yaml (Python 3.11, Standard)
```yaml
runtime: python311
service: my-service
env: standard

instance_class: F2  # or B2 for basic
automatic_scaling:
  min_instances: 1
  max_instances: 10
  target_cpu_utilization: 0.65
  target_throughput_utilization: 0.9

handlers:
- url: /static
  static_dir: static
- url: /.*
  script: auto
```

### Scaling Modes
| Mode | Behavior | Use Case |
|------|----------|----------|
| **Automatic** | Scales with traffic, cold starts on scale-up | Variable traffic |
| **Basic** | Runs 24/7, scales on CPU/requests | Predictable traffic |
| **Manual** | Fixed instance count | Steady traffic, no cold starts |

**Reduce cold starts:** `min_idle_instances: 1`

### Services & Routing (dispatch.yaml)
```yaml
dispatch:
- url: "*/api/*"
  service: api
- url: "*/static/*"
  service: static
```

### IAM & Authentication
```bash
# Deploy with service account
gcloud app deploy --service-account=SA@PROJECT.iam.gserviceaccount.com

# Staging (no promote)
gcloud app deploy -v v1.2 --no-promote

# Rollback
gcloud app versions stop VERSION_ID

# View logs
gcloud app logs tail -s my-service
```

### Environment Variables & Secrets
```yaml
env_variables:
  DEBUG: "0"
# NEVER commit secrets to app.yaml!
```

**Use Secret Manager:**
```yaml
env: flex
beta_settings:
  secrets:
  - name: "projects/PROJECT/secrets/SECRET_NAME"
    version: "latest"
    env: "SECRET_KEY"
```

### Cloud SQL
```python
# Unix socket (recommended)
import os
socket = f"/cloudsql/{os.environ['CONNECTION_NAME']}/.s.PGSQL.5432"
conn = psycopg2.connect(host=socket, ...)

# Or Cloud SQL Connector
from google.cloud.sql import connector
conn = connector.connect("project:region:instance", "pg8000", ...)
```

### CI/CD (Cloud Build)
```yaml
# cloudbuild.yaml
steps:
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  args: ['gcloud', 'app', 'deploy']
```

---

## Cross-Cutting Validation

### Per-Session Checklist
```
[ ] Context loaded (Get "current-task")
[ ] Analysis log exists (.opencode/analysis.md)
[ ] Plan vetted against architecture
[ ] Tasks ≤30 lines, 1 purpose/test/file each
[ ] 10-iteration validation ready
[ ] Knowledge base search done before debug
[ ] Sanitization rules understood
```

### Per-Change Checklist (10-Iteration)
```
[ ] I1: Compile clean (-Werror)
[ ] I2: Format clean (clang-format/ruff)
[ ] I3: Unit tests pass
[ ] I4: Reproducer captured
[ ] I5: Golden test pass
[ ] I6: Fuzz test pass
[ ] I7: Sanitizers clean
[ ] I8: Flow analysis (truth table + data trace)
[ ] I9: Resource audit (alloc/free balance)
[ ] I10: Performance (≤5% regression)
```

### Post-Validation (Step 12 of debug-core)
```
[ ] kb.py add to central + project tier
[ ] Append to .opencode/analysis.md
[ ] ctx.py unload for completed topics
[ ] Sanitization verified
```

---

## Output Report

```
KNOWLEDGE & PROCESS: <phase> STATUS
PHASE: <analysis|context|dev|kb|deploy>
SESSION: <id> | CONTEXT: <topics loaded> | KB: <entries added>
VALIDATION: I1-I10 <passed>/10
ANALYSIS: <findings> critical, <findings> high, <findings> medium
CONTEXT: <stored> entries, <unloaded> topics
KB: <central> + <project> entries
DEPLOY: <service> <version> <status>
BLOCKERS: <unsanitized|missing repro|failed iter|secret in yaml>
```

---

## Boundaries

- Does not write code (receives code to validate/process)
- Does not manage infrastructure beyond App Engine
- Does not replace git history (context tracker supplements)
- `stop knowledge-process`: revert.