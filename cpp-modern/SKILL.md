---
name: cpp-modern
description: "C++17/20: RAII, move, concepts, smart ptrs."
license: MIT
compatibility: opencode
---

# Modern C++

## RAII & Smart Pointers

- `std::unique_ptr` for sole ownership; `std::shared_ptr` only for shared ownership.
- `std::make_unique` / `std::make_shared` — never `new`/`delete` directly.
- RAII for all resources: file handles (`std::ifstream`), sockets, mutexes (`std::lock_guard`).

## Move Semantics

- Implement move constructor/assignment for types holding large resources.
- `std::move` only when transferring ownership; never use moved-from objects.
- Return by value (RVO/move) for local objects.

## C++20 Features

- `concept` for template constraints. `requires` clause for complex constraints.
- `std::span` for non-owning array views. Never use raw pointers for arrays.
- `co_await`/`co_yield` for async; keep coroutines simple and cancelable.
- `<ranges>` for lazy composable pipelines; prefer views over containers.

## Template Metaprogramming

- SFINAE → `concepts` (C++20). `std::enable_if` only for legacy code.
- `if consteval` for compile-time branching; `constexpr` for compile-time computation.
- Type erasure (`std::function`) only when polymorphic behavior needed without inheritance.
