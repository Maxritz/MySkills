---
name: c-systems
description: "C/C++ systems engineering: ownership, lifetime, ABI, concurrency, memory safety, portability, performance contracts and cross-language boundaries."
compatibility: opencode
---

# C/C++ Systems

Choose the language and platform contract before choosing a pattern. Load c99-systems for C99-only restrictions, rust-safety for Rust/FFI ownership, memory-mgmt for allocator and virtual-memory internals, and low-level-toolkit for assembly or ABI disassembly.

## 1. Contract before implementation

For every public function or type, record inputs, outputs, ownership, lifetime, error conditions, thread-safety, ABI and compatibility promises. Keep the contract in the header or interface, and test the boundary through the real public entry point.

- Mark pointers as owned, borrowed for the call, or borrowed until a specified lifetime ends. Document whether null and zero-sized inputs are valid.
- Specify whether outputs are unchanged on failure or partially written. Initialise out-parameters to a safe state before fallible work.
- Check lengths before arithmetic. Reject overflow before allocation, pointer arithmetic or byte-range construction.
- Do not treat a non-crashing run as proof against undefined behaviour, races, aliasing errors or invalid lifetime.
- Keep errors distinct: invalid input, unsupported feature, allocation failure, I/O failure and internal invariant violation must not collapse into a success-shaped default.

## 2. C language boundaries

C99 provides neither standard threads nor standard atomics. A project using stdatomic or the C11 thread library is not strict C99, even if a compiler accepts it as an extension. State the actual language standard and extension set.

Use size_t for object sizes and fixed-width integer types when representation is part of the contract. Validate signed-to-unsigned conversions, signed overflow, shift widths, alignment, pointer provenance assumptions, structure packing and endianness at binary/ABI boundaries.

Portable checked size multiplication:

    #include <errno.h>
    #include <stddef.h>
    #include <stdint.h>

    static int checked_mul_size(size_t a, size_t b, size_t *out)
    {
        if (out == NULL)
            return -EINVAL;
        if (a != 0 && b > SIZE_MAX / a)
            return -EOVERFLOW;
        *out = a * b;
        return 0;
    }

This helper checks multiplication only. Callers must separately check addition, alignment rounding, element-count constraints and allocator-specific limits. Do not replace these checks with assertions for externally supplied input.

## 3. C++ ownership and exceptions

- Prefer value ownership and RAII for resources. Use unique_ptr/shared_ptr only when their ownership semantics match the resource; file descriptors and OS handles commonly need small dedicated wrappers.
- Rule of zero is preferred. If a type directly owns a resource, define or delete copy/move operations consistently and ensure moved-from objects remain valid.
- A non-owning view must not outlive its owner. Make mutability explicit: a view over a const owner must not expose writable access.
- Do not let C++ exceptions cross a C ABI, callback ABI or foreign runtime boundary. Catch exceptions at the boundary and convert them to documented status codes.
- C++20 provides span; std::expected is C++23. Pin the language standard and standard library support instead of mixing these APIs in a nominal C++20 example.
- Condition-variable waits must use a predicate loop. Closing a queue must wake both producers and consumers. Define whether blocked callers drain queued items or fail immediately after closure.

A POSIX file descriptor wrapper should store the integer directly, not put the descriptor into unique_ptr<int> as though it were an allocated pointer. Define the platform close operation and ownership transfer explicitly. Windows HANDLE values require CloseHandle and have different invalid values from POSIX descriptors.

## 4. C/C++ ABI design

Use a C-compatible header with opaque handles and fixed-size or explicitly versioned structures. Keep C++ classes, templates, exceptions, standard-library types and compiler-specific layouts on the implementation side unless the ABI intentionally binds to a compiler/runtime.

    #ifndef TENSOR_C_API_H
    #define TENSOR_C_API_H
    #include <stddef.h>
    #include <stdint.h>

    #ifdef __cplusplus
    extern "C" {
    #endif

    typedef struct TensorHandle TensorHandle;

    int tensor_create(TensorHandle **out, const int64_t *shape, size_t ndim);
    void tensor_destroy(TensorHandle *handle);
    int tensor_matmul(const TensorHandle *a,
                      const TensorHandle *b,
                      TensorHandle **out);

    #ifdef __cplusplus
    }
    #endif
    #endif /* TENSOR_C_API_H */

The header only declares the C ABI. Define the opaque structure in the C++ implementation and define exported C-linkage functions at namespace scope, not inside a class. Use pointer-to-handle parameters consistently; never declare one signature and implement a subtly different one.

Before returning success, validate output pointers, dimensions, allocation-size overflow and all tensor shape relationships. On failure, release partial allocations and leave documented outputs in a safe state. Catch std::bad_alloc and other exceptions at the boundary. Map errors to a stable ABI-owned error set rather than leaking implementation-specific exception or enum values.

## 5. Concurrency, lifetime and memory ordering

- Identify the invariant protected by each mutex or atomic; an atomic variable does not make a multi-field object thread-safe.
- Refcounts must not resurrect freed objects, overflow, or race with object destruction. A release decrement and acquire fence alone do not solve unsafe publication or concurrent acquisition from an unowned raw pointer.
- Define publication and reclamation rules for lock-free structures; prefer a mutex until correctness and measured benefit justify greater complexity.
- Close/cancel semantics must wake waiters and ensure no callback touches destroyed state.
- Avoid unsynchronised access to shared buffers, data races and false assumptions that volatile is an inter-thread synchronisation primitive.
- Use sanitizers and targeted stress tests as evidence, not as a proof that every schedule is safe.

## 6. Build and validation

Record compiler/version, language mode, target ABI, flags, dependencies and build configuration. Prefer a project’s actual compiler and warning policy instead of copying platform-specific flags blindly.

Suggested checks where supported:
- GCC/Clang: strict warnings, ASan/UBSan, TSan on supported targets, static analysis and link-time diagnostics.
- MSVC: appropriate warning level, /analyze and supported sanitiser options for the toolchain.
- C/C++ ABI: compile headers as both C and C++, inspect exported symbols and compare ABI against a known release.
- Property/boundary tests: empty inputs, minimum/maximum dimensions, arithmetic overflow, invalid pointers, allocation failure, cancellation and concurrent destruction.
- Differential tests: compare against a simple trusted implementation with explicit numerical tolerances.

Use the project’s compile database when running clang-tidy; do not treat every possible check as a universally valid gate. Third-party or generated sources may require a declared exclusion list. Report which checks ran and which were unavailable.

## 7. Performance contracts

Do not hard-code universal FLOPS targets without specifying hardware SKU, clock/power state, data type, matrix dimensions, library/algorithm, warm-up, timing method and baseline. A target is a hypothesis until measured.

For matrix kernels, validate shape, strides, alignment, aliasing and accumulation precision. Separate setup/copy time from the timed region. Compare against the best suitable library on the same workload, and report median plus spread and correctness delta. Use Sher­lock-It for root-cause profiling and optimization-toolkit or kernel-tuning for focused tuning.

## Output report

    C/C++ SYSTEMS: ANALYSIS
    LANGUAGE/STANDARD: target, ABI and extensions
    OWNERSHIP: owned/borrowed/transferred contracts
    ERROR PATHS: invalid input, partial failure, cleanup
    CONCURRENCY: invariants and memory ordering
    ABI: exported interface and compatibility checks
    TESTS: commands, result, sanitizers and limitations
    PERFORMANCE: same workload, baseline and measurement spread
    STATUS: PASS / FAIL / BLOCKED / NOT RUN
    BLOCKERS: explicit list

## Boundaries

- Use linux-kernel-dev or bare-metal-kernel for kernel-space implementation.
- Use memory-mgmt for allocator, virtual-memory and DMA detail.
- Use low-level-toolkit for assembly and target ABI inspection.
- Use c99-systems when strict C99 is a hard requirement.
