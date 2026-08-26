---
name: safetensors-format
description: Inspect, validate, shard, stream, convert, or integrate SafeTensors model artifacts with secure tensor loading and LLM/ML runtimes.
---

# SafeTensors model format

Treat the header, offsets, dtype, shape, and shard index as a checked serialization contract.

1. Validate header length, JSON structure, tensor bounds, non-overlap, dtype sizes, shape products, and file length.
2. Preserve tensor names, metadata, device mapping, sharding/index files, and tied-weight semantics.
3. Use zero-copy or memory mapping only after validating offsets and lifetime; never execute file contents.
4. Compare converted tensors and model outputs against the source with declared precision tolerances.
5. Test truncation, malformed metadata, duplicate names, unsupported dtypes, missing shards, and partial downloads.

Read `_systems-ml-shared/model-format-checklist.md`; add `gguf-format` only when converting between formats.
