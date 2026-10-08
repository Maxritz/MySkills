---
name: c-systems
description: "Unified C/C++ systems: portable C99, C++ RAII/templates, ownership, ABI, concurrency, allocators, performance. Write, port, review, debug production systems code."
compatibility: opencode
metadata:
  loading: on-demand
  auto_trigger: true
  trigger_keywords: ["C99", "C++", "RAII", "ABI", "ownership", "lifetime", "allocator", "concurrency", "template", "systems code", "portable C", "performance contract"]
---

# C/C++ Systems

**Unified across C99 and C++**. Choose the language layer matching your task; both share ownership, ABI, and performance disciplines.

---

## 1. Portable C99 (C Layer)

### Ownership & Lifetime Contracts
```c
// Every struct documents ownership
typedef struct {
    // Owned: freed by tensor_free()
    float* data;
    // Borrowed: caller retains ownership
    const int64_t* shape;
    // Owned: freed by tensor_free()
    int64_t* strides;
    int64_t ndim;
} tensor_t;

// Function contract in Doxygen
/**
 * @brief Allocate tensor with given shape.
 * @param[out] out  Pointer to tensor handle (caller allocates)
 * @param[in]  shape  Array of dimensions (borrowed, length=ndim)
 * @param[in]  ndim   Number of dimensions
 * @return 0 on success, -ENOMEM on allocation failure
 * @pre shape != NULL, ndim > 0, ndim <= MAX_DIMS
 * @post *out is valid tensor_t with owned data/strides
 * @note Caller must call tensor_free(*out) when done
 */
int tensor_alloc(tensor_t* out, const int64_t* shape, int64_t ndim);
```

### Error Handling (No Exceptions)
```c
// Result type for fallible operations
typedef struct { int err; T value; } result_t;

// Usage
result_t res = tensor_alloc(&t, shape, ndim);
if (res.err) { handle_error(res.err); return res.err; }
tensor_t t = res.value;

// Macros for ergonomics
#define TRY(expr) do { int _err = (expr); if (_err) return _err; } while(0)
#define TRY_ASSIGN(var, expr) do { result_t _r = (expr); if (_r.err) return _r.err; (var) = _r.value; } while(0)
```

### Memory Safety
```c
// Checked arithmetic
#define CHECKED_ADD(a, b, out) \
    do { if (__builtin_add_overflow(a, b, out)) return -EOVERFLOW; } while(0)

#define CHECKED_MUL(a, b, out) \
    do { if (__builtin_mul_overflow(a, b, out)) return -EOVERFLOW; } while(0)

// Bounds-checked access
static inline int tensor_get(const tensor_t* t, const int64_t* idx, float* out) {
    int64_t offset = 0;
    for (int i = 0; i < t->ndim; i++) {
        if (idx[i] < 0 || idx[i] >= t->shape[i]) return -EINVAL;
        offset += idx[i] * t->strides[i];
    }
    *out = t->data[offset];
    return 0;
}
```

### Concurrency
```c
// Thread-safe reference counting
typedef struct {
    atomic_int refcount;
    // ... data ...
} refcounted_t;

static inline void ref_acquire(refcounted_t* obj) {
    atomic_fetch_add_explicit(&obj->refcount, 1, memory_order_acquire);
}

static inline void ref_release(refcounted_t* obj, void (*destroy)(refcounted_t*)) {
    if (atomic_fetch_sub_explicit(&obj->refcount, 1, memory_order_release) == 1) {
        atomic_thread_fence(memory_order_acquire);
        destroy(obj);
    }
}

// Mutex for complex invariants
typedef struct {
    pthread_mutex_t mutex;
    // ... protected data ...
} guarded_t;
```

### Build & Validation
```bash
# Strict compilation
CFLAGS="-std=c99 -Wall -Wextra -Wpedantic -Werror \
  -Wshadow -Wconversion -Wsign-conversion \
  -Wdouble-promotion -Wformat=2 \
  -fstack-protector-strong -D_FORTIFY_SOURCE=2 \
  -fsanitize=address,undefined -fno-omit-frame-pointer \
  -O2 -g3"

# Static analysis
clang-tidy --checks='*' --warnings-as-errors='*' *.c
cppcheck --enable=all --error-exitcode=1 .
```

---

## 2. C++ Systems (C++ Layer)

### Ownership Types
```cpp
// Value ownership (move-only)
class Tensor {
    std::unique_ptr<float[]> data_;
    std::vector<int64_t> shape_;
    std::vector<int64_t> strides_;
public:
    Tensor() = default;
    Tensor(Tensor&&) = default;
    Tensor& operator=(Tensor&&) = default;
    Tensor(const Tensor&) = delete;  // No accidental copies
    Tensor& operator=(const Tensor&) = delete;
    
    // Borrowed view
    TensorView view() const { return TensorView(data_.get(), shape_, strides_); }
};

// Borrowed view (non-owning, span-like)
class TensorView {
    float* data_;
    std::span<const int64_t> shape_;
    std::span<const int64_t> strides_;
public:
    TensorView(float* data, std::span<const int64_t> shape, std::span<const int64_t> strides)
        : data_(data), shape_(shape), strides_(strides) {}
    // No destructor - doesn't own data
};

// Factory returns value ownership
std::expected<Tensor, Error> make_tensor(std::span<const int64_t> shape);
```

### RAII & Resource Management
```cpp
// Custom deleter for C resources
struct CudaDeleter {
    void operator()(void* ptr) const { cudaFree(ptr); }
};
using CudaPtr = std::unique_ptr<void, CudaDeleter>;

struct FdDeleter {
    void operator()(int fd) const { if (fd >= 0) close(fd); }
};
using ScopedFd = std::unique_ptr<int, FdDeleter>;

// Scoped lock
class ScopedLock {
    std::mutex& mtx_;
public:
    explicit ScopedLock(std::mutex& m) : mtx_(m) { mtx_.lock(); }
    ~ScopedLock() { mtx_.unlock(); }
    ScopedLock(const ScopedLock&) = delete;
    ScopedLock& operator=(const ScopedLock&) = delete;
};
```

### ABI Control
```cpp
// Opaque handle for stable ABI
class TensorHandle {
    struct Impl;  // Forward declaration
    std::unique_ptr<Impl> impl_;
public:
    TensorHandle();
    ~TensorHandle();  // Defined in .cpp
    TensorHandle(TensorHandle&&) noexcept;
    TensorHandle& operator=(TensorHandle&&) noexcept;
    
    // No copy
    TensorHandle(const TensorHandle&) = delete;
    TensorHandle& operator=(const TensorHandle&) = delete;
    
    // C-compatible API
    extern "C" int tensor_alloc(TensorHandle*, const int64_t*, int64_t);
    extern "C" int tensor_free(TensorHandle);
};

// Template implementation hidden in .cpp
// Header only declares interface - no template bloat in ABI
```

### Concurrency
```cpp
// Thread-safe queue (bounded, blocking)
template<typename T>
class BlockingQueue {
    std::mutex mtx_;
    std::condition_variable not_empty_, not_full_;
    std::deque<T> queue_;
    size_t capacity_;
    bool closed_ = false;
public:
    explicit BlockingQueue(size_t cap) : capacity_(cap) {}
    
    // Returns false if closed
    bool push(T&& item) {
        std::unique_lock lock(mtx_);
        not_full_.wait(lock, [this]{ return queue_.size() < capacity_ || closed_; });
        if (closed_) return false;
        queue_.push_back(std::move(item));
        not_empty_.notify_one();
        return true;
    }
    
    // Returns false if closed and empty
    bool pop(T& out) {
        std::unique_lock lock(mtx_);
        not_empty_.wait(lock, [this]{ return !queue_.empty() || closed_; });
        if (queue_.empty() && closed_) return false;
        out = std::move(queue_.front());
        queue_.pop_front();
        not_full_.notify_one();
        return true;
    }
    
    void close() { std::lock_guard lock(mtx_); closed_ = true; not_empty_.notify_all(); not_full_.notify_all(); }
};
```

### Performance Contracts
```cpp
// Document performance expectations
/**
 * @brief Matrix multiply C = A @ B
 * @param A [M, K] row-major
 * @param B [K, N] row-major
 * @param C [M, N] row-major (pre-allocated)
 * @return 0 on success
 * 
 * Complexity: O(M*N*K) FLOPs
 * Memory: O(M*N + M*K + K*N) bytes
 * 
 * Performance targets (H100, FP16):
 *   M=N=K=4096: > 50 TFLOPS (70% peak)
 *   M=N=K=1024: > 30 TFLOPS
 * 
 * Uses: cuBLASLt GEMM with FP8 tensor cores
 */
int gemm(const half* A, const half* B, half* C, int M, int N, int K);
```

### Validation Gates
```bash
# Compile
CXXFLAGS="-std=c++20 -Wall -Wextra -Wpedantic -Werror \
  -Wshadow -Wconversion -Wsign-conversion \
  -Wdouble-promotion -Wformat=2 \
  -Wno-unused-parameter -Wnon-virtual-dtor \
  -fstack-protector-strong -D_FORTIFY_SOURCE=2 \
  -fsanitize=address,undefined -fno-omit-frame-pointer \
  -O2 -g3"

# ABI check
abi-compliance-checker -lib tensor -old old_headers -new new_headers

# Unit tests (deterministic)
ctest --output-on-failure

# Sanitizers
ASAN_OPTIONS=detect_leaks=1 ./tests

# Benchmarks (after correctness)
./bench_gemm --sizes=1024,2048,4096 --compare=cublas
```

---

## 3. Cross-Language Interop (C ↔ C++)

### C Interface for C++ Implementation
```cpp
// tensor.h (C-compatible)
#ifdef __cplusplus
extern "C" {
#endif

typedef struct TensorHandle TensorHandle;

int tensor_alloc(TensorHandle** out, const int64_t* shape, int64_t ndim);
int tensor_free(TensorHandle* handle);
int tensor_matmul(const TensorHandle* A, const TensorHandle* B, TensorHandle** out);

#ifdef __cplusplus
}
#endif
```

```cpp
// tensor.cpp (C++ implementation)
#include "tensor.h"
#include "Tensor.hpp"  // C++ class

extern "C" int tensor_alloc(TensorHandle** out, const int64_t* shape, int64_t ndim) {
    try {
        std::vector<int64_t> shape_vec(shape, shape + ndim);
        auto result = make_tensor(shape_vec);
        if (!result) return static_cast<int>(result.error());
        
        *out = new TensorHandle(std::move(*result));
        return 0;
    } catch (const std::bad_alloc&) {
        return -ENOMEM;
    } catch (...) {
        return -EINVAL;
    }
}

extern "C" int tensor_free(TensorHandle* handle) {
    delete handle;
    return 0;
}
```

---

## 4. Porting Discipline (C/C++ → Other)

### Capability Matrix
| Feature | C99 | C++ | Rust | Zig |
|---------|-----|-----|------|-----|
| RAII | Manual | ✅ | ✅ | defer |
| Generics | `_Generic`/void* | Templates | Generics | Comptime |
| Error handling | Return codes | `std::expected` | `Result` | Error unions |
| Concurrency | pthreads | `std::thread` | `std::thread` | `std.Thread` |
| SIMD | Intrinsics | Intrinsics/`std::simd` | `std::arch` | `@Vector` |
| ABI stability | ✅ | Opaque handles | `extern "C"` | `extern "C"` |

### Porting Checklist
- [ ] Freeze observable behavior (inputs/outputs/errors/timing)
- [ ] Separate portable core from platform adapters
- [ ] Map concepts: memory → allocator, threads → thread pool, sync → mutex/condvar
- [ ] Preserve reference implementation for differential testing
- [ ] Document intentional degradations (never silent)

---

## Output Report

```
C/C++ SYSTEMS: <layer> ANALYSIS
LANGUAGE: <C99|C++|interop>
OWNERSHIP: <value/ref/borrowed> contracts defined ✅/❌
ERROR_HANDLING: <return codes|expected|exceptions> consistent ✅/❌
ABI: <stable|opaque|template> boundaries controlled ✅/❌
CONCURRENCY: <mutex|atomic|lock-free> validated ✅/❌
SANITIZERS: ASan/UBSan/TSan clean ✅/❌
BENCHMARK: <target> vs <baseline> (<delta>%)
BLOCKERS: <list>
```

---

## Boundaries

- Does not write kernel code (see `os-kernel-systems`)
- Does not manage memory allocators (see `memory-management`)
- Does not optimize assembly (see `assembler`)
- `stop c-systems`: revert.