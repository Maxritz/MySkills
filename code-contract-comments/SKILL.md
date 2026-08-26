---
name: code-contract-comments
description: Write concise, accurate comments and contracts for functions, classes, APIs, kernels, and modules, including preconditions, ownership, invariants, side effects, errors, and concurrency.
---

# Code contracts and comments

Document behavior that a maintainer cannot safely infer from names and types.

For each public or non-obvious function, state purpose, inputs/outputs, ownership/lifetime, preconditions, postconditions, errors, side effects, thread/async safety, synchronization, and performance constraints. Explain why for non-obvious choices; do not narrate syntax or copy implementation details that can drift. Update comments with code changes, and verify every claim against the implementation and tests.

Use stable terminology for backend/component boundaries. Keep comments short, local, and actionable. Load `implementation-integrity` when the function is being created or modified, and `modular-component-boundaries` when documenting replaceable interfaces.
