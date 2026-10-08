---
name: model-formats
description: "Unified model formats: GGUF, SafeTensors, ONNX, OpenVINO IR. Validate, convert, shard, quantize, integrate with runtimes. Binary contract verification."
compatibility: opencode
metadata:
  loading: on-demand
  auto_trigger: true
  trigger_keywords: ["GGUF", "SafeTensors", "ONNX", "OpenVINO", "model format", "quantization", "tensor", "shard", "convert", "ggml", "safetensors"]
---

# Model Formats

**Treat every model file as an untrusted binary contract.** Validate before load, convert with provenance, integrate with runtime expectations.

## Format Matrix

| Format | Extension | Primary Use | Quantization | Streaming | Runtime |
|--------|-----------|-------------|--------------|-----------|---------|
| **GGUF** | `.gguf` | llama.cpp, local LLMs | Q4_K, Q5_K, Q8_0, IQ4_XS | mmap + partial | llama.cpp, ollama, LM Studio |
| **SafeTensors** | `.safetensors` | HF, PyTorch, TensorFlow | FP16, BF16, INT8 (external) | mmap + shard index | HF Transformers, vLLM, SGLang |
| **ONNX** | `.onnx` | Cross-framework, OpenVINO | QOperator, QDQ | N/A | ONNX Runtime, OpenVINO, TensorRT |
| **OpenVINO IR** | `.xml` + `.bin` | Intel CPU/GPU/NPU | PTQ INT8, QAT | N/A | OpenVINO |

---

## 1. GGUF (llama.cpp Format)

### Structure
```
Magic: "GGUF" (0x46554747)
Version: uint32 (3 = current)
Tensor count: uint64
Metadata KV count: uint64
[Metadata KV pairs...]
[TensorInfo array...]
[Tensor data (aligned)...]
```

### Validation Checklist (Mandatory)
```python
def validate_gguf(filepath):
    with open(filepath, 'rb') as f:
        # 1. Magic & version
        assert f.read(4) == b'GGUF'
        version = read_u32(f)
        assert version in (2, 3), f"Unsupported version: {version}"
        
        # 2. Counts
        tensor_count = read_u64(f)
        kv_count = read_u64(f)
        assert tensor_count <= MAX_TENSORS
        assert kv_count <= MAX_KV
        
        # 3. Metadata KVs - validate bounds, types, names
        for _ in range(kv_count):
            key = read_string(f)
            val_type = read_u32(f)
            validate_kv_value(f, val_type, key)
        
        # 4. TensorInfos - validate names, shapes, dtypes, offsets
        tensors = []
        for _ in range(tensor_count):
            name = read_string(f)
            n_dims = read_u32(f)
            shape = [read_u64(f) for _ in range(n_dims)]
            dtype = read_u32(f)  # GGML_TYPE_*
            offset = read_u64(f)
            validate_tensor_info(name, shape, dtype, offset)
            tensors.append((name, shape, dtype, offset))
        
        # 5. Check alignment & shard completeness
        for name, shape, dtype, offset in tensors:
            assert offset % ALIGNMENT == 0, f"Tensor {name} misaligned: {offset}"
            expected_size = shape_product(shape) * dtype_size(dtype)
            # Verify data exists at offset
```

### Quantization Types (GGML)

| Type | Bits | Block | Use Case |
|------|------|-------|----------|
| `Q4_0` | 4 | 32 | Legacy, fast dequant |
| `Q4_K` | 4 | 256 | Best quality/speed (recommended) |
| `Q5_K` | 5 | 256 | Higher quality |
| `Q8_0` | 8 | 32 | Near-FP16 quality |
| `IQ4_XS` | 4 | 32 | Importance-weighted, small |
| `IQ4_NL` | 4 | 32 | Importance-weighted, non-linear |
| `FP16` | 16 | — | No quantization |

### Conversion Pipeline
```
Source (HF PyTorch) 
  → gguf-my-repo convert (preserve metadata)
  → quantize (llama.cpp quantize: Q4_K_M default)
  → validate (logits diff vs reference < 1e-3)
  → shard (if >2GB: split by tensor families)
  → record provenance (source commit, converter version, quantization params)
```

### Integration Contract
- **Tokenizer metadata**: `tokenizer.ggml.model`, `tokenizer.ggml.tokens`, `tokenizer.ggml.scores`, `tokenizer.ggml.token_type`, `tokenizer.ggml.merges`
- **Config metadata**: `general.architecture`, `llama.block_count`, `llama.attention.head_count`, `llama.embedding_length`, `llama.feed_forward_length`, `llama.rope.freq_base`
- **Runtime expectations**: Context length, rope scaling, sliding window, attention type

---

## 2. SafeTensors

### Structure
```
Header (8 bytes): u64 header_length (little-endian)
Header (JSON): {"__metadata__": {...}, "tensor_name": {"dtype": "F16", "shape": [..], "data_offsets": [start, end]}, ...}
Tensor data: concatenated, aligned to 64 bytes
```

### Validation Checklist (Mandatory)
```python
def validate_safetensors(filepath):
    with open(filepath, 'rb') as f:
        # 1. Header length
        header_len = read_u64(f)
        assert header_len < MAX_HEADER_SIZE
        
        # 2. Parse JSON header
        header_json = json.loads(f.read(header_len))
        
        # 3. Validate each tensor
        file_size = os.path.getsize(filepath)
        data_start = 8 + header_len
        
        for name, info in header_json.items():
            if name == "__metadata__":
                continue
            dtype = info["dtype"]  # F32, F16, BF16, I32, I64, U8, BOOL
            shape = info["shape"]
            offsets = info["data_offsets"]  # [start, end] relative to data_start
            
            # Bounds check
            assert 0 <= offsets[0] < offsets[1] <= file_size - data_start
            
            # Non-overlap check (across all tensors)
            # Shape product * dtype_size == offsets[1] - offsets[0]
            expected = shape_product(shape) * dtype_size(dtype)
            actual = offsets[1] - offsets[0]
            assert expected == actual, f"Tensor {name}: size mismatch {expected} vs {actual}"
        
        # 4. Shard index (if present)
        if "__metadata__" in header_json and "shard_index" in header_json["__metadata__"]:
            validate_shard_index(header_json["__metadata__"]["shard_index"])
```

### Sharding (Large Models)
```json
// model.safetensors.index.json
{
  "metadata": {"total_size": 12345678900},
  "weight_map": {
    "model.embed_tokens.weight": "model-00001-of-00003.safetensors",
    "model.layers.0.self_attn.q_proj.weight": "model-00001-of-00003.safetensors",
    ...
  }
}
```

### Zero-Copy Loading (After Validation)
```python
# Memory-map validated file
mmap = np.memmap(filepath, mode='r', offset=data_start + tensor_offset, 
                 dtype=dtype_numpy, shape=shape)
# Or torch.from_numpy for PyTorch
tensor = torch.from_numpy(mmap.copy())  # Copy if mutation needed
```

### Conversion (SafeTensors ↔ GGUF)
```python
# SafeTensors → GGUF (llama.cpp convert)
python convert-hf-to-gguf.py --model model.safetensors --outfile model.gguf --quantize Q4_K_M

# GGUF → SafeTensors (for HF ecosystem)
# 1. Load GGUF → FP32 tensors
# 2. Save as SafeTensors with metadata preserved
# 3. Reconcile tokenizer config separately
```

---

## 3. ONNX

### Validation
```python
import onnx
model = onnx.load("model.onnx")
onnx.checker.check_model(model)

# Check opset, inputs/outputs, dynamic axes
for inp in model.graph.input:
    print(inp.name, inp.type.tensor_type.shape)
for out in model.graph.output:
    print(out.name, out.type.tensor_type.shape)
```

### Quantization (ONNX Runtime)
```python
from onnxruntime.quantization import quantize_dynamic, QuantType
quantize_dynamic("model.onnx", "model_int8.onnx", weight_type=QuantType.QInt8)

# Static quantization (QDQ format)
from onnxruntime.quantization import quantize_static, CalibrationDataReader
quantize_static("model.onnx", "model_qdq.onnx", calibration_data_reader)
```

---

## 4. OpenVINO IR

### Structure
- `.xml`: Topology (layers, connections, shapes)
- `.bin`: Weights (FP32/FP16/INT8)

### Conversion (ONNX → IR)
```bash
mo --input_model model.onnx --output_dir ir/ --data_type FP16
# Input shape override
--input_shape [1,3,224,224]
# Quantization (PTQ)
mo --input_model model.onnx --compress_weights 0  # FP32
```

### Python PTQ (NNCF)
```python
import nncf
import openvino as ov

model = ov.Core().read_model("model.xml")
dataset = nncf.Dataset(calibration_loader)
quantized_model = nncf.quantize(model, dataset, subset_size=300)
ov.serialize(quantized_model, "model_int8.xml")
```

---

## Cross-Format Validation (Golden Test)

```python
def cross_format_validate(formats: dict[str, str], tolerance: dict):
    """Validate multiple formats produce equivalent outputs."""
    reference_logits = None
    
    for name, path in formats.items():
        if name == "gguf":
            logits = run_llama_cpp(path)
        elif name == "safetensors":
            logits = run_hf_transformers(path)
        elif name == "onnx":
            logits = run_onnx_runtime(path)
        elif name == "openvino":
            logits = run_openvino(path)
        
        if reference_logits is None:
            reference_logits = logits
        else:
            diff = np.abs(logits - reference_logits).mean()
            max_diff = np.abs(logits - reference_logits).max()
            tol = tolerance.get(name, 1e-3)
            assert diff < tol, f"{name}: mean diff {diff} > {tol}"
            assert max_diff < tol * 10, f"{name}: max diff {max_diff}"

# Tolerances by format
TOLERANCE = {
    "gguf": {"Q4_K": 1e-2, "Q8_0": 1e-3, "FP16": 1e-4},
    "safetensors": {"FP16": 1e-4, "BF16": 1e-4},
    "onnx": {"FP32": 1e-5, "INT8": 1e-2},
    "openvino": {"FP16": 1e-3, "INT8": 1e-2},
}
```

---

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

## Boundaries

- Does not train or fine-tune models
- Does not write conversion tools (uses existing: llama.cpp, HF, ONNX Runtime, MO)
- `stop model-formats`: revert.