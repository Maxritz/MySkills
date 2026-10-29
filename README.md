<img width="1024" height="384" alt="Banner" src="https://github.com/user-attachments/assets/6ece47ad-09de-4882-9cd9-81c2dad9a605" />

# MySkills

**63 on-demand skills** for systems programming, GPU compute, LLM infrastructure, debugging, performance engineering and implementation integrity. Load the smallest relevant set, then bring in another skill only when the work crosses a real technical boundary.

## Catalogue

### Debugging and diagnostics
| Skill | Purpose |
|---|---|
| **debug-core** | Evidence-first debugging workflow and orchestration. |
| **debug-domain-router** | Selects the smallest technical debugging specialisation. |
| **debug-deep** | Escalation methods: state/flow, contracts, truth tables, fault tree, fishbone and change analysis. |
| **debug-hypothesis** | Maintains falsifiable hypotheses and distinguishing tests. |
| **debug-invariants** | Checks contract properties that can eliminate hypotheses. |
| **debug-localize** | Finds the first observable divergence and causal boundary candidates. |
| **debug-mde** | Selects the minimum distinguishing experiment. |
| **debug-reduce** | Shrinks an input or run while preserving failure. |
| **debug-reference** | Compares against a trusted specification or implementation. |
| **debug-reproduce** | Captures reliable failure invocations and environment facts. |
| **debug-root-cause** | Establishes the causal chain from failure to violated contract. |
| **debug-fix** | Applies a minimal patch for a confirmed cause. |
| **debug-verify** | Uses executed evidence and risk-based verification levels. |
| **ponytail-diag** | Compact verdict by default, deep diagnostic expansion when requested. |

### Systems, operating systems and architecture
| Skill | Purpose |
|---|---|
| **c-systems** | C99/C++ ownership, ABI, concurrency, allocation and portability. |
| **architecture-boundaries** | Component boundaries, dependency direction and backend replacement seams. |
| **sys-arch** | Platform-neutral architecture decomposition and contracts. |
| **bare-metal-kernel** | x86-64 boot, page tables, interrupts and PCI enumeration. |
| **linux-kernel-dev** | Linux kernel/driver debugging, KASAN, ftrace and lockdep. |
| **linux-user** | Linux processes, threads, I/O, IPC and hardening. |
| **windows-user** | Windows processes, synchronisation, IOCP, ETW and deployment. |
| **memory-mgmt** | Virtual memory, allocators, DMA/coherence and NUMA. |
| **x86-arch** | x86-64 ISA, memory ordering, SIMD and microarchitectural analysis. |
| **low-level-toolkit** | Assembly, emulation, toolchains, ABI and reproducible builds. |

### GPU compute and optimisation
| Skill | Purpose |
|---|---|
| **amd-gpu-stack** | AMD ROCm/HIP/ROCr and CDNA/RDNA architecture workflow. |
| **nvidia-cuda-stack** | CUDA runtime, GPU architecture, profiling and libraries. |
| **vulkan-compute-stack** | Vulkan compute setup, memory, dispatch, synchronisation and shader compilation. |
| **shader-opt** | Profile-guided shader optimisation with target-aware semantics. |
| **kernel-tuning** | CPU/GPU kernel profiling, bottleneck classification and controlled tuning. |
| **optimization-toolkit** | Broader performance optimisation and hardware-aware tuning. |
| **demoscene-opt** | Size- and cycle-conscious optimisation under measured constraints. |

### LLM, model formats and serving
| Skill | Purpose |
|---|---|
| **llm-core** | Tokenisation, embeddings, attention, KV cache, MLP and sampling. |
| **llm-advanced** | MoE, speculative decoding and numerical-tolerance validation. |
| **llm-hardcode** | Hand-optimised LLM kernels, memory layout and SIMD. |
| **gguf-ggml** | GGUF parsing, GGML tensor encodings, quantisation and safe model-file handling. |
| **model-formats** | GGUF, SafeTensors, ONNX and OpenVINO IR validation/conversion. |
| **llm-serving** | Architecture and operations across vLLM, SGLang and TensorRT-LLM. |
| **vllm-dev** | vLLM runtime, scheduling, KV cache and kernel development. |
| **sglang-dev** | SGLang runtime, RadixAttention, serving and profiling. |
| **tensorrt-llm-dev** | TensorRT-LLM engine, quantisation, parallelism and plugins. |

### Porting and language engineering
| Skill | Purpose |
|---|---|
| **porting-toolkit** | Semantics-preserving porting, capability matrices, adapters and toolchains. |
| **python-engineering** | Production Python, typing, packaging, async and reproducible environments. |
| **python-perf** | Python profiling, vectorisation, JIT and native extensions. |
| **python-conversion** | Component-by-component conversion with differential testing. |
| **rust-safety** | Rust ownership, lifetimes, FFI, async safety and testing. |

### Quality, knowledge and workflow
| Skill | Purpose |
|---|---|
| **goli-mat-de** | Thorough implementation-integrity audit for skipped work, fake code and false completion claims. |
| **code-quality-gate** | Code contracts, implementation integrity, traceability and validation gate. |
| **traceability-gate** | On-demand gate for trace markers, code contracts and verification requirements. |
| **traceability** | Focused source tracing and marker design for investigation. |
| **knowledge-process** | Session continuity, sanitised knowledge, analysis logs and development workflow. |
| **sherlock-it** | Measurement-driven performance investigation, instrumentation and regression comparison. |

### Testing, security, delivery and operations
| Skill | Purpose |
|---|---|
| **testing-engineering** | Designs meaningful unit, contract, integration, property, fuzz and regression tests. |
| **security-review** | Threat modelling, trust-boundary review and evidence-backed security findings. |
| **ci-release-engineering** | Reproducible CI, artefact provenance, release gates, rollout and rollback. |
| **observability-engineering** | Logs, metrics, traces, alerting, SLOs and instrumentation quality. |
| **deployment-operations** | Runtime configuration, health checks, staged deployment and recovery. |
| **git-workflow** | Safe branch, diff, commit, pull request and remote-state handling. |

### Networking, data and API contracts
| Skill | Purpose |
|---|---|
| **networking-systems** | Socket/protocol lifecycle, timeouts, cancellation, backpressure and network security. |
| **data-storage** | Consistency, transactions, durability, migration, backup and recovery. |
| **api-contracts** | Executable API contracts, versioning, error schemas, idempotency and compatibility. |

### Output-style utilities
| Skill | Purpose |
|---|---|
| **caveman** | Ultra-terse human-facing output. |
| **ponytail** | YAGNI-first code decisions and simplest workable implementation. |
| **utility-pair** | Selects caveman prose or ponytail code-decision style. |

## Loading and orchestration

- Load the smallest skill matching the active technical question.
- debug-core is the default debugging entry point and routes to relevant specialist skills.
- code-quality-gate is the sole automatic code-change quality gate. traceability-gate is on-demand to avoid two overlapping gates firing automatically.
- goli-mat-de is an explicit audit workflow. It requires source evidence and a coverage ledger, and gates task creation on the user's acknowledgement of the proposed task list.
- Keep shared concepts in clearly linked skills; do not preload all specialist bodies when header metadata is enough to route the task.
- Report what was actually inspected and executed. Never convert NOT RUN or UNVALIDATED into PASS.

## Design principles

1. No stubs, placeholders or fake success paths presented as completed functionality.
2. Requirements, contracts, implementation, configuration, tests and runtime wiring must agree.
3. Performance changes require a trustworthy baseline and correctness checks.
4. Skill names, descriptions, triggers and configuration references must remain consistent.
5. Use current, version-pinned specifications for changing binary formats, GPU stacks and toolchains.

## Validation

Run the repository workflow and inspect its results before claiming a skill update is validated. The CI validator checks skill front matter and folder-name agreement, loader and trigger-map coverage, metadata/auto-trigger agreement, relative Markdown references, the Goli-mat-de 750-word core budget and skill line limits.

## Installation

Copy the repository root into the OpenCode skills directory. Preserve the layout: each skill is a folder containing SKILL.md. Keep opencode.jsonc beside the skill folders.

Example explicit calls:
- skill("goli-mat-de")
- skill("debug-core")
- skill("gguf-ggml")
- skill("vulkan-compute-stack")

## Licence

MIT at repository level. Respect individual skill licence and attribution notes where present.
