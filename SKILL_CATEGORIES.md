# Skill Catalogue and Coverage Map

This file is derived from actual top-level skill directories, not a planned or historical inventory.

**Catalogue size on this branch: 74 skill directories.** Each skill appears in exactly one primary category below. Cross-links remain in individual skill bodies.

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

## 2. Systems, Operating Systems and Architecture (18)

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
- api-contracts
- data-storage
- networking-systems
- observability-engineering

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

## 6. Quality, Knowledge and Workflow (16)

- goli-mat-de
- implementation-integrity
- code-quality-gate
- traceability-gate
- traceability
- knowledge-process
- app-engine-deploy
- deployment-operations
- build-ci
- ci-release-engineering
- security-hardening
- security-review
- test-engineering
- testing-engineering
- git-workflow
- sherlock-it

## 7. Output-Style Utilities (3)

- caveman
- ponytail
- utility-pair

## Observations

- The current catalogue includes the original 65 main-branch skills plus nine additional specialist skills introduced by the runtime branch.
- Legacy loader fields such as `auto_trigger`, `conditional_load` and `trigger_keywords` are not OpenCode runtime controls. Native discovery is configured through `skills: ["./"]`; deterministic routing is implemented by the MySkills plugin.
- Use Goli-mat-de for systematic completeness audits, ponytail-diag for evidence-calibrated diagnosis, and sherlock-it for measured performance investigations.
- CI checks real directories, front matter, links, categories, routing inventory and runtime tests. Hardware-specific or credentialed evaluations must not be claimed unless evidence exists.
