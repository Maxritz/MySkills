---
name: python-engineering
description: "Unified Python: production engineering (typing, packaging, async, native extensions), performance (NumPy, Numba, C extensions, profiling), conversion (Python→C/C++/CUDA/ONNX/MLIR with differential testing). Deterministic environments, reproducible builds."
compatibility: opencode
metadata:
  loading: on-demand
  auto_trigger: true
  trigger_keywords: ["Python", "NumPy", "Numba", "C extension", "cffi", "ctypes", "asyncio", "typing", "packaging", "profiling", "conversion", "ONNX", "MLIR", "differential test"]
---

# Python Engineering

**Unified across production engineering, performance optimization, and cross-language conversion.**

---

## 1. Production Engineering

### Package Layout (src-layout)
```
pyproject.toml
README.md
src/
  mypkg/
    __init__.py
    _version.py          # setuptools-scm or manual
    contracts.py         # Public interfaces (TypedDict, Protocol)
    core.py              # Pure Python logic
    native/              # C/C++/Rust extensions (if any)
      __init__.py
      _native.c
      _native.h
      pyproject.toml     # meson.build or setup.py for extension
    async/               # Async services
      __init__.py
      server.py
      client.py
    sync/                # Sync wrappers
      __init__.py
    cli/                 # CLI entry points
      __init__.py
      main.py
tests/
  unit/
  integration/
  contract/              # Differential tests for conversions
benchmarks/
```

### pyproject.toml (Modern)
```toml
[build-system]
requires = ["setuptools>=68", "wheel", "setuptools-scm[toml]>=8"]
build-backend = "setuptools.build_meta"

[project]
name = "mypkg"
version = "0.1.0"
description = "Production Python package"
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
    "numpy>=1.26",
    "pydantic>=2.0",
    "click>=8.0",
]
optional-dependencies = {
    "dev" = ["pytest", "pytest-asyncio", "pytest-cov", "ruff", "mypy", "pyright"],
    "perf" = ["numba", "line-profiler", "memory-profiler"],
    "native" = ["cffi", "meson-python"],
}

[project.entry-points]
console_scripts = ["mypkg = mypkg.cli.main:main"]

[tool.setuptools.packages.find]
where = ["src"]
include = ["mypkg*"]

[tool.ruff]
line-length = 100
target-version = "py311"
select = ["E", "F", "I", "UP", "B", "C4", "PTH", "T20", "SIM", "ARG"]
ignore = ["S101"]  # Allow assert in tests

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_ignores = true
disallow_untyped_defs = true
check_untyped_defs = true
```

### Contracts (Public Interfaces)
```python
# contracts.py
from typing import Protocol, TypedDict, Literal, runtime_checkable
from dataclasses import dataclass
from numpy.typing import NDArray

class TensorSpec(TypedDict):
    shape: tuple[int, ...]
    dtype: Literal["float32", "float16", "bfloat16", "int8", "int4"]
    device: Literal["cpu", "cuda", "hip"]

@runtime_checkable
class EmbeddingProvider(Protocol):
    def encode(self, texts: list[str]) -> NDArray[np.float32]: ...
    def encode_async(self, texts: list[str]) -> Awaitable[NDArray[np.float32]]: ...

@dataclass(frozen=True, slots=True)
class InferenceRequest:
    prompt: str
    max_tokens: int = 512
    temperature: float = 1.0
    top_p: float = 1.0
    seed: int | None = None

@dataclass(frozen=True, slots=True)
class InferenceResponse:
    text: str
    token_ids: list[int]
    logprobs: list[float] | None
    usage: dict[str, int]  # prompt, completion, total
```

### Type Checking & Linting
```bash
# Type check
mypy src/
pyright src/

# Lint
ruff check src/ tests/
ruff format src/ tests/

# Pre-commit (install: pre-commit install)
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.5.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
```

### Testing
```python
# tests/unit/test_core.py
import pytest
from mypkg.core import process_batch
from mypkg.contracts import TensorSpec
import numpy as np

def test_process_batch_shapes():
    input_spec = TensorSpec(shape=(32, 1024), dtype="float32", device="cpu")
    output = process_batch(np.random.randn(*input_spec["shape"]).astype(np.float32))
    assert output.shape == (32, 512)
    assert output.dtype == np.float32

# tests/contract/test_conversion.py (Differential)
def test_numpy_to_numba_differential():
    np.random.seed(42)
    x = np.random.randn(1024, 1024).astype(np.float32)
    
    # Reference (NumPy)
    ref = np.matmul(x, x.T)
    
    # Target (Numba)
    from mypkg.perf import matmul_numba
    target = matmul_numba(x)
    
    np.testing.assert_allclose(ref, target, rtol=1e-5, atol=1e-5)

# tests/integration/test_async.py
@pytest.mark.asyncio
async def test_server_throughput():
    from mypkg.async_.server import InferenceServer
    server = InferenceServer()
    await server.start()
    
    # Concurrent requests
    async def request():
        return await server.generate("Hello", max_tokens=100)
    
    results = await asyncio.gather(*[request() for _ in range(100)])
    assert all(r.text for r in results)
    
    await server.stop()
```

### Async Engineering
```python
# async/server.py
import asyncio
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import AsyncIterator

@dataclass(slots=True)
class ServerConfig:
    host: str = "0.0.0.0"
    port: int = 8000
    max_concurrent: int = 100
    request_timeout: float = 30.0

class InferenceServer:
    def __init__(self, config: ServerConfig):
        self.config = config
        self._semaphore = asyncio.Semaphore(config.max_concurrent)
        self._server: asyncio.Server | None = None
    
    @asynccontextmanager
    async def lifespan(self) -> AsyncIterator[None]:
        self._server = await asyncio.start_server(
            self._handle_client, self.config.host, self.config.port
        )
        try:
            yield
        finally:
            self._server.close()
            await self._server.wait_closed()
    
    async def start(self) -> None:
        await self.lifespan().__aenter__()
    
    async def stop(self) -> None:
        await self.lifespan().__aexit__(None, None, None)
    
    async def _handle_client(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        async with self._semaphore:
            try:
                # Read request with timeout
                data = await asyncio.wait_for(reader.read(65536), timeout=self.config.request_timeout)
                request = parse_request(data)
                
                # Process (offload CPU work to thread pool)
                loop = asyncio.get_running_loop()
                response = await loop.run_in_executor(None, self._generate_sync, request)
                
                writer.write(serialize_response(response))
                await writer.drain()
            except asyncio.TimeoutError:
                writer.write(b"ERROR: timeout")
            finally:
                writer.close()
                await writer.wait_closed()
    
    def _generate_sync(self, request) -> InferenceResponse:
        # CPU-bound work here
        pass
```

### Cancellation & Cleanup
```python
async def with_timeout(coro, timeout: float):
    try:
        return await asyncio.wait_for(coro, timeout)
    except asyncio.TimeoutError:
        # Cancel the coroutine
        raise TimeoutError(f"Operation timed out after {timeout}s")

# Graceful shutdown
async def shutdown(signal, loop):
    tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
    for task in tasks:
        task.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)
    loop.stop()

loop = asyncio.get_event_loop()
for sig in (signal.SIGTERM, signal.SIGINT):
    loop.add_signal_handler(sig, lambda s=sig: asyncio.create_task(shutdown(s, loop)))
```

---

## 2. Performance Optimization

### NumPy Vectorization
```python
# ❌ Slow: Python loop
def slow_cosine_sim(a, b):
    return sum(x * y for x, y in zip(a, b)) / (np.linalg.norm(a) * np.linalg.norm(b))

# ✅ Fast: NumPy vectorized
def fast_cosine_sim(a: NDArray[np.float32], b: NDArray[np.float32]) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

# ✅ Batch: einsum for tensor contractions
# [B, S, H] @ [B, H, T] -> [B, S, T]
attn = np.einsum("bsh,bht->bst", q, k) / np.sqrt(H)
```

### Numba JIT
```python
# CPU JIT
from numba import njit, prange

@njit(cache=True, parallel=True, fastmath=True)
def matmul_numba(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    """A: [M, K], B: [K, N] -> C: [M, N]"""
    M, K = A.shape
    K2, N = B.shape
    assert K == K2
    C = np.empty((M, N), dtype=A.dtype)
    for i in prange(M):
        for j in range(N):
            s = 0.0
            for k in range(K):
                s += A[i, k] * B[k, j]
            C[i, j] = s
    return C

# GPU JIT
from numba import cuda

@cuda.jit
def matmul_gpu(A, B, C, M, N, K):
    """A: [M, K], B: [K, N], C: [M, N]"""
    row, col = cuda.grid(2)
    if row < M and col < N:
        s = 0.0
        for k in range(K):
            s += A[row, k] * B[k, col]
        C[row, col] = s

def launch_gpu(A, B):
    M, K = A.shape
    K2, N = B.shape
    C = cuda.device_array((M, N), dtype=A.dtype)
    d_A = cuda.to_device(A)
    d_B = cuda.to_device(B)
    threads = (16, 16)
    blocks = ((N + 15) // 16, (M + 15) // 16)
    matmul_gpu[blocks, threads](d_A, d_B, C, M, N, K)
    return C.copy_to_host()
```

### C Extensions (cffi)
```python
# native/build.py
from cffi import FFI

ffibuilder = FFI()

ffibuilder.cdef("""
    int matmul_f32(const float* A, const float* B, float* C, int M, int N, int K);
    int matmul_f16(const half* A, const half* B, half* C, int M, int N, int K);
""")

ffibuilder.set_source("mypkg._native",
    '#include "matmul.h"',
    sources=["native/matmul.c"],
    include_dirs=["native"],
    extra_compile_args=["-O3", "-march=native", "-ffast-math"],
    libraries=["m"],
)

if __name__ == "__main__":
    ffibuilder.compile(verbose=True)
```

```c
// native/matmul.c
#include <immintrin.h>  // AVX2/AVX-512

int matmul_f32(const float* A, const float* B, float* C, int M, int N, int K) {
    for (int m = 0; m < M; m++) {
        for (int n = 0; n < N; n++) {
            __m256 sum = _mm256_setzero_ps();
            int k = 0;
            // Vectorized inner product (8 floats at a time)
            for (; k <= K - 8; k += 8) {
                __m256 a = _mm256_loadu_ps(&A[m * K + k]);
                __m256 b = _mm256_loadu_ps(&B[k * N + n]);
                sum = _mm256_fmadd_ps(a, b, sum);
            }
            // Horizontal sum
            float tmp[8];
            _mm256_storeu_ps(tmp, sum);
            float s = 0.0f;
            for (int i = 0; i < 8; i++) s += tmp[i];
            // Remainder
            for (; k < K; k++) s += A[m * K + k] * B[k * N + n];
            C[m * N + n] = s;
        }
    }
    return 0;
}
```

```python
# native/__init__.py
from mypkg._native import ffi, lib
import numpy as np

def matmul_f32(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    assert A.flags["C_CONTIGUOUS"] and B.flags["C_CONTIGUOUS"]
    assert A.dtype == np.float32 and B.dtype == np.float32
    M, K = A.shape
    K2, N = B.shape
    assert K == K2
    C = np.empty((M, N), dtype=np.float32, order="C")
    err = lib.matmul_f32(
        ffi.cast("const float*", A.ctypes.data),
        ffi.cast("const float*", B.ctypes.data),
        ffi.cast("float*", C.ctypes.data),
        M, N, K
    )
    if err: raise RuntimeError(f"matmul_f32 failed: {err}")
    return C
```

### Profiling
```bash
# CPU profiling
python -m cProfile -o profile.stats -m mypkg.bench
python -m pstats profile.stats <<< "sort cumulative\nstats 20"

# Line profiling
kernprof -l -v mypkg/perf.py  # @profile decorator

# Memory
python -m memory_profiler mypkg/perf.py  # @profile decorator
# Or
import tracemalloc
tracemalloc.start()
# ... code ...
snapshot = tracemalloc.take_snapshot()
top = snapshot.statistics("lineno")
for stat in top[:20]: print(stat)

# Native (perf)
perf record -g python -m mypkg.bench
perf report
```

---

## 3. Conversion (Python → Target)

### Conversion Pipeline
```
Python Reference (frozen) 
  → Specification (shapes, dtypes, tolerances, side effects)
  → Component-by-component conversion
  → Differential testing (intermediate + final)
  → Package with reproducible toolchain
  → Record intentional differences
```

### Specification Template
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

### Component-by-Component Conversion
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

### Differential Testing
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
        rtol=spec.rtol * 2, atol=spec.atol * 2,  # Accumulated error
        err_msg="Full forward mismatch"
    )
```

### Packaging Converted Artifacts
```python
# Build converted model as wheel
# pyproject.toml for native extension
[build-system]
requires = ["meson-python", "meson>=1.2", "ninja"]
build-backend = "mesonpy"

# meson.build
project('llama-cpp', 'cpp', default_options: ['cpp_std=c++20', 'warning_level=3', 'optimization=3'])
cpp = meson.get_compiler('cpp')

# Detect CUDA/HIP
cuda = find_cuda()
hip = find_hip()

# Sources
sources = [
    'src/embedding.cpp',
    'src/attention.cu',  # or .hip
    'src/mlp.cpp',
    'src/norm.cpp',
    'src/sampling.cpp',
    'src/model.cpp',
]

# Dependencies
deps = [
    dependency('cuda', required: cuda.found()),
    dependency('hip', required: hip.found()),
    dependency('cublas', required: cuda.found()),
    dependency('rocblas', required: hip.found()),
]

# Shared library
lib = shared_library('llama', sources, dependencies: deps,
    install: true, install_dir: 'mypkg/native')

# Python bindings (pybind11 or nanobind)
pybind = dependency('pybind11', method: 'cmake')
py_module = shared_module('llama_native', 'src/bindings.cpp',
    dependencies: [lib, pybind],
    install: true, install_dir: 'mypkg/native')
```

---

## 4. Reproducible Environments

### Lockfiles
```bash
# uv (fast, reliable)
uv pip compile pyproject.toml -o requirements.lock
uv pip sync requirements.lock

# Or pip-tools
pip-compile pyproject.toml -o requirements.lock
pip-sync requirements.lock
```

### Docker (Reproducible Build)
```dockerfile
# syntax = docker/dockerfile:1.7
FROM python:3.11-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake ninja-build pkg-config \
    libcuda-dev libcurand-dev libcusolver-dev
WORKDIR /build
COPY pyproject.toml requirements.lock ./
RUN pip install --no-cache-dir -r requirements.lock
COPY . .
RUN pip install --no-cache-dir --no-deps .

FROM python:3.11-slim AS runtime
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /build/mypkg /app/mypkg
WORKDIR /app
ENTRYPOINT ["python", "-m", "mypkg.cli.main"]
```

---

## Output Report

```
PYTHON ENGINEERING: <area> ANALYSIS
AREA: <engineering|performance|conversion>
PACKAGE: <name> <version>
TYPING: mypy/pyright clean ✅/❌
LINT: ruff clean ✅/❌
TESTS: unit✅/❌ integration✅/❌ contract✅/❌
PERF: <baseline> → <optimized> (<speedup>x)
CONVERSION: <component> diff < rtol/atol > ✅/❌
ENV: reproducible ✅/❌
BLOCKERS: <missing deps|native build|conversion gap>
```

---

## Boundaries

- Does not write kernel code (see `nvidia-cuda-stack`/`amd-gpu-stack`)
- Does not serve models (see `llm-serving`)
- Does not validate model formats (see `model-formats`)
- Does not validate LLM components in isolation (see `llm-components`)
- `stop python-engineering`: revert.