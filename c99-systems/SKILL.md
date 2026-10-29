---
name: c99-systems
description: C99-focused systems programming, portable APIs, memory and integer safety, ABI boundaries, and strict compiler validation.
compatibility: opencode
---

# C99 Systems

Use this skill when the implementation must remain valid C99 or when C semantics, headers or ABI portability are the central risk. Load c-systems for mixed C/C++, RAII or broader systems work.

## Design rules

- Make ownership explicit for every allocated object, buffer, file handle and callback context. Distinguish owned, borrowed and transferred pointers.
- Validate lengths before arithmetic and allocation. Check multiplication and addition overflow before computing byte sizes; handle zero-length inputs and allocation failure.
- Avoid undefined behaviour: out-of-bounds access, invalid shifts, signed overflow, misaligned typed access, invalid pointer arithmetic, uninitialised reads, strict-aliasing violations and use-after-free.
- Use fixed-width types only where representation is part of the contract. Use size_t for object sizes and document wire-format endianness and widths explicitly.
- Keep public headers self-contained, guarded and free of private implementation details. Document calling convention, structure layout, symbol visibility and lifetime expectations at ABI boundaries.
- C99 has no standard atomics, threads or generic lambda-like cleanup. Define portability boundaries instead of silently importing C11 or C++ assumptions. Use a platform abstraction or a documented compiler extension where required.
- Centralise cleanup for multi-resource functions. A goto cleanup path is valid C practice when it ensures each acquired resource is released exactly once.
- Return explicit status values; distinguish invalid input, allocation failure, I/O failure and unsupported capability. Do not hide errors behind success-shaped defaults.

## Validation sequence

1. Compile public headers in a translation unit by themselves.
2. Build with strict warnings and the actual target compiler. Record compiler version and language mode.
3. Run unit and boundary tests for empty, minimal, maximal, overflow and malformed inputs.
4. Use ASan/UBSan or the platform equivalent where supported; add fuzzing for parsers and complex input routines.
5. Test ABI layout and symbol exports on every supported target. A successful host build does not establish cross-target compatibility.

## Completion evidence

Report target/compiler, flags, tests executed, sanitizers available, known extensions and checks not run. Never claim ISO C99 portability if the implementation relies on a compiler or platform extension.
