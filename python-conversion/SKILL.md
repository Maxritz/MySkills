---
name: python-conversion
description: Convert Python models, numerical code, and pipelines to C/C++, CUDA/HIP, ONNX, MLIR, or deployable artifacts while preserving behavior, dtype, shape, and error contracts.
---

# Python conversion

Conversion is a semantic-preservation task, not a syntax translation. Keep the Python reference executable until the target passes differential tests.

1. Freeze inputs, outputs, shapes, dtypes, device placement, randomness, tolerances, and side effects.
2. Identify unsupported Python dynamism, external state, custom operators, and ABI boundaries.
3. Convert one component at a time, using explicit adapters for tensors, ownership, errors, and asynchronous execution.
4. Compare intermediate tensors and metadata, not just final output; test boundary sizes and failure cases.
5. Package the target with a reproducible toolchain and record any intentional numerical or feature differences.

Add `llm-components` for model semantics, `gguf-format` or `safetensors-format` for artifacts, and `cross-compilation` for non-host targets.
