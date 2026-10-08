---
name: llm-core
description: "LLM core components: tokenizer, embeddings, attention, KV cache, MLP, sampling. Deterministic reference, intermediate validation, numerical tolerances. Foundational LLM building blocks."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  trigger_keywords: ["tokenizer", "embeddings", "attention", "KV cache", "MLP", "sampling", "LLM component", "intermediate tensor", "logits"]
---

# LLM Core Components

**Foundational LLM building blocks. Treat each subsystem as an explicit contract: token IDs, shapes, dtype, device, cache layout, masking, randomness, stop behavior. Freeze a deterministic reference; validate intermediates.**

---

## Component Contract Template

Every component must define:

```python
COMPONENT_CONTRACT = {
    "name": "attention",
    "inputs": {
        "hidden_states": {"shape": "[B, S, H]", "dtype": "fp16/bf16"},
        "position_ids": {"shape": "[B, S]", "dtype": "int64"},
        "attention_mask": {"shape": "[B, 1, S, S]", "dtype": "bool/fp16"},
        "kv_cache": {"shape": "[L, 2, B, H, S, D]", "dtype": "fp16"},
    },
    "outputs": {
        "hidden_states": {"shape": "[B, S, H]", "dtype": "fp16/bf16"},
        "kv_cache": {"updated": True},
    },
    "invariants": [
        "causal_mask: attn[i,j] = 0 for j > i",
        "rope: applied per-head, per-position",
        "kv_cache: append-only, no overwrite",
    ],
    "tolerances": {
        "fp16": {"rtol": 1e-3, "atol": 1e-3},
        "bf16": {"rtol": 1e-2, "atol": 1e-2},
        "int8": {"rtol": 1e-1, "atol": 1e-1},
    },
}
```

---

## 1. Tokenization

### Contract

```python
TOKENIZER_CONTRACT = {
    "encode(text: str) -> List[int]": "Deterministic, no randomness",
    "decode(tokens: List[int]) -> str": "Lossless round-trip for valid tokens",
    "vocab_size": "int (e.g., 32000, 128256)",
    "special_tokens": {"bos": 1, "eos": 2, "pad": 0, "unk": 3},
    "byte_fallback": True,  # For BPE/Unigram
}
```

### Validation

```python
def validate_tokenizer(tokenizer, test_cases):
    for text in test_cases:
        tokens = tokenizer.encode(text)
        decoded = tokenizer.decode(tokens)
        re_tokens = tokenizer.encode(decoded)
        assert tokens == re_tokens, f"Round-trip failed: {tokens} != {re_tokens}"
    
    assert tokenizer.encode("<|endoftext|>") == [tokenizer.eos_token_id]
    assert tokenizer.decode([tokenizer.bos_token_id]) == "<|beginoftext|>"
```

### Common Tokenizers

| Model | Type | Vocab | Special |
|-------|------|-------|---------|
| LLaMA 2/3 | BPE (SentencePiece) | 32K/128K | BOS=1, EOS=2 |
| Qwen | BPE (tiktoken) | 151K | BOS=151643, EOS=151645 |
| Gemma | BPE (SentencePiece) | 256K | BOS=2, EOS=1 |
| Phi-3 | BPE (tiktoken) | 320K | BOS=1, EOS=32000 |

---

## 2. Embeddings

### Contract

```python
EMBEDDING_CONTRACT = {
    "input": {"token_ids": "[B, S]", "dtype": "int64"},
    "output": {"hidden_states": "[B, S, H]", "dtype": "fp16/bf16"},
    "weight": {"shape": "[V, H]", "dtype": "fp16/bf16"},
    "invariants": [
        "out[b, s, :] == weight[token_ids[b, s], :]",
        "padding_idx (if any) → zeros",
    ],
}
```

### Implementation Patterns

```python
# Standard
hidden_states = F.embedding(token_ids, weight, padding_idx=pad_id)

# Fused (with LayerNorm, e.g., LLaMA RMSNorm)
hidden_states = F.embedding(token_ids, weight)
hidden_states = rms_norm(hidden_states, weight=ln_weight, eps=1e-6)
```

### Validation

```python
def validate_embeddings(weight, token_ids, expected_out):
    out = F.embedding(token_ids, weight)
    assert_close(out, expected_out, rtol=1e-3, atol=1e-3)
    if pad_id is not None:
        pad_mask = (token_ids == pad_id)
        assert (out[pad_mask] == 0).all()
```

---

## 3. Attention

### Contract (Multi-Head / Grouped-Query / Multi-Query)

```python
ATTENTION_CONTRACT = {
    "inputs": {
        "q": "[B, S, H_q]", "k": "[B, S, H_k]", "v": "[B, S, H_v]",
        "mask": "[B, 1, S, S] or [B, H, S, S]",
        "rope": {"cos": "[S, D/2]", "sin": "[S, D/2]"},
        "kv_cache": "[L, 2, B, H, S_kv, D]",
    },
    "outputs": {
        "out": "[B, S, H_q]",
        "kv_cache": "updated",
    },
    "invariants": [
        "Causal: attn[b, h, i, j] = 0 for j > i + past_len",
        "RoPE: q_rot = q * cos + rotate_half(q) * sin",
        "GQA: k/v heads repeated to match q heads",
        "Softmax: row-sum = 1 (before mask), 0 (masked)",
    ],
}
```

### Variants

| Variant | Q Heads | K/V Heads | Example |
|---------|---------|-----------|---------|
| **MHA** | 32 | 32 | LLaMA-1, GPT-3 |
| **GQA** | 32 | 8 | LLaMA-2, Mistral |
| **MQA** | 32 | 1 | PaLM, Falcon |

### Implementation (FlashAttention-2)

```python
def flash_attention(q, k, v, mask=None, causal=True, scale=None):
    # q: [B, H, S, D], k/v: [B, H_kv, S, D]
    # Tile size: Br=128, Bc=128 (H100), 64 (A100)
    # Online softmax: l = rowmax, d = rowsum
    # Backward: recompute S from O, L
    return flash_attn_func(q, k, v, mask, causal, scale)
```

### Validation

```python
def validate_attention(q, k, v, mask, expected_out, kv_cache=None):
    scores = torch.matmul(q, k.transpose(-2, -1)) * scale
    if mask is not None:
        scores = scores.masked_fill(mask == 0, -1e9)
    attn = F.softmax(scores, dim=-1)
    ref_out = torch.matmul(attn, v)
    
    if causal:
        S = q.shape[-2]
        causal_mask = torch.triu(torch.ones(S, S), diagonal=1).bool()
        assert (attn[:, :, causal_mask] == 0).all()
    
    assert (attn.sum(-1) - 1.0).abs().max() < 1e-3
    assert_close(flash_out, ref_out, rtol=1e-3, atol=1e-3)
```

---

## 4. KV Cache

### Contract

```python
KV_CACHE_CONTRACT = {
    "layout": "[L, 2, B, H, S, D]",
    "update": "append new tokens at sequence dimension",
    "invariants": [
        "Cache never shrinks during generation",
        "Position matches token index",
        "No overwrite of existing entries",
    ],
    "operations": {
        "append": "kv_cache[layer, 0, :, :, cur_len:cur_len+new_len] = k",
        "get": "kv_cache[layer, :, :, :seq_len]",
        "clear": "reset cur_len = 0",
    },
}
```

### PagedAttention (vLLM/SGLang)

```python
class PagedKVCache:
    def __init__(self, num_blocks, block_size, num_layers, num_heads, head_dim, dtype):
        self.blocks = torch.zeros(num_blocks, block_size, 2, num_layers, num_heads, head_dim, dtype=dtype)
        self.block_tables = {}  # seq_id -> List[block_id]
        self.free_blocks = list(range(num_blocks))
    
    def append(self, seq_id, k, v):
        pass
    
    def swap_in(self, seq_id, cpu_blocks):
        pass
    
    def swap_out(self, seq_id, num_blocks):
        pass
```

### Validation

```python
def validate_kv_cache(cache, layer, seq_len, expected_k, expected_v):
    actual_k = cache[layer, 0, :, :, :seq_len]
    actual_v = cache[layer, 1, :, :, :seq_len]
    assert_close(actual_k, expected_k)
    assert_close(actual_v, expected_v)
    assert cache[layer, 0, :, :, seq_len:].abs().sum() == 0
```

---

## 5. MLP (SwiGLU)

### Contract

```python
MLP_CONTRACT = {
    "input": "[B, S, H]",
    "output": "[B, S, H]",
    "weights": {
        "gate_proj": "[H, 4H]",
        "up_proj": "[H, 4H]",
        "down_proj": "[4H, H]",
    },
    "activation": "SiLU(x) = x * sigmoid(x)",
    "formula": "down(silu(gate(x)) * up(x))",
    "invariants": ["gate/up can be fused", "down is linear"],
}
```

### Validation

```python
def validate_mlp(gate_proj, up_proj, down_proj, input, expected_out):
    gate = F.silu(input @ gate_proj.T)
    up = input @ up_proj.T
    out = (gate * up) @ down_proj.T
    assert_close(out, expected_out, rtol=1e-3, atol=1e-3)
```

---

## 6. Sampling

### Contract

```python
SAMPLING_CONTRACT = {
    "inputs": {
        "logits": "[B, V]",
        "temperature": "float > 0",
        "top_p": "float in (0, 1]",
        "top_k": "int >= 0",
        "min_p": "float >= 0",
        "repetition_penalty": "float >= 1.0",
        "seed": "int (deterministic)",
    },
    "output": {"token_ids": "[B]", "logprobs": "[B] optional"},
    "invariants": [
        "temp=0 → argmax (greedy)",
        "top_p: cumulative prob ≤ p, then renormalize",
        "top_k: keep top k, zero rest, renormalize",
        "repetition_penalty: logits[prev_tokens] /= penalty",
        "Same seed + same logits → same token",
    ],
}
```

### Implementation

```python
def sample(logits, temperature=1.0, top_p=1.0, top_k=0, min_p=0.0, repetition_penalty=1.0, prev_tokens=None, seed=0):
    gen = torch.Generator(device=logits.device).manual_seed(seed)
    
    if repetition_penalty != 1.0 and prev_tokens is not None:
        for b in range(logits.shape[0]):
            logits[b, prev_tokens[b]] /= repetition_penalty
    
    if temperature > 0:
        logits = logits / temperature
        probs = F.softmax(logits, dim=-1)
    else:
        probs = F.one_hot(logits.argmax(-1), logits.shape[-1]).float()
    
    if top_k > 0:
        topk_probs, topk_idx = probs.topk(top_k, dim=-1)
        mask = torch.zeros_like(probs).scatter_(-1, topk_idx, 1)
        probs = probs * mask
        probs = probs / probs.sum(-1, keepdim=True)
    
    if top_p < 1.0:
        sorted_probs, sorted_idx = probs.sort(descending=True)
        cumsum = sorted_probs.cumsum(-1)
        mask = cumsum <= top_p
        mask[..., 1:] = mask[..., :-1].clone()
        mask[..., 0] = True
        sorted_probs = sorted_probs * mask
        probs = torch.zeros_like(probs).scatter_(-1, sorted_idx, sorted_probs)
        probs = probs / probs.sum(-1, keepdim=True)
    
    if min_p > 0:
        max_prob = probs.max(-1, keepdim=True).values
        mask = probs >= min_p * max_prob
        probs = probs * mask
        probs = probs / probs.sum(-1, keepdim=True)
    
    token = torch.multinomial(probs, 1, generator=gen).squeeze(-1)
    logprob = torch.log(probs.gather(-1, token.unsqueeze(-1))).squeeze(-1)
    return token, logprob
```

### Validation

```python
def validate_sampling():
    logits = torch.randn(10, 1000)
    
    t1, _ = sample(logits, seed=42)
    t2, _ = sample(logits, seed=42)
    assert (t1 == t2).all()
    
    t_greedy, _ = sample(logits, temperature=0)
    assert (t_greedy == logits.argmax(-1)).all()
    
    t_topk, _ = sample(logits, top_k=10)
    assert (t_topk < 10).all()
    
    samples = torch.stack([sample(logits, temperature=1.0, seed=i)[0] for i in range(10000)])
    emp_dist = samples.bincount(minlength=1000).float() / 10000
    true_dist = F.softmax(logits[0], dim=-1)
    kl = (emp_dist * (emp_dist / true_dist).log()).sum()
    assert kl < 0.01
```

---

## Numerical Tolerances (Core Components)

| Component | FP16 | BF16 | INT8 (weight-only) | INT4 (AWQ/GPTQ) |
|-----------|------|------|-------------------|-----------------|
| **Embeddings** | 1e-3 | 1e-2 | 1e-1 | 5e-1 |
| **Attention** | 1e-3 | 1e-2 | 1e-1 | 5e-1 |
| **MLP** | 1e-3 | 1e-2 | 1e-1 | 5e-1 |
| **LayerNorm/RMSNorm** | 1e-4 | 1e-3 | 1e-2 | 1e-1 |
| **Sampling** | exact | exact | exact | exact |
| **Logits (final)** | 1e-3 | 1e-2 | 1e-1 | 5e-1 |

---

## Output Report

```
LLM CORE: <component> VALIDATION
COMPONENT: <tokenizer|embeddings|attention|kv_cache|mlp|sampling>
CONTRACT: <inputs/outputs/invariants defined>
REFERENCE: <HF model / custom impl>
TOLERANCE: <fp16/bf16/int8/int4>
INTERMEDIATES: <validated>/<total> (<max diff>)
DETERMINISM: <seed=42 reproduced ✅/❌>
BLOCKERS: <list>
```

---

## Boundaries

- Does not serve models (see `llm-serving`)
- Does not convert formats (see `model-formats`)
- Does not optimise kernels (see `amd-gpu-stack`/`nvidia-cuda-stack`/`llm-hardcode`)
- Does not cover MoE or speculative decoding (see `llm-advanced`)
- `stop llm-core`: revert.