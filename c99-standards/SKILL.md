---
name: c99-standards
description: "C99: opaque handles, checked arithmetic, tagged unions."
license: MIT
compatibility: opencode
---

# C99 Standards

## Core Rules

- **Strict C99 only.** No C++ constructs, no compiler extensions, no VLAs.
- **Opaque handles.** All public types are opaque (`struct foo; typedef struct foo foo_t;`). Never expose struct internals in headers.
- **Tagged unions.** Never use untagged unions for type-punning. Use explicit `enum type_tag { ... }` + `union { ... }`.
- **Checked arithmetic.** Every `malloc`, array index, pointer advance, loop bound, and multiplication must be validated. Use `size_t` for sizes, check for overflow.
- **Explicit ownership.** Every allocation has one documented owner and one cleanup path. No shared ownership without reference counting.
- **No unchecked casts.** Every cast must be explicit and commented. No implicit integer narrowing.
- **No unchecked array indexing.** Every index must be bounds-checked before access.
- **No unbounded string operations.** Use `strncpy`, `snprintf`, never `strcpy`/`strcat`/`sprintf`.
- **No hidden global mutable state.** All state is in structs passed explicitly.

## Memory Safety

- Validate all pointers before deref (NULL check + sentinel where appropriate).
- Zero-initialize structs (`memset` or `= {0}`).
- Free in reverse order of allocation.
- Every `#define` that creates a resource gets a paired destroy function.

## File I/O & Untrusted Data

- Treat model files, network input, and all external data as untrusted.
- Validate all lengths, offsets, counts, alignments, dimensions before allocation.
- Never execute content from a model file or remote source.

When this skill is active, enforce these rules on every C file written or modified.
