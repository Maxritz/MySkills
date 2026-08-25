---
name: knowledge-base
description: "Two-tier bug/fix KB: central (cross-project) + project (.opencode/knowledge.md, ships with code)."
license: MIT
compatibility: opencode
metadata:
  auto_trigger: true
  priority: high
---

# Knowledge Base (Bugs + Fixes)

## Two-Tier Layout

```
~/.config/opencode/knowledge/     CENTRAL — total knowledge, all projects, never committed
  kb.py                           CLI: add / search / list / export
  _index.json                     topic -> file map (tiny)
  {category}/{slug}.json          one entry per bug/fix

.opencode/knowledge.md            PROJECT-SPECIFIC — ships with the code
.opencode/analysis.md             project analysis log (@see analysis-log)
```

## Entry Format (central JSON)

```json
{
  "id": "gguf-block-size-misalign",
  "category": "gguf",
  "bug": "quantize_q4_0 crashes with n=50",
  "root_cause": "n not multiple of block_size=32",
  "fix": "validate n % block_size == 0 at caller boundary; reject or pad",
  "pattern": "always validate block-multiple at API boundary before loop",
  "refs": ["src/tensor.c:87"],
  "tags": ["gguf", "q4_0", "bounds"],
  "project": "sglangC99",
  "date": "2026-08-26"
}
```

## Workflow

1. **Bug fixed + validated** (debug-core step 12) -> document BOTH tiers:
   - `kb.py add --category gguf --bug "..." --cause "..." --fix "..." --pattern "..."`
   - Append same entry to `.opencode/knowledge.md` (ships with code).
2. **Before debugging anything new**: `kb.py search <symptom keyword>` ->
   if a known pattern matches, skip straight to that hypothesis. Saves a full debug cycle.
3. **New session/project start**: search central KB by domain tag before analysis.

## Sanitization (mandatory, both tiers)

Before any write, strip:
- Personal paths: `/home/*`, `/Users/*`, `C:\Users\*` -> `~/project/`
- Keys/tokens: `sk-*`, `ghp_*`, `AKIA*`, `password=*`, `secret=*` -> `[REDACTED]`
- Emails `*@*.*` -> `[REDACTED-EMAIL]`; phones `[0-9]{3}-[0-9]{3}-[0-9]{4}` -> `[REDACTED-PHONE]`

Never write credentials, endpoints with auth, or machine names.

## Token Rules

- Entries are 100-200 tokens each; **never load the whole KB**.
- Search returns top 3 matches only.
- Project `.opencode/knowledge.md` uses same append-only rule as analysis-log;
  grep by tag instead of full re-read.

## Validation

- [ ] Central entry exists after every confirmed fix
- [ ] Project knowledge.md appended in sync
- [ ] No unsanitized paths/keys/emails/phones in either tier
- [ ] `kb.py search` returns <= 3 results per query
