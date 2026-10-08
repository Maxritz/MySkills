# Skill Categories Analysis

## 1. Debugging & Diagnostics (12 skills)
- debug-core
- debug-deep
- debug-domain-router
- debug-fix
- debug-hypothesis
- debug-invariants
- debug-localize
- debug-mde
- debug-reduce
- debug-reference
- debug-reproduce
- debug-root-cause
- debug-verify

## 2. Systems Programming & Architecture (10 skills)
- c99-systems
- cpp-systems
- linux-kernel
- linux-systems
- os-kernel
- system-architecture
- windows-system-architecture
- x86-architecture
- memory-management
- modular-component-boundaries

## 3. GPU / Compute Stacks (10 skills)
- cdna
- cuda-stack
- directx-ai-ml
- graphics-shader-kernels
- rdna
- rocm-stack
- rocr-runtime
- tensorrt-llm-dev
- vllm-dev
- vulkan-compute

## 4. ML / LLM Engineering (9 skills)
- gguf-format
- llm-components
- llm-hardcode
- model-pool
- safetensors-format
- sglang-dev
- systems-ml-stack-router
- _systems-ml-shared
- vino

## 5. Porting & Cross-Platform (6 skills)
- cross-compilation
- cross-porting
- porting-change-isolation
- assembler
- emulation
- toolchains

## 6. Code Quality & Integrity (6 skills)
- code-contract-comments
- dox-validate
- implementation-integrity
- rust-safety
- traceability
- backend-component-demarcation

## 7. Python Ecosystem (3 skills)
- python-conversion
- python-engineering
- python-performance

## 8. Performance & Optimization (3 skills)
- kernel-tuning
- sherlock-it
- ponytail-diag

## 9. Knowledge & Process (5 skills)
- analysis-log
- context-tracker
- dev-process
- knowledge-base
- app-engine-deploy

## 10. Specialized / Utility (10 skills)
- caveman
- plugin-adapter
- ponytail
- demoscene
- kernel-tuning
- ...

## Observations
- **Debug-* family**: 12 skills forming a pipeline (core → localize → hypothesize → fix → verify)
- **GPU stacks**: Multiple vendor-specific (CUDA, ROCm, DirectX, Vulkan) + format skills
- **ML stack**: End-to-end from formats → components → serving (vllm, sglang, tensorrt)
- **Porting**: Cross-compilation → platform-specific → change isolation
- **Overlaps**: Some skills could be merged (e.g., debug-* into fewer composite skills)

## Recommended Grouping Strategy
1. **Consolidate debug-*** into 3-4 composite skills
2. **Group GPU stacks** by vendor + common abstractions
3. **Create ML pipeline** from formats → training → serving
4. **Porting toolkit** as unified cross-platform skill
5. **Code integrity** as quality gate skill