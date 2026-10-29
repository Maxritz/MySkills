---
name: model-formats
description: "Unified model formats: GGUF, SafeTensors, ONNX, OpenVINO IR. Validate, convert, shard, quantize, integrate with runtimes. Binary contract verification."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: false
  trigger_keywords: ["GGUF", "SafeTensors", "ONNX", "OpenVINO", "model format", "quantization", "tensor", "shard", "convert", "ggml", "safetensors"]
---
# Model Formats

Treat model files as untrusted structured data. Pin source/destination formats, tool versions and target runtime.

## Format Matrix

| Format | Extension | Primary Use | Quantization | Streaming | Runtime |
|--------|-----------|-------------|--------------|-----------|---------|
| **GGUF** | `.gguf` | llama.cpp, local LLMs | Q4_K, Q5_K, Q8_0, IQ4_XS | mmap + partial | llama.cpp, ollama, LM Studio |
| **SafeTensors** | `.safetensors` | HF, PyTorch, TensorFlow | FP16, BF16, INT8 (external) | mmap + shard index | HF Transformers, vLLM, SGLang |
| **ONNX** | `.onnx` | Cross-framework, OpenVINO | QOperator, QDQ | N/A | ONNX Runtime, OpenVINO, TensorRT |
| **OpenVINO IR** | `.xml` + `.bin` | Intel CPU/GPU/NPU | PTQ INT8, QAT | N/A | OpenVINO |

---


## Conversion and acceptance contract

1. Validate magic/version/schema, lengths, offsets, alignment, counts, overflow, tensor bounds and metadata before allocation or mapping.
2. Preserve names, shapes, layouts, dtype/quantisation, tokenizer files, special-token maps and configuration. Record unsupported or lossy metadata explicitly.
3. Never execute model-file contents or create a JIT/program directly from untrusted metadata.
4. Validate in order: header/metadata, tensor inventory and shapes, selected tensor values/dequantisation, tokenizer IDs, then reference logits/output on fixed fixtures.
5. Record tool versions, command, input/output hashes, warnings, dropped fields, tolerances and observed test results. File creation alone is not a successful conversion.
6. For sharded or large files, verify index completeness, bounds and consistent metadata before loading or mapping.

Format-specific GGUF, SafeTensors, ONNX and OpenVINO guidance: [format recipes](references/format-recipes.md).

## Security & Safety

| Rule | Enforcement |
|------|-------------|
| **Never execute file contents** | No `eval`, no JIT from model data |
| **Validate before mmap** | All offsets/bounds checked first |
| **Reject malformed** | Truncated, duplicate names, unsupported dtypes → FAIL |
| **No partial loads** | Complete file or explicit shard index required |
| **Provenance tracking** | Record source commit, converter, quantization params |

---

## Output Report

```
MODEL FORMATS: <format> VALIDATION
FORMAT: <GGUF|SafeTensors|ONNX|OpenVINO IR>
FILE: <path>
MAGIC/VERSION: <valid/invalid>
METADATA: <tensor_count> tensors, <kv_count> KVs
QUANTIZATION: <type> (<bits> bit, <block> block)
TENSORS: <validated>/<total> (<failures>)
SHARDS: <complete/incomplete>
CROSS-FORMAT: <passed>/<total> (mean diff: <value>)
PROVENANCE: source=<commit> converter=<ver> quant=<params>
BLOCKERS: <list>
```

---

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Treat model files as untrusted input. Pin source and destination format/runtime versions, validate bounds and metadata before mapping, and compare representative tensors, tokenisation and outputs after conversion; file creation alone is not successful conversion.


## Boundaries

- Does not train or fine-tune models
- Does not write conversion tools (uses existing: llama.cpp, HF, ONNX Runtime, MO)
- `stop model-formats`: revert.