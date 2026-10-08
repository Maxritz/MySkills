---
name: python-conversion
description: "Python to native conversion: component-by-component translation to C/C++/CUDA/HIP/ONNX/MLIR with differential testing. Frozen reference, specification template, tolerance tracking, reproducible toolchain."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  trigger_keywords: ["Python", "conversion", "C++", "CUDA", "HIP", "ONNX", "MLIR", "differential test", "quantization", "deployment", "torch", "tensorflow"]
---

# Python Conversion

**Semantic-preserving translation: Python reference to C/C++/CUDA/HIP/ONNX/MLIR with differential testing.**

---

## Conversion Pipeline

```
Python Reference (frozen) 
  → Specification (shapes, dtypes, tolerances, side effects)
  → Component-by-component conversion
  → Differential testing (intermediate + final)
  → Package with reproducible toolchain
  → Record intentional differences
```

## Specification Template

```python
# spec.py (frozen, committed)
from dataclasses import dataclass
from typing import Literal
import numpy as np

@dataclass(frozen=True)
class ModelSpec:
    # Architecture
    vocab_size: int = 32000
    hidden_size: int = 4096
    num_layers: int = 32
    num_heads: int = 32
    num_kv_heads: int = 8
    intermediate_size: int = 11008
    
    # Dtypes
    param_dtype: Literal["float32", "float16", "bfloat16"] = "float16"
    compute_dtype: Literal["float32", "float16", "bfloat16"] = "float32"
    
    # Tolerances (for differential testing)
    rtol: float = 1e-3
    atol: float = 1e-3
    max_ulp: int = 4
    
    # Behavior
    rope_theta: float = 10000.0
    rope_scaling: dict | None = None
    use_scaled_rope: bool = False
```

## Component-by-Component Conversion

```python
# 1. Tokenizer (Python → Rust/C++)
# Use HuggingFace tokenizers (Rust) directly, no conversion needed

# 2. Embeddings (Python → C++/CUDA)
# Simple lookup: indices → weight matrix rows
# Convert: torch.nn.Embedding → custom kernel

# 3. Attention (Python → CUDA/HIP)
# Multi-head attention with RoPE, causal mask
# Use FlashAttention-2 kernel (CUDA/HIP)

# 4. MLP (Python → CUDA/HIP)
# SwiGLU: gate * up → down
# Fused kernel for SwiGLU

# 5. LayerNorm/RMSNorm (Python → CUDA/HIP)
# Normalize over hidden dimension
# Fused kernel

# 6. Sampling (Python → C++)
# Top-p, top-k, temperature, repetition penalty
# Deterministic with seed
```

## Differential Testing

```python
# tests/contract/test_model_conversion.py
import pytest
import numpy as np
import torch
from mypkg.spec import ModelSpec
from mypkg.python_ref import LlamaModel as PyModel
from mypkg.cpp_target import LlamaModel as CppModel

@pytest.fixture(scope="session")
def spec():
    return ModelSpec()

@pytest.fixture(scope="session")
def reference_model(spec):
    model = PyModel(spec)
    model.load_weights("weights/llama-7b.safetensors")
    model.eval()
    return model

@pytest.fixture(scope="session")
def target_model(spec):
    model = CppModel(spec)
    model.load_weights("weights/llama-7b.safetensors")
    return model

def test_embeddings_differential(reference_model, target_model, spec):
    np.random.seed(42)
    input_ids = np.random.randint(0, spec.vocab_size, (2, 512), dtype=np.int64)
    
    with torch.no_grad():
        ref_out = reference_model.embed(torch.from_numpy(input_ids)).numpy()
    
    target_out = target_model.embed(input_ids)
    
    np.testing.assert_allclose(
        ref_out, target_out,
        rtol=spec.rtol, atol=spec.atol,
        err_msg="Embeddings mismatch"
    )

def test_attention_differential(reference_model, target_model, spec):
    np.random.seed(42)
    hidden = np.random.randn(2, 512, spec.hidden_size).astype(np.float16)
    
    with torch.no_grad():
        ref_out = reference_model.attention(torch.from_numpy(hidden)).numpy()
    
    target_out = target_model.attention(hidden)
    
    np.testing.assert_allclose(
        ref_out, target_out,
        rtol=spec.rtol, atol=spec.atol,
        err_msg="Attention mismatch"
    )

def test_full_forward_differential(reference_model, target_model, spec):
    np.random.seed(42)
    input_ids = np.random.randint(0, spec.vocab_size, (1, 256), dtype=np.int64)
    
    with torch.no_grad():
        ref_logits = reference_model(torch.from_numpy(input_ids)).logits.numpy()
    
    target_logits = target_model(input_ids)
    
    np.testing.assert_allclose(
        ref_logits, target_logits,
        rtol=spec.rtol * 2, atol=spec.atol * 2,
        err_msg="Full forward mismatch"
    )
```

## Packaging Converted Artifacts

```python
# Build converted model as wheel
# pyproject.toml for native extension
[build-system]
requires = ["meson-python", "meson>=1.2", "ninja"]
build-backend = "mesonpy"

# meson.build
project('llama-cpp', 'cpp', default_options: ['cpp_std=c++20', 'warning_level=3', 'optimization=3'])
cpp = meson.get_compiler('cpp')

cuda = find_cuda()
hip = find_hip()

sources = [
    'src/embedding.cpp',
    'src/attention.cu',
    'src/mlp.cpp',
    'src/norm.cpp',
    'src/sampling.cpp',
    'src/model.cpp',
]

deps = [
    dependency('cuda', required: cuda.found()),
    dependency('hip', required: hip.found()),
    dependency('cublas', required: cuda.found()),
    dependency('rocblas', required: hip.found()),
]

lib = shared_library('llama', sources, dependencies: deps,
    install: true, install_dir: 'mypkg/native')

pybind = dependency('pybind11', method: 'cmake')
py_module = shared_module('llama_native', 'src/bindings.cpp',
    dependencies: [lib, pybind],
    install: true, install_dir: 'mypkg/native')
```

## Output Report

```
PYTHON CONVERSION: ANALYSIS
SOURCE: <python_ref>
TARGET: <cpp|cu|hip|onnx|mlir>
COMPONENTS: <converted>/<total>
TOLERANCES: rtol=<val> atol=<val> max_ulp=<val>
DIFFERENTIAL: <passed>/<total> ✅/❌
PROVENANCE: source=<commit> converter=<ver> quant=<params>
BLOCKERS: <missing deps|conversion gap|tolerance breach>
```

## Boundaries

- Does not write kernel code (see `nvidia-cuda-stack`/`amd-gpu-stack`)
- Does not handle packaging/typing/async (see `python-engineering`)
- Does not optimise numerical kernels (see `python-perf`)
- Does not validate model formats (see `model-formats`)
- `stop python-conversion`: revert.