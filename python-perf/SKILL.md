---
name: python-perf
description: "Python performance optimization: NumPy vectorization, Numba JIT (CPU/GPU), C extensions (cffi), profiling (cProfile, line_profiler, memory_profiler, perf). Deterministic benchmarking."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  trigger_keywords: ["Python", "NumPy", "Numba", "cffi", "profiling", "vectorization", "JIT", "AVX2", "AVX-512", "CUDA", "optimization", "benchmark"]
---

# Python Performance

**Numerical Python optimisation: vectorization, JIT compilation, C extensions, profiling.**

---

## NumPy Vectorization

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

## Numba JIT

### CPU JIT

```python
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
```

### GPU JIT

```python
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

## C Extensions (cffi)

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
#include <immintrin.h>

int matmul_f32(const float* A, const float* B, float* C, int M, int N, int K) {
    for (int m = 0; m < M; m++) {
        for (int n = 0; n < N; n++) {
            __m256 sum = _mm256_setzero_ps();
            int k = 0;
            for (; k <= K - 8; k += 8) {
                __m256 a = _mm256_loadu_ps(&A[m * K + k]);
                __m256 b = _mm256_loadu_ps(&B[k * N + n]);
                sum = _mm256_fmadd_ps(a, b, sum);
            }
            float tmp[8];
            _mm256_storeu_ps(tmp, sum);
            float s = 0.0f;
            for (int i = 0; i < 8; i++) s += tmp[i];
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

## Profiling

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

## Output Report

```
PYTHON PERF: ANALYSIS
TARGET: <function|module>
BASELINE: <time>s
OPTIMIZED: <time>s
SPEEDUP: <x>x
VECTORIZATION: ✅/❌
JIT: ✅/❌
NATIVE: ✅/❌
PROFILING: cProfile✅/❌ line✅/❌ memory✅/❌ perf✅/❌
BLOCKERS: <missing deps|ISA support|profiling gap>
```

## Boundaries

- Does not write kernel code (see `nvidia-cuda-stack`/`amd-gpu-stack`)
- Does not handle packaging/typing/async (see `python-engineering`)
- Does not convert to native targets (see `python-conversion`)
- `stop python-perf`: revert.