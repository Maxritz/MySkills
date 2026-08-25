---
name: llamacpp-dev
description: "llama.cpp: GGUF, quant, GPU offload."
license: MIT
compatibility: opencode
---

# llama.cpp Development

## Project Layout

- `ggml/` — tensor library (alloc, ops, backends, quantization).
- `llama.cpp` — main file. Model loading, sampling, KV cache, eval loop.
- `examples/` — CLI, server, common, whisper, etc.
- `bindings/` — Python, Go, Rust, Node.js bindings.

## GGUF Loading

- `llama_model_load()` — reads GGUF header, tensor metadata, architecture.
- `llama_model_quantize()` — quantize FP16/BF16 → Q4_0/Q4_1/Q5_0/Q8_0/etc.
- `gguf_init_params_t` — `no_alloc=false`, `ctx=ggml_init_params`.
- Tensor data: `gguf_get_tensor_data()` returns offset; `ggml_backend_tensor_get()` copies.
- `ggml_numa_init()` — enable NUMA-aware allocation (`--numa`).

## Quantization Types

| Type | Bits | Block Size | Notes |
|------|------|-----------|-------|
| Q4_0 | 4 | 32 | 16FP + 16int4, simplest quanta |
| Q4_1 | 4 | 32 | Q4_0 + 1-bit sign scaling |
| Q5_0 | 5 | 32 | 5-bit with FP16 scale |
| Q5_1 | 5 | 32 | Q5_0 + 1-bit bias |
| Q8_0 | 8 | 32 | FP8 quantization |
| Q2_K | 2 | 16 | 2-bit, minimal quality |
| Q3_K | 2-3 | 16-32 | Variable bit depth |
| Q6_K | 6 | 256 | Per-row quanta |
| Q8_K | 8 | 256 | Block-wise 8-bit |
| MXFP4 | 4 | 32 | Microsoft FP4 format |

## GPU Offload

- `--n-gpu-layers N` — offload first N transformer layers to GPU.
- `--backend cuda` (NVIDIA), `--backend metal` (macOS), `--backend vulkan` (cross-platform).
- `--mmq / --mml` — use Metal/Metal Performance Shaders.
- CUDA: `llama_decode()` on GPU, KV cache on GPU if `n_gpu_layers == n_layer`.
- HIP: same API, `--backend hip` for AMD GPUs.
- BLAS: `--blas` (BLAS = Basic Linear Algebra Subprograms) or `--blash` (host). `LLAMA_BLAS=ON` CMake flag.

## Server API

- `/completion` — `{model, prompt, stream, n_predict, temperature, top_k, top_p, ...}`
- `/chat` — OpenAI-compatible `/v1/chat/completions`.
- `/embedding` — text embeddings.
- `/tokenize` — tokenize text without inference.
- `--host`, `--port`, `--nThreads`, `--ctx-size`, `--batch-size`.

## Build Commands

```
# CPU only
cmake -B build -DLLAMA_CUBLAS=OFF -DLLAMA_CUDA=OFF
cmake --build build -j

# CUDA
cmake -B build -DLLAMA_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES=80  # A100
cmake --build build -j

# Metal (macOS)
cmake -B build -DLLAMA_METAL=ON
cmake --build build -j

# Vulkan
cmake -B build -DLLAMA_VULKAN=ON
cmake --build build -j
```

## Sampling

- `llama_sampler` chain: `llama_sampler_init()`, `llama_sampler_add()`, `llama_sampler_init_penalties()`.
- Order: frequency penalty → presence penalty → temperature → top_k → top_p → min_p → softmax.
- `llama_sampler_sample()` applies the chain. `llama_sampler_free()` cleans up.
