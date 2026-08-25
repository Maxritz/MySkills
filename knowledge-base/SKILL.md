---
name: knowledge-base
description: "Two-tier bug/fix KB: central + project. Sanitized. No leaks."
license: MIT
compatibility: opencode
metadata:
  auto_trigger: true
  priority: high
---

# Knowledge Base
@see debug-core:12 (document after VALIDATION). @see analysis-log.

## Two Tiers
- **Central** `~/.config/opencode/knowledge/{cat}/{slug}.json` — cross-project, never committed
- **Project** `.opencode/knowledge.md` — appendix to code, append-only table

## Entry (sanitized JSON)
```json
{"category":"gguf","bug":"q4_0 crash n=50","root_cause":"n%32!=0","fix":"validate boundary","pattern":"check block-multiple","tags":["gguf","bounds"]}
```

## CLI
```bash
kb.py add --category gguf --bug "..." --cause "..." --fix "..." --pattern "..." --tags gguf
kb.py search "block size"     # max 3 results
```
Before debugging: search first — known pattern skips full cycle.

## Sanitization (both tiers, every write)
`C:\Users\*`, `/home/*`, `/Users/*` -> `~/project/`
`sk-*`, `ghp_*`, `AKIA*`, `password=*`, `secret=*` -> `[REDACTED]`
emails -> `[REDACTED-EMAIL]`, phones -> `[REDACTED-PHONE]`

No credentials/endpoints/machine names persisted. @see KB-001.

## Validation
- [ ] Central + project entry after each fix
- [ ] `kb.py search` max 3 results
- [ ] No unsanitized secrets (test_knowledge_base.py:6 pass)
