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
- C/C++: lifetime, UB, ABI, ownership, build/link
- Windows: toolchain, DLL/ABI, filesystem, threading, OS behavior
- LLM: tensor/state/inference semantics
- GGUF: metadata/tensor encoding
- quantization: block formats and numerical reconstruction
- networking: protocol/state/packet semantics

Do not preload an entire domain pack merely because the repository belongs to that domain.
