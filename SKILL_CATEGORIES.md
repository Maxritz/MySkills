# Skill Catalogue and Coverage Map

This file is derived from actual top-level skill directories, not a planned or historical inventory.

**Catalogue size on this branch: 63 skill directories.** Each skill appears in exactly one primary category below. Cross-links remain in individual skill bodies.

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

## 2. Systems, Operating Systems and Architecture (10)

- c-systems
- architecture-boundaries
- sys-arch
- bare-metal-kernel
- linux-kernel-dev
- linux-user
- windows-user
- memory-mgmt
- x86-arch
- low-level-toolkit

## 3. GPU Compute and Optimisation (7)

- amd-gpu-stack
- nvidia-cuda-stack
- vulkan-compute-stack
- shader-opt
- kernel-tuning
- optimization-toolkit
- demoscene-opt

## 4. LLM, Model Formats and Serving (9)

- llm-core
- llm-advanced
- llm-hardcode
- gguf-ggml
- model-formats
- llm-serving
- vllm-dev
- sglang-dev
- tensorrt-llm-dev

## 5. Porting and Language Engineering (5)

- porting-toolkit
- python-engineering
- python-perf
- python-conversion
- rust-safety

## 6. Quality, Knowledge and Workflow (6)

- goli-mat-de
- code-quality-gate
- traceability-gate
- traceability
- knowledge-process
- sherlock-it

## 7. Testing, Security, Delivery and Operations (6)

- testing-engineering
- security-review
- ci-release-engineering
- observability-engineering
- deployment-operations
- git-workflow

## 8. Networking, Data and API Contracts (3)

- networking-systems
- data-storage
- api-contracts

## 9. Output-Style Utilities (3)

- caveman
- ponytail
- utility-pair

## Observations from the audit

1. Before the catalogue-reconciliation change, the README claimed 32 skills while 40 skill directories existed. The reconciled catalogue grew to 54 skills, and this branch adds nine specialist skills for a total of 63.
2. The previous category document used many names that had no matching directories, including c99-systems, systems-ml-stack-router, implementation-integrity, cross-compilation and graphics-shader-kernels.
3. The previous loader configuration referred to absent directories and did not include all installed skill directories.
4. code-quality-gate and traceability-gate overlapped substantially and both claimed automatic triggering. The loader now designates only code-quality-gate as the automatic code-change gate.
5. The focused debugging skills restore links in the intended pipeline: localise → reproduce/reduce → form hypotheses → distinguish them → check invariants/reference → establish root cause → fix → verify.
6. GGUF/GGML notes needed factual correction and explicit version pinning. Binary constants and quantisation layouts must be checked against the exact upstream revision used.
7. CI needed to check real folder names and references without regex-stripping // inside JSON strings. The updated validator permits intentional overlap in trigger phrases.

## Recommended operating pattern

Use debug-core for the default debugging loop; load the focused debugging skill that resolves the current uncertainty; use goli-mat-de for systematic completeness audits; use sherlock-it when measured performance is the primary objective. Avoid loading multiple broad orchestrators for the same job.
