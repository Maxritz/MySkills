# Skill Catalogue Audit Report

**Revision scope:** the MySkills catalogue after the Goli-mat-de audit expansion.  
**Catalogue:** 63 skill directories, with the shared quality standard stored at repository root.

## Scope and method

- Inventoried all 54 pre-existing skill files and checked front matter, headings, validation/evidence signals, failure-path coverage, output contracts, and cross-references against actual skill directories.
- Compared the loader configuration, category map and README against the repository tree.
- Inspected and revised confirmed cases of stale references, duplicated runbooks, overly mixed responsibilities and examples that could be mistaken for real measurements.
- Added focused skills where the catalogue had named capabilities without a dedicated route or lacked an important operational discipline.

This was a catalogue-wide structural and consistency audit with targeted content review, not an execution of every skill or a line-by-line verification of every version-sensitive technical claim. The shared standard requires upstream verification when such claims are used.

## Changes

### Continuous integrity standard

OpenCode loads `SKILL_QUALITY_STANDARD.md` through the top-level `instructions` setting. This applies the compact Goli-mat-de loop across tasks without automatically loading the full audit skill into every context. The full `goli-mat-de` skill remains on-demand to control context cost.

### Focused additions

- `c99-systems`: C99 language and ABI constraints.
- `systems-ml-stack-router`: smallest-skill routing for systems and ML infrastructure.
- `implementation-integrity`: entry point to the authoritative integrity, code-quality and traceability skills.
- `cross-compilation`: target tuple, sysroot, host/target separation and artefact validation.
- `graphics-shader-kernels`: shader contracts, bounds, barriers, memory semantics and portability.
- `test-engineering`: contract, integration, differential, property, fuzz, stress and regression strategy.
- `build-ci`: reproducible build diagnosis and trustworthy CI gates.
- `security-hardening`: threat boundaries, parsing, resource exhaustion, secrets and least privilege.
- `app-engine-deploy`: deployment, IAM, secrets, staged rollout, observability and rollback.

Router skills point to a single authoritative specialist rather than copying its full implementation guide.

### Refactoring and consistency

- Extracted App Engine deployment detail from `knowledge-process`.
- Reduced `llm-serving` from duplicated engine-specific runbooks to shared serving contracts and routing to `vllm-dev`, `sglang-dev` and `tensorrt-llm-dev`.
- Corrected stale cross-references in systems, GPU and LLM skills.
- Labelled sample run entries as illustrative rather than treating them as executed benchmark evidence.
- Added CI checks for category-map parity, configured instruction files and a 750-word budget for the Goli-mat-de core.

## Token budget

The Goli-mat-de core is 696 words (5,516 characters); its optional deep-audit matrix is loaded only for wider audits. The former core was 17,621 characters. The core is therefore about 69% smaller by characters, while retaining the detailed matrix outside the default load path. Token counts vary by tokenizer and were not measured directly.

## Verification contract

Before merging this work, the current branch must pass repository CI. Passing structural checks demonstrates catalogue consistency, not that every skill is semantically correct or that every GPU, operating-system and cloud workflow has been executed. Hardware-specific or credentialed tests must be reported as BLOCKED or NOT RUN when unavailable.

## Targeted implementation defects corrected

- Bare-metal examples: replaced the wrapping 8-bit PCI bus loop with a bounded wider counter; corrected the PML4 → PDPT → PD hierarchy; made BSS clearing byte-exact; removed destructive BAR-size probing from enumeration; clarified that the BIOS transition is illustrative and that exception-frame layout must match assembly stubs.
- Linux kernel example: replaced a character-driver sketch with undefined read/write callbacks by a self-contained read-only misc-device example; removed misleading generic debugfs toggles for KASAN/lockdep and documented build-configuration prerequisites.
- Python performance example: fixed the AVX2 matrix kernel to vectorise contiguous output columns, added CPU feature dispatch, scalar fallback, dimension/overflow guards, strict C-contiguity and dtype checks, and a consistent CFFI header contract.
- Inference engine guides: replaced duplicated vLLM/SGLang/TensorRT-LLM internal snippets with version-pinned investigation workflows, accurate smoke-test expectations and correctness/performance evidence requirements.
- Windows IOCP guidance: explicitly covers overlapped-I/O lifetime, immediate completion versus pending completion, and completion errors. Removed an unrelated Kubernetes chaos tool from generic Windows validation.

These are source reviews and edits. They have not yet been claimed as compiled or executed; CI and platform-specific checks must supply that evidence.

## Context and trigger-budget consistency

- Normalised per-skill `auto_trigger` metadata to match the actual loader policy. Only `debug-core`, `code-quality-gate` and `knowledge-process` are automatic; the specialist skills remain conditional/on-demand. CI now rejects drift between a declared metadata flag and the loader set, and requires an explicit workflow update if the automatic set changes.
- Split `vulkan-compute-stack` into a 160-line decision guide and optional API-pattern reference, preserving the code detail without requiring the full boilerplate in every Vulkan context. This is a token/context-load reduction, not a claim that the snippets were compiled on a GPU.
