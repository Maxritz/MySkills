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
  |-- writing code        -> cheap endpoint (small local model)
  |-- validation/verify   -> main endpoint (large/costly model)
  |-- security audit      -> cheap endpoint + debug-reference
  |-- numerical proof     -> main endpoint
```

## Endpoint Selection (generic template)
| Task Type | Endpoint | Why |
|-----------|----------|-----|
| Initial draft | small local model (7B-) | Fast, cheap code generation |
| Routing | any router endpoint | Smart routing, cost optimization |
| Complex logic | medium model (7-13B) | Better than small, cheaper than main |
| Verification | main model (GPT-4/Claude) | Cross-check cheap output |
| High-assurance | main + reasoning mode | Security/correctness validation |

## Workflow
1. debug-core step 1 (reproduce) -> debug-domain-router -> "code generation"
2. Route to cheapest endpoint that can handle the task
3. Cheap endpoint writes initial code -> @see analysis-log
4. debug-core step 10 (validate) -> route to main endpoint
5. Main endpoint validates + consolidates -> @see knowledge-base if bug/fix found

## Endpoint Config (never committed — gitignored)
Store at `~/.config/opencode/models/pool.json` (add to .gitignore):
```json
{
  "write_endpoints": [{"name":"gemma-local","base_url":"http://localhost:8080","cost":0.0005}],
  "verify_endpoints": [{"name":"main","base_url":"https://api.example.com/v1","cost":0.03}]
}
```
Configure your own endpoints here. Keys never committed. @see knowledge-base sanitization.

## Sanitization (critical)
@see knowledge-base sanitization rules. Never commit API keys, endpoints,
or personal URLs. Pool config loaded only at runtime.
