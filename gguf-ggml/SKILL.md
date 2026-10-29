---
name: gguf-ggml
description: Inspect, parse, validate and integrate GGUF model files and GGML tensor/quantisation operations using version-pinned format and implementation contracts.
license: MIT
compatibility: opencode
---
# GGUF & GGML Development

Use for safe GGUF parsing, GGML tensor encodings and quantised operations. Pin the exact GGML revision, file version and quantisation type before assuming binary layout.

## Core parser contract

1. Validate magic/version, metadata types/counts, tensor count, name lengths, dimensions, alignment and file bounds before allocation or mapping.
2. Guard integer overflow in count × element-size, offset + byte-size, alignment rounding and allocation lengths.
3. Reject unsupported types/versions explicitly. Do not silently reinterpret, truncate, default or claim success with partial tensors.
4. Verify tensor offsets/shapes do not overlap invalid regions and stay inside the validated file; check alignment against the pinned implementation.
5. Treat quantisation as a per-type contract: block size, scale/zero-point, packed representation, rounding and accumulation type are version/type-specific.
6. Preserve metadata and tokenizer/model config; never execute model-file contents.

Detailed format structures and quantisation notes: [GGUF/GGML recipes](references/gguf-details.md).

## Validation matrix

| Area | Required checks |
|---|---|
| Header | Valid magic/version, truncation and invalid counts |
| Metadata | All supported types, arrays, strings and malformed lengths |
| Tensor descriptors | Rank, dimensions, type, offsets, alignment and overflow |
| Payload | File bounds, mapping lifetime and storage-size consistency |
| Quantisation | Block layout, dequantisation, boundary values and reference tolerance |
| Runtime integration | Tensor-name mapping, shapes, stride, backend dispatch and model-level golden tests |
| Robustness | Fuzz malformed files; sanitizers; resource and time limits |

## Output

Record upstream revision, file version, tensor type, test fixture provenance, parser result, exact reference implementation, numerical tolerance, and any unsupported types. Never report a model as supported just because its header can be parsed.

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Pin the GGML commit and quant type before relying on byte layouts. Validate untrusted offsets, counts, alignment and integer overflow before allocating or mapping; compare parsing and dequantisation with version-matched golden vectors.


