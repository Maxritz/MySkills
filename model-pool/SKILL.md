---
name: model-pool
description: "API endpoint pool: cheap writers + main verifier. Debug-routed."
license: MIT
compatibility: opencode
metadata:
  auto_trigger: false
---

# Model Pool (API Endpoint Routing)
@see debug-domain-router: routes domain -> endpoint pool.
@see debug-core for validation loop. @see knowledge-base for sanitization.

## Pool Architecture
```
debug-domain-router ("what domain?")
  |-- writing code        -> cheap endpoint (gemma-2b, phi-3-mini, qwen3-0.6b, nara)
  |-- validation/verify   -> main endpoint (gpt-4o, claude-3-5-sonnet, nara-premium)
  |-- security audit      -> cheap endpoint + debug-reference
  |-- numerical proof     -> main endpoint
```

## Endpoint Selection
| Task Type | Endpoint | Why |
|-----------|----------|-----|
| Initial draft | `gemma-2b-it` / `phi-3-mini` / `qwen3-0.6b` | Fast, cheap code generation |
| Routing | `nara` (router.bynara.id) | Smart routing, cost optimization |
| Complex logic | `deepseek-coder-7B` | Better than gemma but cheaper than main |
| Verification | `gpt-4o` or `claude-3-5-sonnet` | Cross-check cheap output |
| High-assurance | `nara-premium` or `o1` | Security/correctness validation |

## Nara Integration
`nara` routes to the cheapest capable model automatically:
- POST to `https://router.bynara.id/v1/chat/completions`
- Key stored only in runtime config (`~/.config/opencode/models/pool.json`, gitignored)
- @see knowledge-base sanitization — keys never committed, never in skills

## Workflow
1. `debug-core` step 1 (reproduce) -> debug-domain-router -> "code generation"
2. Route to cheapest endpoint that can handle the task
3. Cheap endpoint writes initial code -> @see analysis-log
4. `debug-core` step 10 (validate) -> route to main endpoint
5. Main endpoint validates + consolidates -> @see knowledge-base if bug/fix found

## Endpoint Config (never committed)
Store in `~/.config/opencode/models/pool.json` (gitignored):
```json
{
  "write_endpoints": [{"name":"gemma-2b","base_url":"http://localhost:8080","cost":0.001},
                      {"name":"phi-3-mini","base_url":"http://localhost:8081"}],
  "verify_endpoints": [{"name":"main","base_url":"https://api.openai.com/v1","cost":0.03}]
}
```

## Sanitization (critical)
@see knowledge-base sanitization rules — never commit API keys/endpoints.
Pool config loaded at runtime from `~/.config/opencode/models/pool.json`.
@see knowledge-base for secret stripping on every write.
