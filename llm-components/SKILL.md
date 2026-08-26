---
name: llm-components
description: Design, implement, convert, benchmark, or debug LLM components such as tokenization, embeddings, attention, KV cache, sampling, quantization, MoE, speculative decoding, and serving APIs.
---

# LLM components

Treat each LLM subsystem as an explicit contract: token IDs, shapes, dtype, device, cache layout, masking, randomness, and stop behavior.

1. Freeze a small deterministic reference and record model config, tokenizer, precision, context limits, and parallelism.
2. Isolate tokenizer, embedding, attention, KV-cache, MLP/MoE, sampling, and transport boundaries.
3. Validate intermediate tensors, cache reuse, masking, logits, sampling seeds, and numerical tolerances.
4. Measure TTFT, inter-token latency, throughput, memory, cache hit rate, and quality/acceptance—not tokens/s alone.
5. Report model/format/runtime assumptions and never claim support without executing a representative fixture.

Add `gguf-format` or `safetensors-format` for artifacts, `python-conversion` for conversion, and the relevant CUDA/ROCm serving skill for kernels.
