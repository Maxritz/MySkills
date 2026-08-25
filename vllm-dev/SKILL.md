---
name: vllm-dev
description: "vLLM: PagedAttention, tensor parallel, Triton."
license: Apache-2.0
compatibility: opencode
---

# vLLM Development

## Architecture

- **Model executor**: `vllm/model_executor/` — HF model loading (`from_pretrained`), custom ops.
- **Worker**: `vllm/worker/worker.py` — runs forward pass on GPU, manages KV cache locally.
- **Scheduler**: `vllm/core/scheduler.py` — priority scheduling, preemption (block swap).
- **Attn backend**: `vllm/attention/` — FlashAttention, xFormers, or custom (FlashInfer).

## PagedAttention

- KV cache stored in GPU blocks (16 tokens/block). `BlockAllocator` manages free blocks.
- `BlockTable` maps logical block IDs to physical GPU block IDs.
- `swap_in` / `swap_out`: move blocks between GPU and CPU when OOM.
- `gpu_cache` and `cpu_cache` are `list[pair[torch.Tensor, torch.Tensor]]` (key, value).
- `max_model_len` parameter sets max context. `block_size=16` default.

## Tensor Parallelism

- `--tensor-parallel-size N` — uses `torch.distributed` + `vllm/distributed/`.
- `ParallelSampler` for data parallel. `ColumnParallelLinear`, `RowParallelLinear` for model parallel.
- `initialize_model_parallel(tp_size, pp_size)` in `vllm/distributed/parallel_state.py`.
- All ranks load full model; weights are sharded at init.

## Quantization Support

- GPTQ: `--quantization gptq` (from `AutoGPTQ`). Load quantized weights via `quantization_config`.
- AWQ: `--quantization awq` — activation-aware weight quantization.
- SqueezeLLaMA / Marlin: `--quantization marlin` — custom CUDA kernels in `vllm/model_executor/layers/quantization/`.
- SmoothQuant: `--quantization smooth_quant` — per-tensor scaling factors.

## Triton Kernels

- Custom kernels in `vllm/model_executor/parallel_layers/...` and `vllm/platforms/triton_utils.py`.
- `triton.autotune` configs for kernel specialization.
- Use `@triton.jit` for attention, activation, and elementwise kernels.
- Compile once: `--enable-prefix-caching` uses cached Triton kernels per context length.

## GPU Memory Management

- `gpu_memory_utilization` (0.0–1.0): fraction of GPU VRAM for KV cache.
- `vllm/platforms/cuda.py`: `get_device` + `get_attn_backend`.
- `torch.cuda.mem_get_info()` to query free/used GPU memory.
- Block table swap: `cpu_cache` (pinned memory) ↔ `gpu_cache`.

## LoRA Support

- `--enable-lora --lora-modules lora1=path1,lora2=path2`.
- `LoRAModel` in `vllm/model_executor/layers/lora/model.py`.
- Adapter weights loaded as 4-bit / 8-bit / FP16.
- `LoraCard`: metadata (rank, alpha, target modules).

## Monitoring

- Prometheus metrics at `/metrics` endpoint (when `--enable-metrics`).
- Key metrics: `vllm:token_throughput`, `vllm:gpu_memory_utilization`, `vllm:num_requests_running`.
- `--disable-log-requests` suppresses per-request logs.
- `VLLM_LOG_LEVEL=DEBUG` for verbose logging.

## Development Flow

1. `pip install -e .` — builds with Triton/CUDA from source.
2. `python setup.py build develop` — or `pip install -e .[dev,test]`.
3. `pytest tests/` — includes prefill/decode, TP, quantization tests.
4. Run: `python -m vllm.entrypoints.openai.api_server --model /path/model --dtype auto`
5. API: `POST /v1/chat/completions`, `POST /v1/completions`.
