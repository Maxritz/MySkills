# MySkills

> A modular, conditionally loaded skill library for systems programming, GPU compute, graphics, operating systems, compilers, model formats, LLM infrastructure, debugging, and production code quality.

The repository is designed for **progressive disclosure**. Skill metadata is used for routing; a skill body is loaded only when its trigger matches the active task; detailed procedures and version matrices live in on-demand references. This keeps unrelated domain knowledge out of context and reduces token consumption.

## Design principles

The suite follows five rules. First, load the smallest specialist that matches the active boundary. Second, add another skill only when the task crosses a concrete API, ABI, memory, kernel, compiler, graphics, or model-format boundary. Third, keep shared workflows in `_systems-ml-shared/` rather than copying them into every skill. Fourth, never present a placeholder, stub, fake success path, demo-only branch, or unverified claim as production functionality. Fifth, record version, host, target, toolchain, and validation evidence for time-sensitive work.

## Loading model

| Level | What is loaded | Purpose |
|---|---|---|
| Metadata | One concise `name` and `description` per skill | Route without loading implementation detail |
| Skill body | The matching `SKILL.md` only | Provide the minimum repeatable workflow |
| Reference | A named file only when its topic is active | Hold version tables, API notes, checklists, and detailed variants |

Use `systems-ml-stack-router` only when a request spans several domains or its boundary is unclear. Do not load the entire suite for a single C++, CUDA, Linux, or model-format task.

The configured auto-trigger skills are `debug-core`, `dev-process`, `dox-validate`, `traceability`, `context-tracker`, `knowledge-base`, and `analysis-log`. All domain, quality, and specialized debugging skills are conditional. The configuration is in [`opencode.jsonc`](opencode.jsonc).

## Canonical skill catalog

The repository contains **66 canonical skills**. Existing skills that overlapped the new compact modules were replaced rather than duplicated; the mapping is documented in [Canonical migrations](#canonical-migrations).

### Routing, architecture, and quality

| Skill | Load when | Scope |
|---|---|---|
| `systems-ml-stack-router` | A task spans domains or the correct specialist is unclear | Select the smallest skill set and interface boundaries |
| `system-architecture` | Designing an end-to-end system | Requirements, boundaries, performance budgets, failure domains, observability |
| `implementation-integrity` | Writing, repairing, or completing code | Reject stubs/placeholders and require executed evidence |
| `code-contract-comments` | Documenting functions, classes, APIs, or kernels | Preconditions, ownership, invariants, side effects, errors, concurrency |
| `modular-component-boundaries` | Splitting or reorganizing components | Ownership, interfaces, dependency direction, lifecycle, replacement seams |
| `backend-component-demarcation` | Designing backend or service layers | Transport, application, domain, persistence, workers, infrastructure |
| `porting-change-isolation` | Isolating platform-specific changes | Adapters, capability probes, fallbacks, differential validation |
| `plugin-adapter` | Adding interchangeable backends or plugins | Stable adapters and backend dispatch patterns |
| `model-pool` | Routing model calls or endpoint roles | Writer/verifier routing and model-pool configuration |
| `app-engine-deploy` | Deploying the supported application service | App Engine configuration and deployment workflow |
| `knowledge-base` | Recording or searching validated fixes | Sanitized two-tier bug/fix knowledge |
| `analysis-log` | Maintaining codebase analysis records | Append-only, project-scoped analysis notes |
| `context-tracker` | Persisting session findings | Disk-backed context summaries and unload behavior |
| `dev-process` | Planning and validating implementation work | Architecture-first iterative development |
| `dox-validate` | Maintaining API documentation | Doxygen and documentation completeness |
| `traceability` | Maintaining reversible evidence links | Trace markers and source/binary mapping |
| `ponytail` | Reducing unnecessary implementation complexity | YAGNI and smallest justified diff |
| `caveman` | Requesting terse communication | Minimal prose output mode |

### Debugging

| Skill | Load when | Scope |
|---|---|---|
| `debug-core` | Any software failure | Evidence-first reproduce, localize, fix, verify, regress loop |
| `debug-domain-router` | A failure needs domain interpretation | Select one domain skill without preloading all domains |
| `debug-reproduce` | The failure is not reliably reproducible | Capture and minimize a deterministic reproducer |
| `debug-localize` | The first wrong boundary is unknown | Bisect input, state, transformation, and output |
| `debug-reference` | Correct behavior is uncertain | Compare against specification or trusted implementation |
| `debug-hypothesis` | Several causes remain plausible | Keep a small explicit hypothesis set |
| `debug-mde` | A discriminating experiment is needed | Select the cheapest safe experiment |
| `debug-invariants` | A contract may be violated | Check bounds, types, ownership, and state invariants |
| `debug-root-cause` | Symptom and cause are being conflated | Establish the causal chain and confidence level |
| `debug-reduce` | The reproducer is too large | Minimize while preserving the failure |
| `debug-fix` | The cause is sufficiently supported | Apply the smallest justified change |
| `debug-verify` | A fix needs evidence | Run static, targeted, reproducer, and regression checks |
| `debug-deep` | The fast loop cannot resolve the issue | Escalate to state models, fault trees, or instrumentation |

### AMD and NVIDIA GPU stacks

| Skill | Load when | Scope |
|---|---|---|
| `rocm-stack` | ROCm/HIP libraries, profiling, or AMD GPU optimization | HIP, rocBLAS, RCCL, rocprof, rocminfo, packaging |
| `rocr-runtime` | ROCr/HSA runtime behavior | Agents, queues, AQL, signals, memory pools, code objects |
| `cdna` | AMD CDNA accelerator behavior | Matrix engines, MFMA, memory, and accelerator tuning |
| `rdna` | AMD RDNA graphics/compute behavior | Wave32, LDS, vector registers, graphics-oriented constraints |
| `cuda-stack` | CUDA runtime, driver, graphs, or kernels | Streams, events, graphs, cooperative groups, Nsight, fallbacks |
| `kernel-tuning` | GPU/CPU kernel performance tuning | Cache, bandwidth, SIMD, occupancy, profiling |
| `llm-hardcode` | Hand-optimizing LLM kernels | Layout, vectorization, cache, and low-level kernel design |
| `vulkan-compute` | Vulkan compute programming | Buffers, descriptors, command buffers, synchronization |
| `directx-ai-ml` | DirectX 12, DirectML, or Agility SDK | D3D12, DXGI, DXIL, resources, heaps, fences, ML operators |
| `graphics-shader-kernels` | Shader or graphics-kernel development | HLSL, GLSL, SPIR-V, barriers, subgroups, occupancy |
| `vino` | OpenVINO runtime or model deployment | IR and CPU/GPU/NPU inference paths |

For ROCm, ROCr, Vulkan, DirectX/Agility, DirectML, and RDNA version work, load `_systems-ml-shared/version-policy.md` first. It requires separating packaged releases, component Git tags, preview/nightly streams, drivers, SDKs, and hardware support instead of assuming that related version numbers are interchangeable.

### Operating systems, architecture, and memory

| Skill | Load when | Scope |
|---|---|---|
| `linux-kernel` | Kernel, module, driver, DMA, scheduler, or kernel MM work | Kconfig, subsystem contracts, tracing, locking, DMA, validation |
| `linux-systems` | Linux userspace systems programming | Syscalls, pthreads, epoll, mmap, systemd, process integration |
| `os-kernel` | Low-level OS boot and platform work | x86-64 long mode, GDT/IDT, paging, PCI, AHCI |
| `windows-system-architecture` | Windows internals or WDDM/ABI work | NT processes, threads, handles, I/O, ETW, deployment |
| `memory-management` | CPU/GPU/OS memory behavior | Virtual/physical memory, allocators, NUMA, DMA, cache/coherence |
| `x86-architecture` | x86/x86-64 ISA or platform behavior | Paging, caches, SIMD, atomics, CPUID, virtualization, ABI |
| `assembler` | Assembly, disassembly, or binary ABI work | x86-64/ARM/RISC-V conventions, instructions, relocations, unwind |
| `emulation` | Emulator or simulator development | ISA/device/system emulation, translation, timing, replay, fuzzing |

### Languages and build systems

| Skill | Load when | Scope |
|---|---|---|
| `c99-systems` | Portable C99 systems code | ABI, ownership, errors, aliasing, portability, sanitizers |
| `cpp-systems` | Production C++ systems code | RAII, templates, allocators, concurrency, ABI, testing |
| `python-conversion` | Translating Python into native/ML artifacts | Semantic preservation, dtype/shape, ABI, differential validation |
| `python-engineering` | Production Python implementation | Packaging, typing, async, extensions, profiling, testing |
| `python-performance` | Python numerical performance tuning | Vectorization, Numba, memory, hot-loop analysis |
| `cross-porting` | Porting APIs, kernels, or behavior across platforms | Capability mapping, adapters, differential tests |
| `cross-compilation` | Building for a non-host target | Host/target/sysroot/ABI, reproducible artifacts, target tests |
| `toolchains` | Compiler/linker/SDK/build diagnosis | GCC, Clang, MSVC, NVCC, HIP, CMake, Ninja, sysroots |
| `rust-safety` | Rust implementation or review | Ownership, lifetimes, unsafe boundaries, Cargo workspaces |

### LLM engines and model formats

| Skill | Load when | Scope |
|---|---|---|
| `llm-components` | Implementing or benchmarking LLM subsystems | Tokenization, embeddings, attention, KV cache, sampling, MoE, speculation |
| `gguf-format` | Parsing, converting, quantizing, or validating GGUF | Header, metadata, tensors, offsets, alignment, shards, safety |
| `safetensors-format` | Parsing, converting, or validating SafeTensors | Header, offsets, dtype/shape, shards, mmap, safety |
| `llamacpp-dev` | Existing llama.cpp integration work | llama.cpp runtime and GGUF integration |
| `sglang-dev` | Existing SGLang runtime work | KV cache, tensor parallelism, speculative decoding |
| `vllm-dev` | Existing vLLM runtime work | PagedAttention, tensor parallelism, Triton kernels |
| `tensorrt-llm-dev` | Existing TensorRT-LLM work | NVIDIA engine/runtime, FP8/INT8, parallelism |

## Canonical migrations

The following legacy names were removed as duplicate packages. Their strongest shared behavior is now maintained under the canonical modular skill; use the mapping when updating external references.

| Removed duplicate | Canonical skill |
|---|---|
| `c99-standards` | `c99-systems` |
| `cuda-optimization` | `cuda-stack` |
| `directx-compute` | `directx-ai-ml` |
| `gguf-ggml` | `gguf-format` |
| `rocm-hip` | `rocm-stack` |
| `rocr-core` | `rocr-runtime` |
| `safetensors-handler` | `safetensors-format` |
| `shader-opt` | `graphics-shader-kernels` when the task is broader than optimization |
| `windows-systems` | `windows-system-architecture` |
| `x86-assembly` | `assembler` when the task is general assembly/ABI work |
| `cpp-modern` | `cpp-systems` when the task is production systems C++ rather than language-only guidance |

Specialized non-duplicates such as `cdna`, `rdna`, `vulkan-compute`, `linux-systems`, `os-kernel`, `python-performance`, and the engine-specific skills remain separate because they have distinct trigger boundaries.

## Quality gate against false or incomplete code

`implementation-integrity` is conditional on code-writing tasks. It requires an explicit behavior contract, a search for TODO/FIXME/placeholder/stub/fake-success paths, a complete implementation, and executed evidence. A report must distinguish **PASS**, **FAIL**, **NOT RUN**, and **UNVALIDATED**. Comments do not replace implementation, and a demo path must never be silently used as a production path.

`code-contract-comments` documents only non-obvious behavior: preconditions, postconditions, ownership, lifetime, errors, side effects, synchronization, and performance constraints. `modular-component-boundaries` and `backend-component-demarcation` make component seams explicit so backends, workers, repositories, and platform adapters can be added, removed, or ported without spreading conditionals through unrelated code.

## Shared references and deduplication

The `_systems-ml-shared/` directory is intentionally not a skill and must never auto-load. Read only the named file when needed:

| Reference | Read only for |
|---|---|
| `shared-execution-protocol.md` | General implementation workflow and evidence labels |
| `quality-gates.md` | Completeness and anti-placeholder checks |
| `version-policy.md` | Release, preview, compatibility, or support claims |
| `porting-checklist.md` | Cross-platform behavior and capability mapping |
| `model-format-checklist.md` | Binary model artifact validation |
| `suite-manifest.md` | Bundle inventory and loading policy |

## Installation and use

The repository layout is directly discoverable by OpenCode: each skill is a directory containing `SKILL.md` at the repository root. Preserve the root layout when copying or extracting the repository into the OpenCode skills directory. Keep `_systems-ml-shared/` beside the skill directories so explicitly referenced files remain available without becoming auto-triggered skills.

Example calls are intentionally small:

```text
skill("cuda-stack")
skill("implementation-integrity")
skill("gguf-format")
skill("backend-component-demarcation")
```

For a cross-domain request, start with `systems-ml-stack-router`; do not manually load all domain modules.

## Validation

Validate every `SKILL.md` with the project’s skill validator or the local skill validator available in the execution environment. Also check that every configured skill name exists, every `name` matches its directory, no initializer examples remain, and the JSON configuration parses after comments are removed. For implementation changes, run the narrowest relevant build or test and report anything not executed.

## Contributing a skill

Create one narrowly triggered directory with a concise `SKILL.md`. Put version matrices, long API references, examples, and platform variants under a reference file. Keep the body below roughly 180 words when practical, avoid duplicating shared rules, state when another skill should be loaded, and never include fake or placeholder production code. Add the skill to `opencode.jsonc` only as conditional unless it is genuinely useful for nearly every task. Update the README catalog and migration table when names change.

## License

MIT. Individual skill files may include additional attribution or licensing notes where required.
