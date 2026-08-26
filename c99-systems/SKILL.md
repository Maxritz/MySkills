---
name: c99-systems
description: Write, port, review, or debug portable C99 systems code with explicit ownership, ABI, error handling, concurrency, and low-level performance contracts.
---

# C99 systems

Prefer explicit data ownership and narrow C APIs over hidden global state.

1. Define representation, alignment, lifetime, aliasing, thread-safety, error, and cleanup contracts.
2. Keep platform/compiler extensions behind headers or adapters and use fixed-width types deliberately.
3. Check every allocation, size computation, index, conversion, syscall, and cleanup path.
4. Compile with strict warnings, sanitizers, static analysis, and multiple optimization levels where available.
5. Test malformed inputs, partial failures, concurrency, ABI boundaries, and the original reproducer.

Add `memory-management` for allocator/virtual-memory work, `assembler` for instruction-level work, and `cross-compilation` for target ABI changes.
