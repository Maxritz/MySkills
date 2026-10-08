---
name: llm-advanced
description: "LLM advanced components: MoE (router, expert capacity, shared experts), speculative decoding (standard, Medusa, EAGLE, Lookahead), numerical tolerances per component per precision. Advanced/specialised LLM subsystems."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  trigger_keywords: ["MoE", "Mixture of Experts", "speculative decoding", "Medusa", "EAGLE", "router", "expert", "shared experts", "numerical tolerances", "INT4", "AWQ", "GPTQ"]
---

# LLM Advanced Components

**Advanced/specialised LLM subsystems: Mixture of Experts, speculative decoding, extended numerical tolerances.**

---

## 1. Mixture of Experts (MoE)

### Contract (Mixtral, DeepSeekMoE)

```python
MOE_CONTRACT = {
    "input": "[B, S, H]",
    "output": "[B, S, H]",
    "router": {"weight": "[H, E]", "top_k": 2},  # E=experts
    "experts": E * {"gate_proj": "[H, I]", "up_proj": "[H, I]", "down_proj": "[I, H]"},
    "shared_experts": "optional, always active",
    "invariants": [
        "router logits: softmax → top-k → normalize",
        "expert capacity: floor(tokens * capacity_factor / E)",
        "dropped tokens: reroute or zero",
    ],
}
```

### Validation

```python
def validate_moe(router_weight, experts, input, expected_out):
    logits = input @ router_weight.T  # [B, S, E]
    probs = F.softmax(logits, dim=-1)
    topk_probs, topk_idx = probs.topk(2, dim=-1)
    topk_probs = topk_probs / topk_probs.sum(-1, keepdim=True)
    
    out = torch.zeros_like(input)
    for e in range(num_experts):
        mask = (topk_idx == e).any(-1)
        if mask.any():
            expert_in = input[mask]
            expert_out = experts[e](expert_in)
            out[mask] += expert_out * topk_probs[mask, topk_idx[mask] == e].sum(-1, keepdim=True)
    
    assert_close(out, expected_out, rtol=1e-3)
```

### Key Considerations

- **Router**: Must be deterministic with fixed seed
- **Expert capacity**: Prevents OOM by limiting tokens per expert
- **Dropped tokens**: Must be handled (reroute or zero)
- **Shared experts**: Always active, bypass router

---

## 2. Speculative Decoding

### Contract

```python
SPECULATIVE_CONTRACT = {
    "draft_model": "smaller model (e.g., 300M → 7B target)",
    "num_draft_tokens": "gamma (typically 4-8)",
    "verification": "target model scores draft tokens",
    "acceptance": "accept prefix until first reject, then resample",
    "invariants": [
        "Output distribution matches target model exactly",
        "Speedup = accepted_drafts / total_drafts",
        "No quality degradation vs pure target",
    ],
}
```

### Algorithms

| Algorithm | Draft | Verification | Speedup |
|-----------|-------|--------------|---------|
| **Standard** | Small model | Target scores all | 1.5-2x |
| **Medusa** | Heads on target | Target scores all | 2-2.5x |
| **EAGLE** | Feature-based | Target scores all | 2.5-3x |
| **Lookahead** | No draft (self) | N/A | 1.2-1.5x |

### Validation

```python
def validate_speculative(draft, target, prompts, num_draft=4):
    for prompt in prompts:
        spec_tokens = speculative_generate(draft, target, prompt, num_draft)
        target_tokens = target.generate(prompt)
        assert spec_tokens == target_tokens, "Speculative ≠ target output"
    
    import time
    t0 = time.time()
    speculative_generate(draft, target, prompt, num_draft)
    t1 = time.time()
    target.generate(prompt)
    t2 = time.time()
    speedup = (t2 - t1) / (t1 - t0)
    assert speedup > 1.3, f"Speedup {speedup:.2f}x insufficient"
```

### Key Considerations

- **Distribution equivalence**: Must match target exactly
- **Verification cost**: Target model must score all draft tokens
- **Acceptance rate**: Determines actual speedup
- **Memory**: Draft model adds VRAM overhead

---

## 3. Extended Numerical Tolerances (Per Component, Per Precision)

| Component | FP16 | BF16 | INT8 (weight-only) | INT4 (AWQ/GPTQ) |
|-----------|------|------|-------------------|-----------------|
| **Embeddings** | 1e-3 | 1e-2 | 1e-1 | 5e-1 |
| **Attention** | 1e-3 | 1e-2 | 1e-1 | 5e-1 |
| **MLP** | 1e-3 | 1e-2 | 1e-1 | 5e-1 |
| **MoE Router** | 1e-4 | 1e-3 | 1e-2 | — |
| **LayerNorm/RMSNorm** | 1e-4 | 1e-3 | 1e-2 | 1e-1 |
| **Sampling** | exact | exact | exact | exact |
| **Logits (final)** | 1e-3 | 1e-2 | 1e-1 | 5e-1 |

### Quantisation-Specific Notes

- **INT8 weight-only**: Activations remain FP16/BF16
- **AWQ**: Activation-aware, preserves outlier weights
- **GPTQ**: Post-training, layer-wise calibration
- **SmoothQuant**: Moves outliers from activations to weights

---

## 4. Validation Framework for Advanced Components

### MoE Validation Checklist

- [ ] Router determinism (fixed seed → same routing)
- [ ] Expert capacity respected (no OOM)
- [ ] Dropped tokens handled (not silently lost)
- [ ] Shared experts always active
- [ ] Load balancing (router entropy > threshold)
- [ ] Differential test vs reference (rtol/atol per table)

### Speculative Decoding Checklist

- [ ] Distribution equivalence (exact match vs pure target)
- [ ] Acceptance rate measured and logged
- [ ] Speedup > 1.3x on target hardware
- [ ] No quality regression (perplexity, benchmarks)
- [ ] Memory overhead documented (draft model VRAM)

---

## Output Report

```
LLM ADVANCED: <component> VALIDATION
COMPONENT: <moe|speculative|tolerances>
CONTRACT: <inputs/outputs/invariants defined>
REFERENCE: <HF model / custom impl>
TOLERANCE: <fp16/bf16/int8/int4 per component>
INTERMEDIATES: <validated>/<total> (<max diff>)
DETERMINISM: <seed=42 reproduced ✅/❌>
BLOCKERS: <list>
```

---

## Boundaries

- Does not serve models (see `llm-serving`)
- Does not convert formats (see `model-formats`)
- Does not optimise kernels (see `amd-gpu-stack`/`nvidia-cuda-stack`/`llm-hardcode`)
- Does not cover core components (see `llm-core`)
- `stop llm-advanced`: revert.