---
name: vllm-dev
description: vLLM runtime and model development, scheduling, KV cache, kernels, API serving and performance validation.
license: Apache-2.0
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["vLLM", "PagedAttention", "vLLM scheduler", "vllm serve"]
---

# vLLM Development

## Version and platform gate

vLLM changes internals, supported models, attention backends, quantisation methods and CLI flags across releases. Record the installed version or Git commit, Python, PyTorch, CUDA/ROCm/other backend, driver and GPU. Inspect the matching docs and `vllm serve --help` before depending on a symbol, path, default or flag. Avoid treating old `vllm/core` or worker paths as stable public interfaces.

## Architecture to trace

Follow the actual version's request path through API server, engine/core, scheduler, model runner, attention backend, KV-cache manager and device kernels. Inspect configuration defaults from the installed code, not from remembered snippets. For a bug, identify the first boundary whose state or output differs from contract.

## Serve and verify

The current stable documentation uses a `vllm serve MODEL` entry point for an OpenAI-compatible API. Exact flags remain release- and backend-dependent.

```bash
vllm serve MODEL_ID_OR_PATH --host 127.0.0.1
```

Verify the installed command's help before adding flags. Test startup/readiness, a deterministic chat or completion request, streaming, malformed input, cancellation, overload and graceful shutdown. The current server documentation notes that `--api-key` does not protect every endpoint; use a properly configured reverse proxy or network boundary and verify all exposed routes, rather than relying on that option alone.

## Runtime and kernel work

- For KV-cache defects, inspect page/block allocation, sequence ownership, reuse, pre-emption, eviction and request cleanup.
- For scheduler defects, record queue state, batch formation, fairness, cancellation and failure propagation.
- For kernel changes, validate shapes, strides, dtype, alignment, masking, non-multiple dimensions, precision and backend feature requirements.
- For quantisation, compare output quality and intermediate numeric error with a reference before benchmarking.
- Keep engine-specific behaviour and file paths version-pinned; avoid relying on internal module paths unless the change intentionally targets that commit.

## Benchmark protocol

Freeze model and tokenizer revisions, dtype/quantisation, context length, prompt/output token counts, batch/concurrency, sampling settings, cache policy and hardware/software versions. Separate load and warm-up from timed work. Report time-to-first-token, inter-token latency, throughput, tail latency, peak memory and errors. Repeat trials and report median/spread, not only the fastest sample.

## Report

Include version/commit, platform/backend, exact launch and request commands, regression tests, reference checks, benchmark method and limitations. Use `llm-serving` for engine comparison and `llm-advanced` for MoE/speculative decoding.
