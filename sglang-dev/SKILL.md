---
name: sglang-dev
description: SGLang development, runtime diagnostics, KV-cache correctness, model execution, serving and profiling.
license: MIT
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["SGLang", "RadixAttention", "SGLang KV cache", "sglang serve"]
---

# SGLang Development

## Version gate

SGLang changes module paths, launcher flags, kernel backends and model coverage rapidly. Before giving a version-specific command or patch, record the installed package version or Git commit, inspect the matching source checkout and run `python -m sglang.launch_server --help` (or the installed launcher’s own help). Do not assume API names remembered from another release still exist.

## Architecture to trace

Follow the actual path for the checked-out version: request/API layer → scheduler and request state → model runner/executor → attention and KV cache → kernels and device runtime. Do not treat these conceptual areas as guarantees that a particular file or Python symbol exists.

Inspect the current equivalents of:
- Model loading, model configuration, tokenizer/chat template and weight-format handling.
- Request scheduling, batching, cancellation and pre-emption.
- KV-cache allocation, prefix reuse/RadixAttention, eviction and cache consistency.
- Tensor/data/pipeline/expert parallelism and process-group lifecycle.
- Attention, quantisation, custom kernels and backend selection.
- Streaming API, metrics, error surfaces and shutdown.

## Run and smoke-test

The upstream quickstart currently documents a launcher form like:

```bash
python3 -m sglang.launch_server --model-path MODEL_ID_OR_PATH --host 127.0.0.1 --port 30000
```

Treat this as version-specific guidance: verify the matching official quickstart and the installed help output before relying on flags. Prefer loopback binding for a local test; use externally reachable binding only with deliberate network controls. The documented OpenAI-compatible chat route is commonly `/v1/chat/completions`; the native `/generate` route and parameters have separate contracts.

Test in order: process startup and readiness, a single deterministic request, a streaming request, malformed/unsupported input, client cancellation, overload or memory pressure, and clean shutdown. Verify the model ID, chat template, output structure and actual error codes. Do not report “server working” from process startup alone.

## Performance and correctness

- Separate model load, warm-up, prefill and decode. Fix model/tokenizer revision, precision, context, concurrency, batch policy, cache settings, seed and request set before comparison.
- Record time-to-first-token, inter-token latency, request throughput, tail latency, peak memory and error rate separately.
- Verify output semantics against a trusted baseline before comparing speed. A backend change may alter numerical tolerances or supported operators.
- Use the profiler supported by the target runtime/backend. Do not assume a CUDA profiling command applies to AMD, CPU or other backend paths.
- Preserve failing requests and runtime configuration for regressions; test cache reuse against uncached reference output.

## Report

Record SGLang version/commit, hardware, driver/runtime, model and tokenizer revisions, launch arguments, endpoint exercised, exact commands, tests, output comparisons and unrun checks. Use `llm-serving` for serving design across engines and `llm-core` for model-component semantics.
