---
name: python-performance
description: "Py perf: NumPy, Numba, avoid hot loops."
license: MIT
compatibility: opencode
---

# Python Performance

## Vectorization

- Replace `for` loops with NumPy array operations. Use `np.einsum` for tensor contractions.
- `np.frombuffer` / `memoryview` for zero-copy data access.
- Pre-allocate arrays with `np.empty` / `np.zeros`; never grow lists in hot loops.

## JIT Compilation

- `@numba.njit` for scalar loops that won't vectorize. Add `cache=True` to avoid recompilation.
- `@numba.cuda.jit` for GPU kernels. Keep kernels simple (no dynamic allocation, no Python objects).
- Type annotations required for all function parameters and return values.

## C Extensions

- Use `cffi` or `ctypes` for calling C directly when NumPy/Numba isn't enough.
- `extern "C"` functions must have C ABI; no Python objects in the interface.
- Compile with `-O3 -march=native` when using `setuptools`/`cibuildwheel`.

## Async IO

- Use `asyncio` for I/O-bound concurrency (network, file). Not for CPU-bound work.
- `asyncio.gather` for independent coroutines. `asyncio.Semaphore` to bound concurrency.
- Never block the event loop with `time.sleep` — use `await asyncio.sleep`.

## Profiling

- `cProfile` + `pstats` for CPU profiling. `line_profiler` for line-level detail.
- `memory_profiler` for memory usage. `tracemalloc` for allocation tracking.
