---
name: model-formats
description: "Binary model-format validation, conversion, sharding, quantisation, runtime integration and cross-format equivalence testing."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: false
  trigger_keywords: ["GGUF", "SafeTensors", "ONNX", "OpenVINO", "model format", "quantization", "tensor", "shard", "convert", "ggml", "safetensors"]
---

# Model Formats

Treat each model file as an untrusted binary contract. Validate structure and provenance before mapping or allocating tensor memory. Conversion is not automatically lossless.

## Version gate and workflow

1. Record source model revision, tokenizer/config revision, file hashes, converter version/commit, destination format version, quantisation parameters and target runtime.
2. Inspect the format specification and parser from the exact upstream revision before relying on field order, metadata names, type sizes or CLI flags.
3. Validate file sizes, offsets, element counts, arithmetic overflow, duplicate names, tensor coverage, shard indexes and resource limits before allocation.
4. Convert into a temporary output path. Reopen and validate every artifact, compare outputs against the source runtime, then atomically publish the files and manifest. Never mark a partial conversion complete.
5. Keep weight conversion and quantisation as separate steps where possible. Record every lossy transform and its numerical effect.
6. Distinguish syntactic validity, loadability by a particular runtime, numerical equivalence and task quality. Passing one does not imply the others.

Primary references:
- GGUF: [format specification](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md) and [reader tooling](https://github.com/ggml-org/llama.cpp/tree/master/gguf-py).
- SafeTensors: [format specification](https://github.com/huggingface/safetensors#format).
- ONNX: [checker API](https://onnx.ai/onnx/api/checker.html).
- OpenVINO: [legacy component migration notes](https://docs.openvino.ai/2026/documentation/legacy-features.html).

## Format selection

| Format | Common use | Key contract |
|---|---|---|
| GGUF | ggml-based inference runtimes | Metadata, architecture mapping, general.alignment, quantisation block layout, tensor offsets and split-file metadata |
| SafeTensors | Framework checkpoints | 8-byte little-endian header length, JSON header, payload-relative data offsets, separate shard index |
| ONNX | Framework-neutral graph exchange | Opset imports, graph IO, external tensor data, operator/provider support and preprocessing |
| OpenVINO IR | OpenVINO deployment | Model XML, weight payload, supported runtime/API and target-device compilation |

Do not assume every runtime supports the newest format version, every quantisation type or every architecture. Probe the installed runtime and use documentation matching that version.

## GGUF

### Parse contract

- Verify the literal GGUF magic, supported version and endianness. Fail closed when the parser does not support the version.
- Bound tensor and metadata counts, string/array lengths, dimension count, nesting and total allocation before iterating.
- Validate metadata types and array element types. Parse general.architecture before interpreting architecture-specific keys.
- Validate unique tensor names, dimension ranges, data type IDs, per-type block constraints, offsets, required alignment and the complete referenced byte range.
- Tensor offsets are relative to the tensor-data section, not the beginning of the whole file. Account for header/table padding and the actual general.alignment metadata; if absent, use the default specified by the pinned parser revision.
- Calculate storage size from the matching ggml quantisation traits, including elements per block and bytes per block. Never use element_count multiplied by bits-per-weight divided by eight as a universal formula for block-quantised tensors.
- Check overflow before multiplication, addition and alignment rounding. Ensure every referenced range fits in the actual file and ranges do not overlap.
- For split models, validate every required part and its exact metadata. Do not invent a universal size threshold or split tensors by family unless the chosen writer/runtime explicitly supports that layout.

### Prefer the pinned reader

Prefer the reader and dump tools shipped with the exact ggml/llama.cpp revision before writing a parser. The upstream Python package and command-line entry points can change, so verify the installed package and help output before relying on a command.

    python -m pip show gguf
    gguf-dump --help
    gguf-dump path/to/model.gguf

If implementing a custom parser, use bounded reads and explicit error results. Do not use Python assert as production validation because optimisation can disable assertions. Do not rely on unspecified helpers such as read_u32 or shape_product without defining and testing their contracts.

### Runtime contract

Read general.architecture first and map only metadata keys defined for that architecture. Validate tokenizer vocabulary and merge/score/type arrays, layer/head counts, RoPE settings, sliding-window settings, expert counts and tensor shapes against the architecture and runtime requirements. Do not apply llama-specific metadata keys blindly to other model families.

## SafeTensors

### Header and payload checks

- Read the first 8 bytes as an unsigned little-endian header length. Reject a header that exceeds policy limits or extends beyond the file before parsing JSON.
- Parse UTF-8 JSON with duplicate-key detection. Reject duplicate tensor names instead of allowing a normal dictionary parser to overwrite an earlier key.
- The optional __metadata__ member is a string-to-string map. It is not the standard shard index.
- Tensor data_offsets are relative to the beginning of the payload after the header. Validate 0 <= start <= end <= payload_size; equal offsets are valid for empty tensors.
- Check that shape and dtype imply exactly end - start bytes. Use the format's dtype sizes, including packed dtypes where supported.
- Validate all ranges together: no overlaps, and complete payload coverage according to the current specification. Do not assume each tensor begins at a 64-byte boundary.
- Scalars and empty tensors are legal; do not reject them using a blanket start < end rule.
- Validate a separate sharding index, such as a .safetensors.index.json file, independently. Each weight-map entry must refer to an existing shard and a tensor that exists in that shard. Reject missing, duplicate and unsafe paths.
- Set explicit limits for header size, tensor count, rank, shape product and decoded memory before loading external models.

Prefer the official SafeTensors library for ordinary loading. For manual memory mapping, prove all bounds before mapping, preserve read-only behaviour unless mutation is required, and document who owns the map and how long views remain valid. Memory mapping alone does not prove safe parsing or end-to-end zero-copy behaviour.

## ONNX

Run the checker for the pinned ONNX version, then inspect graph inputs/outputs, opset imports, symbolic dimensions, external-data references and custom operators. Confirm the target execution provider supports required operators and dtypes.

    import onnx

    model = onnx.load("model.onnx", load_external_data=True)
    onnx.checker.check_model(model)
    for item in model.graph.input:
        print(item.name, item.type.tensor_type.shape)
    for item in model.graph.output:
        print(item.name, item.type.tensor_type.shape)

For external tensor data, ensure referenced files exist and paths stay within the model package. Static quantisation needs a representative calibration dataset. Validate on the intended execution provider, not only on a CPU reference.

## OpenVINO

Prefer the OpenVINO Runtime and OpenVINO Converter (OVC) workflow for releases that support them. Legacy Model Optimizer and Conversion API commands in older guides may be removed or unsupported. Verify the installed version and ovc help before adopting flags.

    ovc --help
    ovc path/to/model.onnx --output_model path/to/staging/model.xml

Treat this as a template for compatible OVC versions, not a guarantee that every framework or option is supported. Inspect the generated model and weights, then compile on the target device with the API documented for the installed release. Validate preprocessing, output shapes, unsupported operations, memory use and numerical differences. Quantisation and weight compression are transformations, not lossless conversions.

## Conversion and numerical equivalence

Keep a manifest with hashes, source revisions, tokenizer/config files, converter versions, target format/runtime versions, quantisation parameters and validation status. Validate staged outputs before atomically publishing them. Preserve the last known-good artifact if conversion fails.

Compare equivalent tensors or logits only when inputs, tokenisation, preprocessing, shapes, output ordering and semantic conventions match. Compare pre-sampling logits where available; generated text alone is too sensitive to sampling and small numerical changes.

Use an independent comparison function that verifies shapes before arithmetic, rejects empty or non-finite outputs, and reports maximum absolute error and RMS error as well as whether explicit absolute/relative tolerances pass. Define the tolerances from the exact dtype, quantiser and runtime contract. There is no universal tolerance attached to a format name. Add task-level checks such as top-k agreement, perplexity or benchmark-task accuracy when appropriate, and report those separately from elementwise error.

## Security and failure handling

- Treat model files, JSON headers and shard paths as untrusted input.
- Check integer overflow and bounds before mapping or allocating. Bound file size, header size, tensor count, dimension count and decoded memory.
- Reject truncated data, duplicate names, overlapping/out-of-range ranges, unsupported types and incomplete shards.
- Never evaluate model-controlled strings or execute converter output as code.
- Write conversions to temporary files, verify hashes and only then publish the final manifest. Use fsync where crash durability is required.
- Preserve the previous artifact and a machine-readable failure reason when conversion or validation fails.

## Completion report

    MODEL FORMATS: VALIDATION
    SOURCE: format, revision, hash
    TARGET: format, version, converter/runtime
    METADATA: parsed counts and architecture
    TENSORS: checked / total, unsupported or invalid entries
    SHARDS: complete / incomplete
    CONVERSION: lossless steps and lossy steps
    NUMERICAL: tests, tolerances, max error, RMS error, task metrics
    SECURITY: bounds, duplicate/path/overlap checks
    PROVENANCE: source revision, converter version, parameters
    STATUS: PASS / FAIL / BLOCKED / NOT RUN
    BLOCKERS: explicit list

## Boundaries

- Does not train or fine-tune models.
- Uses existing readers and converters as the default; a custom parser/converter is a separate engineering task.
- For GGUF tensor block layouts, use authoritative upstream ggml type/quantisation definitions for the exact revision rather than maintaining a handwritten size table.
