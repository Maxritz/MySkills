# LLM Serving: Model-Pool Routing

Load when implementing endpoint routing, health/failure policy or cost-aware orchestration. Keep credentials out of the example configuration and verify actual serving APIs/flags against installed versions.

## 4. Model Pool (Endpoint Routing)

### Architecture
```
Request → debug-domain-router → Route
  ├─ Code generation (cheap) → Small local model (7B-)
  ├─ Validation/verify       → Main endpoint (GPT-4/Claude/70B+)
  ├─ Security audit          → Cheap + debug-reference
  └─ Numerical proof         → Main endpoint
```

### Configuration (`~/.config/opencode/models/pool.json` - gitignored)
```json
{
  "write_endpoints": [
    {"name": "gemma-2b-local", "base_url": "http://localhost:8080", "cost_per_1k": 0.0001, "max_tokens": 2048},
    {"name": "phi-3-mini-local", "base_url": "http://localhost:8081", "cost_per_1k": 0.0002, "max_tokens": 4096}
  ],
  "verify_endpoints": [
    {"name": "gpt-4o", "base_url": "https://api.openai.com/v1", "cost_per_1k": 0.03, "model": "gpt-4o"},
    {"name": "claude-3-opus", "base_url": "https://api.anthropic.com/v1", "cost_per_1k": 0.075, "model": "claude-3-opus"},
    {"name": "llama3-70b-local", "base_url": "http://localhost:8000", "cost_per_1k": 0.001, "model": "llama-3-70b"}
  ],
  "routing_rules": {
    "code_generation": "write_endpoints",
    "validation": "verify_endpoints",
    "security_audit": ["write_endpoints", "debug-reference"],
    "numerical_proof": "verify_endpoints"
  }
}
```

### Routing Logic
```python
def route_request(task_type, prompt, context):
    if task_type == "code_generation":
        endpoint = select_cheapest(write_endpoints)
        response = call_endpoint(endpoint, prompt)
        # Log for verification
        log_to_analysis(response, endpoint.name)
        return response
    
    elif task_type == "validation":
        # Route to main endpoint for cross-check
        endpoint = select_best(verify_endpoints)
        return call_endpoint(endpoint, prompt)
    
    # ... other rules
```

---
