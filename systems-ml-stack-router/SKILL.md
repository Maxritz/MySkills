---
name: systems-ml-stack-router
description: Routes systems and machine-learning infrastructure tasks to the smallest useful architecture, language, operating-system, GPU or inference skill set.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["systems stack", "ML stack", "which skill", "architecture routing", "select backend"]
---

# Systems and ML Stack Router

Choose skills by the unresolved technical boundary, not by every technology mentioned. Load one primary skill and at most two specialists at a time; add another only when evidence crosses a boundary.

| Task focus | Primary skill | Add only when needed |
|---|---|---|
| Module ownership, dependency direction, replacement seams | sys-arch or architecture-boundaries | porting-toolkit |
| C99 or mixed C/C++ runtime | c99-systems or c-systems | memory-mgmt, rust-safety |
| Bare metal, Linux kernel or OS process behaviour | bare-metal-kernel, linux-kernel-dev or linux-user | windows-user, memory-mgmt |
| Windows/Linux cross-build and toolchain breakage | cross-compilation | build-ci, porting-toolkit |
| GPU runtime, driver, device queues or allocation | amd-gpu-stack, nvidia-cuda-stack or vulkan-compute-stack | graphics-shader-kernels |
| Shader correctness or shader throughput | graphics-shader-kernels or shader-opt | one relevant GPU stack |
| Model files, tensor layout or quantised kernels | model-formats or gguf-ggml | llm-hardcode, llm-core |
| LLM execution, MoE or inference semantics | llm-core or llm-advanced | llm-serving |
| Serving scheduler or engine-specific defects | llm-serving, vllm-dev, sglang-dev or tensorrt-llm-dev | llm-advanced |
| Performance investigation | sherlock-it | kernel-tuning or optimization-toolkit |
| Test strategy or flaky validation | test-engineering | debug-verify |
| Build graph, CI, packaging or toolchain | build-ci | cross-compilation |
| Security or untrusted inputs | security-hardening | domain skill for affected subsystem |
| Possible fake, skipped or falsely reported work | goli-mat-de | code-quality-gate for code changes |

## Routing protocol

1. State the unknown or required decision in one sentence.
2. Pick the narrowest primary skill and inspect its scope before loading more.
3. If the task spans layers, follow the actual call or data path and add a skill at the boundary under investigation.
4. Unload unrelated context. Routing does not prove the underlying implementation was inspected.
