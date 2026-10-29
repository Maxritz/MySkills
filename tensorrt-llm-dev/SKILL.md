---
name: tensorrt-llm-dev
description: TensorRT-LLM model execution, LLM API, serving, CUDA integration, quantisation and performance validation.
license: NVIDIA Source Code License
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["TensorRT-LLM", "trtllm-serve", "TensorRT LLM API", "TensorRT engine"]
---

# TensorRT-LLM Development

## Version gate first

TensorRT-LLM has changed execution backends and deployment workflows. Before writing code, record the exact package version or source commit, CUDA/driver/TensorRT versions and GPU architecture. Inspect the installed CLI help and matching versioned official documentation.

Do not assume legacy symbols or commands such as `BuildConfig`, `LLaMAForCausalLM`, `trtllm-build`, checkpoint conversion or a prebuilt engine are part of the current release. The latest documentation includes a PyTorch-native LLM API and a `trtllm-serve` workflow; older pinned releases may have materially different engine-build paths. Do not blend instructions across those release families.

## Select the workflow

| Goal | Start here | Evidence |
|---|---|---|
| Offline inference | Current `LLM` API docs and examples | Load, generate, compare output, shut down cleanly |
| Online serving | Current `trtllm-serve --help` and serving guide | Readiness, requests, streaming, errors and stop/cleanup |
| Source development | Repository build instructions for the pinned commit | Clean build, targeted tests and ABI/runtime checks |
| Legacy engine deployment | Only the docs for the exact release that supports it | Engine compatibility, model/plugin/CUDA/GPU match |
| Quantisation or parallelism | Current supported-model, quantisation and parallelism matrices | Quality delta, memory, correctness and measured throughput |

## Developer workflow

1. Freeze model revision, tokenizer, source revision, package and hardware/software tuple.
2. Reproduce with the smallest supported model/input and preserve the first error.
3. Trace request/model config through loading, weight representation, execution backend, cache and output conversion.
4. Change one causal variable per iteration; do not rewrite a command or API based on examples from another release.
5. Run targeted tests, reference comparisons and the relevant regression suite.
6. Measure warm and steady-state performance separately after correctness passes.

## Numerical and serving checks

- Compare tokenisation, stop conditions, output shape and logits or generated outputs against a trusted reference where available.
- Record tolerances explicitly for quantised and mixed-precision paths.
- Test allocation limits, cache exhaustion, cancellation, streaming order, invalid requests and clean shutdown.
- For parallel execution, verify rank/world-size configuration, process-group setup, collective ordering and failure propagation.
- Bench prefill, decode, time-to-first-token, inter-token latency, throughput, tail latency and peak memory separately.

## Build evidence

For source changes, follow the checked-out repository's documented build target. The current documentation contains a full source build path that builds a wheel, but flags and dependencies must match the pinned commit. Report exact commands, exit codes, logs, tests and unsupported/unavailable GPU checks. A successful Python import or engine creation alone does not validate inference correctness.

Use `llm-serving` for engine-agnostic serving decisions and `llm-advanced` for MoE/speculative decoding contracts.
