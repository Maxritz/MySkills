---
name: gguf-format
description: Inspect, validate, convert, shard, quantize, or integrate GGUF model artifacts with LLM runtimes while preserving tensor, metadata, tokenizer, and quantization correctness.
---

# GGUF model format

Treat GGUF as a binary contract and model file as untrusted input.

1. Validate magic/version, header and metadata bounds, tensor names/shapes/dtypes, offsets, alignment, and shard completeness.
2. Reconcile tokenizer/config metadata with the source model and runtime expectations.
3. Convert one tensor family at a time, preserve quantization scales/blocks, and record source commit, converter, and precision.
4. Compare deterministic logits or embeddings against the reference within declared tolerances.
5. Test malformed/truncated files, large offsets, duplicate names, unsupported dtypes, and memory-mapped loading safely.

Read `_systems-ml-shared/model-format-checklist.md`; add `llm-components` for semantic validation and `python-conversion` for conversion pipelines.
