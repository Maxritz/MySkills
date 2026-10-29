---
name: llm-core
description: "LLM core components: tokenizer, embeddings, attention, KV cache, MLP, sampling. Deterministic reference, intermediate validation, numerical tolerances. Foundational LLM building blocks."
compatibility: opencode
---
# LLM Core Components

Use this skill to implement or validate tokenisation, embeddings, attention, KV cache, MLP and sampling. Check intermediate tensors before judging end-to-end generations.

## Component routing

| Component | Contract that must be preserved | Load detail when |
|---|---|---|
| Tokenisation | Exact token IDs, special tokens, offsets where required | Changing tokenizer, chat template or prompt path |
| Embeddings/norm | Shape, dtype, vocabulary bounds, normalisation axes | Porting or fusing embedding/norm kernels |
| Attention/RoPE | Head layout, causal/padding masks, positions, scaling and GQA mapping | Changing attention or position handling |
| KV cache | Append/read index, page/block mapping, dtype, bounds and eviction | Changing cache layout, paging or decode |
| MLP | Gate/up/down shapes, activation and residual placement | Fusing, quantising or porting feed-forward code |
| Sampling | Temperature, logits processors, masks, seed, stop conditions | Replacing sampler or changing decoding behaviour |

Detailed contracts, formulas, code patterns and per-component validation: [component recipes](references/component-recipes.md). Load only relevant sections.

## Shared correctness gates

1. Pin model configuration, tokenizer, weights/revision, runtime and dtype.
2. Compare token IDs and intermediate tensors against a trusted reference before comparing generated text.
3. Cover empty/minimum/maximum shapes, batch/sequence boundaries, masks, positions, cache wrap/page boundaries and invalid inputs relevant to the change.
4. Make numerical tolerances component- and dtype-specific; justify tolerances, never widen them only to hide a mismatch.
5. Test deterministic inputs/seeds where supported, then test end-to-end prompt → prefill → decode → stop/stream completion.
6. Separate implementation mismatch, quantisation drift, sampling randomness and reference-version differences.

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

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Validate each component at intermediate tensors before end-to-end generation: tokenizer IDs, masks, RoPE positions, KV-cache writes/reads, norm/MLP outputs and sampling. Pin model config and compare deterministic fixtures with explicit dtype-aware tolerances.


## Boundaries

- Does not serve models (see `llm-serving`)
- Does not convert formats (see `model-formats`)
- Does not optimise kernels (see `amd-gpu-stack`/`nvidia-cuda-stack`/`llm-hardcode`)
- Does not cover MoE or speculative decoding (see `llm-advanced`)
- `stop llm-core`: revert.