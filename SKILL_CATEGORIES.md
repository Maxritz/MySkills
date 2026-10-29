# Skill Catalogue and Coverage Map

This file is derived from actual top-level skill directories, not a planned or historical inventory.

**Catalogue size on this branch: 65 skill directories.** Each skill appears in exactly one primary category below. Cross-links remain in individual skill bodies.

## 1. Debugging and Diagnostics (14)

- debug-core
- debug-domain-router
- debug-deep
- debug-hypothesis
- debug-invariants
- debug-localize
- debug-mde
- debug-reduce
- debug-reference
- debug-reproduce
- debug-root-cause
- debug-fix
- debug-verify
- ponytail-diag

## 2. Systems, Operating Systems and Architecture (14)

- c-systems
- c99-systems
- architecture-boundaries
- sys-arch
- systems-ml-stack-router
- bare-metal-kernel
- linux-kernel-dev
- linux-user
- windows-user
- windows-driver-dev
- memory-mgmt
- x86-arch
- low-level-toolkit
- cross-compilation

## 3. GPU Compute and Optimisation (8)

- amd-gpu-stack
- nvidia-cuda-stack
- vulkan-compute-stack
- shader-opt
- graphics-shader-kernels
- kernel-tuning
- optimization-toolkit
- demoscene-opt

## 4. LLM, Model Formats and Serving (10)

- llm-core
- llm-advanced
- llm-hardcode
- gguf-ggml
- model-formats
- llm-serving
- llm-evaluation
- vllm-dev
- sglang-dev
- tensorrt-llm-dev

## 5. Porting and Language Engineering (5)

- porting-toolkit
- python-engineering
- python-perf
- python-conversion
- rust-safety

## 6. Quality, Knowledge and Workflow (11)

- goli-mat-de
- implementation-integrity
- code-quality-gate
- traceability-gate
- traceability
- knowledge-process
- app-engine-deploy
- build-ci
- security-hardening
- test-engineering
- sherlock-it

## 7. Output-Style Utilities (3)

- caveman
- ponytail
- utility-pair

## Observations from the audit

1. The previous README claimed 32 skills although the repository had 40 skill directories before this branch's additions.
2. Several previously named capabilities had no dedicated folder. This branch adds focused entries for C99, cross-compilation, shader-kernel implementation, general stack routing and implementation-integrity routing. Each remains a thin specialist or router where an existing skill is the source of truth.
3. The previous loader configuration referred to absent directories and did not include all installed skill directories.
4. code-quality-gate and traceability-gate overlapped substantially and both claimed automatic triggering. The loader now designates only code-quality-gate as the automatic code-change gate.
5. The focused debugging skills restore links in the intended pipeline: localise → reproduce/reduce → form hypotheses → distinguish them → check invariants/reference → establish root cause → fix → verify.
6. GGUF/GGML notes needed factual correction and explicit version pinning. Binary constants and quantisation layouts must be checked against the exact upstream revision used.
7. CI needed to check real folder names and references without regex-stripping // inside JSON strings. The updated validator permits intentional overlap in trigger phrases.

## Recommended operating pattern

Use debug-core for the default debugging loop; load the focused debugging skill that resolves the current uncertainty; use goli-mat-de for systematic completeness audits; use sherlock-it when measured performance is the primary objective. Avoid loading multiple broad orchestrators for the same job.
