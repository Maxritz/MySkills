---
name: debug-domain-router
description: "Load domain debug knowledge only when needed."
compatibility: opencode
metadata:
  role: debugging
  loading: on-demand
---

Ask: "What fact or test cannot be interpreted correctly without domain knowledge?"

Load the smallest specialization needed.

Examples:
- C/C++: lifetime, UB, ABI, ownership, build/link -> debug-localize + debug-reference
- Windows: toolchain, DLL/ABI, filesystem, threading -> debug-localize + debug-reproduce
- LLM: tensor/state/inference semantics -> debug-invariants + debug-reference
- GGUF: metadata/tensor encoding -> debug-invariants + debug-mde
- quantization: block formats and numerical reconstruction -> debug-invariants + debug-mde
- networking: protocol/state/packet semantics -> debug-reproduce + debug-root-cause
- **API endpoints: pool routing (cheap write -> main verify)** -> `model-pool`

Do not preload an entire domain pack merely because the repository belongs to that domain.
@see debug-core for unload after domain knowledge is consumed.
