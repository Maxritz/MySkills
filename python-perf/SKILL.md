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
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        raise ValueError("cosine similarity is undefined for a zero vector")
    return sum(x * y for x, y in zip(a, b)) / denom

# ✅ Fast: NumPy vectorized
def fast_cosine_sim(a: NDArray[np.float32], b: NDArray[np.float32]) -> float:
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        raise ValueError("cosine similarity is undefined for a zero vector")
    return float(np.dot(a, b) / denom)

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
    if A.ndim != 2 or B.ndim != 2:
        raise ValueError("A and B must be two-dimensional")
    M, K = A.shape
    K2, N = B.shape
    if K != K2:
        raise ValueError("A.shape[1] must equal B.shape[0]")
    C = np.empty((M, N), dtype=A.dtype)
    for i in prange(M):
        for j in range(N):
            s = 0.0
            for k in range(K):
                s += A[i, k] * B[k, j]
            C[i, j] = s
    return C
```

The CPU example uses `fastmath=True`, which permits floating-point transformations that can change rounding and exceptional-value behaviour. Disable it when strict IEEE-style reproducibility is required, or compare results against an independent implementation with explicit tolerances.

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
    if A.ndim != 2 or B.ndim != 2 or A.shape[1] != B.shape[0]:
        raise ValueError("expected A[M,K] and B[K,N] with matching K")
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

## C Extensions (CFFI)

Native code is justified only after profiling. This example targets GCC/Clang on x86 and dispatches to AVX2+FMA only when the running CPU supports both. The scalar path is the fallback. Do not apply `-march=native` to a distributable binary without a deliberate deployment-CPU contract.

### Native implementation

```c
#include <errno.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>
#if defined(__x86_64__) && (defined(__GNUC__) || defined(__clang__))
#include <immintrin.h>
#endif

/* C-contiguous row-major: A[M,K] * B[K,N] -> C[M,N]. */
static void matmul_scalar(const float *A, const float *B, float *C,
                          int M, int N, int K)
{
    for (int m = 0; m < M; ++m)
        for (int n = 0; n < N; ++n) {
            float sum = 0.0f;
            for (int k = 0; k < K; ++k)
                sum += A[(size_t)m * (size_t)K + (size_t)k] *
                       B[(size_t)k * (size_t)N + (size_t)n];
            C[(size_t)m * (size_t)N + (size_t)n] = sum;
        }
}

#if defined(__x86_64__) && (defined(__GNUC__) || defined(__clang__))
__attribute__((target("avx2,fma")))
static void matmul_avx2(const float *A, const float *B, float *C,
                        int M, int N, int K)
{
    for (int m = 0; m < M; ++m) {
        int n = 0;
        /* Vectorise contiguous output columns, not the mismatched K lanes. */
        for (; n <= N - 8; n += 8) {
            __m256 acc = _mm256_setzero_ps();
            for (int k = 0; k < K; ++k) {
                __m256 a = _mm256_set1_ps(A[(size_t)m * K + k]);
                __m256 b = _mm256_loadu_ps(&B[(size_t)k * N + n]);
                acc = _mm256_fmadd_ps(a, b, acc);
            }
            _mm256_storeu_ps(&C[(size_t)m * N + n], acc);
        }
        for (; n < N; ++n) {
            float sum = 0.0f;
            for (int k = 0; k < K; ++k)
                sum += A[(size_t)m * K + k] * B[(size_t)k * N + n];
            C[(size_t)m * N + n] = sum;
        }
    }
}
#endif

int matmul_f32(const float *A, const float *B, float *C,
               int M, int N, int K)
{
    if (M < 0 || N < 0 || K < 0) return -EINVAL;
    if (M == 0 || N == 0) return 0;
    if (!C) return -EINVAL;
    if ((size_t)M > SIZE_MAX / (size_t)N) return -EOVERFLOW;
    size_t mn = (size_t)M * (size_t)N;
    if (mn > SIZE_MAX / sizeof(float)) return -EOVERFLOW;
    if (K == 0) { memset(C, 0, mn * sizeof(float)); return 0; }
    if (!A || !B) return -EINVAL;
    if ((size_t)M > SIZE_MAX / (size_t)K ||
        (size_t)K > SIZE_MAX / (size_t)N) return -EOVERFLOW;
    if ((size_t)M * (size_t)K > SIZE_MAX / sizeof(float) ||
        (size_t)K * (size_t)N > SIZE_MAX / sizeof(float)) return -EOVERFLOW;

#if defined(__x86_64__) && (defined(__GNUC__) || defined(__clang__))
    __builtin_cpu_init();
    if (__builtin_cpu_supports("avx2") && __builtin_cpu_supports("fma")) {
        matmul_avx2(A, B, C, M, N, K);
        return 0;
    }
#endif
    matmul_scalar(A, B, C, M, N, K);
    return 0;
}
```

### Header used by the CFFI declaration

Create `native/matmul.h` and keep this prototype in sync with the C implementation and `cdef` declaration:

```c
#ifndef MYPKG_MATMUL_H
#define MYPKG_MATMUL_H
int matmul_f32(const float *A, const float *B, float *C,
               int M, int N, int K);
#endif
```

### CFFI build and wrapper

```python
# native/build.py
from cffi import FFI

ffibuilder = FFI()
ffibuilder.cdef("""
    int matmul_f32(const float *A, const float *B, float *C,
                   int M, int N, int K);
""")
ffibuilder.set_source(
    "mypkg._native",
    '#include "matmul.h"',
    sources=["native/matmul.c"],
    include_dirs=["native"],
    extra_compile_args=["-O3"],
)
if __name__ == "__main__":
    ffibuilder.compile(verbose=True)
```

```python
# native/__init__.py
import numpy as np
from mypkg._native import ffi, lib

def matmul_f32(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    if A.ndim != 2 or B.ndim != 2 or A.shape[1] != B.shape[0]:
        raise ValueError("expected A[M,K] and B[K,N] with matching K")
    if A.dtype != np.dtype(np.float32) or B.dtype != np.dtype(np.float32):
        raise TypeError("inputs must use native-endian float32")
    if not A.flags.c_contiguous or not B.flags.c_contiguous:
        raise ValueError("inputs must be C-contiguous")
    M, K = A.shape
    K2, N = B.shape
    limit = np.iinfo(np.int32).max
    if max(M, N, K, K2) > limit:
        raise ValueError("dimension exceeds the native int API")
    if M == 0 or N == 0:
        return np.empty((M, N), dtype=np.float32)
    if K == 0:
        return np.zeros((M, N), dtype=np.float32)

    C = np.empty((M, N), dtype=np.float32)
    # Keep the exported buffer handles alive for the duration of the call.
    a_buf = ffi.from_buffer("const float[]", A)
    b_buf = ffi.from_buffer("const float[]", B)
    c_buf = ffi.from_buffer("float[]", C)
    status = lib.matmul_f32(a_buf, b_buf, c_buf, M, N, K)
    if status:
        raise RuntimeError(f"matmul_f32 failed with status {status}")
    return C
```

 
The native buffers must not overlap: `C` must not alias either input. The AVX2 kernel changes reduction order through FMA, so compare with an independent reference using explicit absolute and relative tolerances. Add tests for non-multiple-of-eight N, non-square shapes, zero dimensions, invalid shapes, oversized dimensions and CPUs without AVX2/FMA before using this example. The FP16/“half” ABI is intentionally omitted until its representation, alignment and conversion semantics are defined.

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