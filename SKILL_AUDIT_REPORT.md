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


## Model-format integrity fixes

The model-format guide now distinguishes GGUF tensor-data-relative offsets and block quantisation sizes from simple element-width estimates; removes the invalid assumption that SafeTensors tensor offsets must be 64-byte aligned; permits empty tensor ranges; treats shard indexes as a separate file; and requires duplicate-key, overlap, bounds and resource-limit checks. It also replaces a nested-tolerance dictionary/type bug with an explicit comparison contract, separates syntactic validity from runtime support and task quality, and directs OpenVINO conversion to the current OVC workflow while requiring version verification.

The guide references upstream specifications rather than claiming that a handcrafted parser or static example is already validated.


## Second deep pass: language, ISA and architecture examples

- `c-systems`: consolidated C99/C++ ownership, language-mode, ABI, exception-boundary and concurrency contracts; added checked size arithmetic, C-compatible public-header framing and target-specific validation.
- `python-engineering`: corrected package metadata layout, invalid `async` import-directory example, typing imports, async lifecycle, unimplemented service handler, broad cancellation behaviour and platform-specific signal assumptions.
- `python-conversion`: removed a hard-coded model-family shape manifest, mixed source languages in a single build snippet and placeholder CUDA/HIP discovery functions. Added a component-level semantic contract and independent differential-test helper.
- `porting-toolkit`: replaced unsafe cross-platform allocator macros and an incomplete assembly example with platform-capability contracts, one-delta-at-a-time porting and explicit hardware-versus-emulation acceptance.
- `low-level-toolkit`: removed a fixed-instruction-length emulator stub and a malformed SIMD reduction sample; added a target-specific assembly contract and runtime-dispatch requirement.
- `optimization-toolkit`: removed universal cache/occupancy assumptions and unverified RDNA2 dot-instruction claims; tuning techniques are now hypotheses confirmed by same-workload measurements.
- `nvidia-cuda-stack`: corrected the extended cluster-launch pattern to use launch attributes and added a version/capability gate.
- `amd-gpu-stack`: distinguishes API, runtime, ISA, OS support and profiling layers; avoids guessing queue placement or supported targets from GPU marketing names.
- `sys-arch` and `architecture-boundaries`: replace universal exactly-once payment claims and blind provider failover with durable pending state, idempotency scope, outbox/reconciliation and explicit cache-staleness contracts.
- `windows-user`: separates process exit status from Win32 failure, uses a mutable CreateProcess command-line buffer and documents overlapped-I/O completion lifetime and error paths.

## New specialist skills

- `windows-driver-dev`: WDK, KMDF/UMDF/WDM/WDDM distinctions, PnP/power lifecycle, IOCTL validation, DMA, signing and Driver Verifier/HLK gates.
- `llm-evaluation`: reproducible functional, numerical, task-quality, safety and performance gates for model/runtime changes.

The catalogue now targets 65 specialist skills and keeps full topic details on-demand. These changes are source-reviewed; this report does not claim all platform-specific samples were compiled or executed on native hardware.


## Goli-mat-de deep-audit reference

Expanded the optional audit matrix with catalogue/loader integrity, script and example validation, coverage-ledger fields, priority and confidence separation, retest criteria and an explicit audit-completion gate. The concise core remains under the 750-word budget; these extended checks are loaded only for broad audits.
