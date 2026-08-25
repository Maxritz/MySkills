---
name: tensorrt-llm-dev
description: "TensorRT-LLM: C++ engine, quantization, tensor parallel."
license: NVIDIA Source Code License
compatibility: opencode
---

# TensorRT-LLM Development

## Architecture

- **C++ core**: `cpp/` — model executor, attention plugins, KV cache, scheduler.
- **Python build**: `examples/` + `scripts/` — quantization scripts, model builder.
- **TRT engine**: `tensorrt_llm/build.py` — compiles HF model → TRT engine (`.engine`).
- **Serving**: `triton_python_backend/` — Triton Inference Server backend.

## Engine Build Pipeline

```python
from tensorrt_llm import BuildConfig, build
from tensorrt_llm.models import LLaMAForCausalLM

model = LLaMAForCausalLM.from_hugging_face("meta-llama/Llama-2-7b-hf")
config = BuildConfig(
    max_batch_size=32,
    max_input_len=2048,
    max_output_len=512,
    dtype="float16",
    tensor_parallelism=4,
    quant_algo="fp8",  # or "int8", "int4"
)
engine = build(model, config)
engine.save("llama2-7b-fp8-tp4")
```

## Quantization

- **FP8**: `--quant_algo fp8` — requires H100/Tensor Core. `fp8_mode=fp8` in `BuildConfig`.
- **INT8**: `--quant_algo int8` — weight-only or smoothquant (activation-aware).
- **INT4**: AWQ (Activation-aware Weight Quantization) — `int4_weight_only=True`.
- **SmoothQuant**: `--smoothquant 0.5` — scales weights and activations.
- Quantization scripts in `examples/quantization/`.

## Tensor Parallelism

- `--tensor_parallel_size N` or `tensor_parallelism=N` in `BuildConfig`.
- Uses `nccl` for inter-GPU communication. `MPI_COMM_WORLD` for multi-node.
- TP splits QKV projection and MLP across GPUs. Each shard has full vocab.
- `LLAMA_FOR_CAUSAL_LM.build_config` handles TP sharding automatically.

## Paged KV Cache

- `paged_state=True` in `BuildConfig` — dynamic KV cache allocation.
- Manages blocks (pages) of KV cache, like vLLM's PagedAttention.
- Reduces GPU memory waste from over-allocation.
- `--enable_pagecount` for monitoring.

## Speculative Decoding

- Draft model + target model. `--medusa_num_heads` for Medusa-style.
- `--speculative_decoding` flag. Draft model must be smaller (e.g., 300M draft).
- `DraftTargetMode` in builder config. Accepted/rejected by target model.

## Benchmarks

```bash
# Perplexity
python examples/eval.py --engine_dir=./engines --dataset=wikitext2

# Latency
python examples/benchmark.py --engine_dir=./engines --num_requests=100 --input_len=512 --output_len=128

# Throughput
python examples/benchmark.py --engine_dir=./engines --batch_size=32
```

## Triton Backend

- `/model_repository/` with versioned directories.
- `config.pbtxt` — `parameters: {key: "engine_dir" value: {"string_value": "/engines/llama2-7b"}}`.
- `model.py` — Triton Python backend wrapping TRT-LLM engine.
- Supports streaming, beam search, constrained decoding.

## Plugin System

- Custom attention: `AttentionWithRelativePositionBias` plugin in `cpp/tensorrt/plugins/`.
- LayerNorm, RMSNorm, SiLU, GELU fused kernels.
- Build with `python setup.py install` or `pip install -r requirements.txt`.
