---
name: sglang-dev
description: "SGLang: KVCache, parallelism, speculative."
license: MIT
compatibility: opencode
---

# SGLang Development

## Architecture

- **Frontend**: Python (`sglang/` package). Entry point: `sglang/entrypoints/http_server.py`.
- **Backend**: Rust runtime (`sglang-rust/`) for token fusion, KV cache ops, scheduler.
- **Model executor**: `sglang/model_executor/` — HF model loading, attention, sampling.
- **Scheduler**: `sglang/scheduler/` — DP, TP, speculative decoding coordination.

## Key Modules

- `sglang/model_executor/model_pool/`: Per-model forward pass (Llama, Qwen, Gemma, etc.).
- `sglang/speculative/decoding/`: Draft model + verification (Eagle, Medusa).
- `sglang/distributed/`: Tensor parallelism (`--tp-size`), pipeline parallelism.
- `sglang/kernels/`: Custom CUDA/HIP kernels (flashinfer ops, quant kernels).

## KVCache

- `KVCache` in `sglang/kv_cache.py` — manages per-sequence KV states.
- `kv_cache = KVCache(max_num_seqs, max_context_len, num_heads, head_dim, layers)`.
- `kv_cache.can_append_input()`: checks space. `kv_cache.append_input_tokens()`: inserts.
- `kv_cache.set_kv_buffer_at()`. `kv_cache.get_flat_data()`: for tensor parallel transfer.

## Tensor Parallelism

- `--tp-size N` splits attention heads and MLP across N GPUs.
- `sglang/distributed/parallel_state.py` — `initialize_tensor_model_parallel`.
- Each TP rank loads the full model, slices weights. `weight = weight.chunk(tp_size)[rank]`.

## FlashInfer

- FlashAttention-2/Fused attention via `flashinfer`. 
- Install: `pip install flashinfer --index-url https://flashinfer.ai/whl`.
- API: `flash_attn_varlen_qkvpacked_256bit`, `paged_kv_cache`.
- Custom kernels in `sglang/kernels/flashinfer_ops.py`.

## Server API

- HTTP: `POST /generate` — `{model, prompt, sampling_params, stream}`.
- Response: `{"text": "...", "token_ids": [...], "meta_info": {...}}`.
- Use `--port`, `--host`, `--log-level`.
- `--cuda-graph`: captures compute graph for fixed batch sizes (latency ↓ 30-50%).
- `--speculative-draft`: draft model name (e.g., `lms/lms-chat-relation`).

## Profiling

- `SGLANG_PROFILING=1 python -m sglang.benchmark.bench_latency ...`
- `nsys profile` for CUDA kernel-level profiling.
- Memory: `torch.cuda.max_memory_allocated()` — track fragmentation.
- `--cpu-idle`: spin-wait vs block-wait trade-off.

## Development Flow

1. `pip install -e .[dev]` — editable install.
2. `python -m pytest tests/` — unit tests.
3. `python -m sglang.entrypoints.http_server --model /path/model ...`
4. Validate with `curl -X POST http://localhost:30000/generate ...`
