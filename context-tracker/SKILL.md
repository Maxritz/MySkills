---
name: context-tracker
description: "Local context store: save/summarize/retrieve. No reload."
license: MIT
compatibility: opencode
metadata:
  auto_trigger: true
---

# Context Tracker

## Local Context Store

Store session context on disk — never reload full conversation from context window.

### Storage Layout
```
~/.config/opencode/contexts/
├── {topic}.json     # summary + key points + refs
├── {topic}.link     # pointer to related contexts
└── _index.json      # topic → file mapping (tiny lookup)
```

### Context Entry Format (JSON)
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

**Save/Update** (append-style, idempotent):
```
Save {topic}: "{new info}" → append to existing summary, update refs, bump timestamp.
Max 500 tokens per entry. Older details archived to `{topic}.history`.
```

**Retrieve**:
```
Get {topic} → read {topic}.json → return summary (≤500 tokens).
Search "gguf" → fuzzy match topic names → show top 3 summaries.
```

### Rules

- Every new insight appended as `key_points` entry — never rewrite history.
- Summary capped at 500 tokens. If overflow, trim oldest `key_points`.
- References are `file:line` — direct jump target.
- `_index.json` always loaded (small): `{"gguf-parser": "gguf-parser.json", "cuda-tune": "cuda-tune.json"}`.

### Usage Flow

1. At session start: `Get "current-task"` → load prior context.
2. After each significant step: `Save {topic}: "{what was learned}"`.
3. Before asking user: `Get {related_topics}` → avoid redundant explanation.
4. Context grows incrementally, not by re-reading full logs.
5. **After task completion: `Unload {topic}`** → remove from context, keep 1-line summary.
   `ctx.py unload debug-localize` stores: "debug-localize: applied, validated. 42 tokens freed."
   Use `@see debug-core:Auto-Skill-Unload` for unload protocol.

**Always-on** (auto_trigger). Every code change triggers a `Save` call.
