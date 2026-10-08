<img width="1024" height="384" alt="banner png" src="https://github.com/user-attachments/assets/6fcc92f6-ab46-482c-a234-88b879b76313" />

# MySkills

A curated skill library for systems programming, GPU compute, LLM infrastructure, debugging, and production code quality. Each skill loads only when its trigger matches the active task, then unloads once its purpose is served — keeping context lean and focused.

## Current catalogue

35 skills, all at production depth (100–680 lines). No stubs. No placeholders.

| Skill | Purpose | When it loads |
|-------|---------|---------------|
| **amd-gpu-stack** | Unified AMD GPU: ROCm/HIP platform, ROCr/HSA runtime, CDNA (MI200/MI300), RDNA (RX 6000/7000). MFMA kernels, multi-GPU, profiling. | AMD GPU, ROCm, HIP, HSA, MI200, MI300, RX 6000/7000 |
| **nvidia-cuda-stack** | Unified CUDA: runtime, Hopper (H100/H200 FP8/TMA/cluster), Blackwell (B200/GB200 FP4/NVLink 5), Ampere (A100/RTX sparsity). Nsight, CUTLASS, TensorRT. | CUDA, NVIDIA, H100, H200, B200, FP8, FP4, TMA, Nsight |
| **vulkan-compute-stack** | Vulkan SDK 1.4.357.0: instance/device, VMA memory, buffers/descriptors, command buffers, synchronisation (fences/semaphores/timeline/barriers), GLSL→SPIR-V, subgroup/cooperative matrix. | Vulkan, VK_KHR, SPIR-V, glslc, VMA, compute shader |
| **c-systems** | Portable C99 and C++ systems code: ownership, ABI, RAII, templates, allocators, concurrency, performance contracts. Cross-language interop, porting discipline. | C99, C++, RAII, ABI, ownership, allocator, concurrency |
| **os-kernel-systems** | Linux kernel (modules, drivers, KASAN, ftrace), bare-metal OS (boot, paging, IDT, PCI), x86-64 architecture (ISA, SIMD, memory ordering), memory management (VM, allocators, NUMA, DMA). | Linux kernel, kernel module, driver, bootloader, paging, IDT, PCI |
| **linux-user-systems** | Linux/Windows userspace: syscalls, pthreads, epoll, IOCP, signals, IPC, systemd/cgroups, ETW, Win32/NT, system architecture (components, boundaries, data flow). | syscall, pthread, epoll, mmap, signal, IPC, systemd, cgroup, Win32, NT |
| **model-formats** | GGUF, SafeTensors, ONNX, OpenVINO IR. Validation checklists, cross-format golden tests, security rules, provenance tracking. | GGUF, SafeTensors, ONNX, OpenVINO, quantisation, shard |
| **llm-components** | LLM component contracts: tokenizer, embeddings, attention, KV cache, MLP/MoE, sampling, speculative decoding. Deterministic references, intermediate validation, numerical tolerances. | tokenizer, embeddings, attention, KV cache, MoE, sampling |
| **llm-serving** | Unified serving: vLLM (PagedAttention), SGLang (Radix/speculative), TensorRT-LLM (TRT engine/FP8/FP4/Triton), model-pool routing. Benchmarks, monitoring, deployment checklist. | vLLM, SGLang, TensorRT-LLM, Triton, PagedAttention, speculative |
| **llm-hardcode** | Hand-optimised LLM kernels: memory layout, cache-aware coding, SIMD intrinsics (AVX-512/AVX2), quantisation (Q4_0), numerical precision, validation. | LLM kernel, SIMD, quantisation, cache, AVX-512 |
| **python-engineering** | Production Python: packaging, typing, async, native extensions (cffi/Numba), profiling, conversion to C/CUDA/ONNX with differential testing, reproducible environments. | Python, NumPy, Numba, async, packaging, profiling |
| **c-systems** | Portable C99 and C++ systems code: ownership, ABI, RAII, templates, allocators, concurrency, performance contracts. Cross-language interop, porting discipline. | C99, C++, RAII, ABI, ownership, allocator, concurrency |
| **porting-toolkit** | Cross-porting workflow: capability matrix, change isolation, cross-compilation, toolchains, assembly, emulation. Six phases from matrix to validation. | port, cross-compile, cross-platform, adapter, capability probe |
| **architecture-boundaries** | Component architecture: modular boundaries, backend demarcation, porting isolation. Dependency direction, explicit interfaces, replacement seams, platform adapters. | component, module, architecture, boundary, backend, service |
| **optimization-toolkit** | Extreme optimisation: demoscene legends (farbrausch, Ryg, Haujobb) + kernel tuning (roofline, cache, SIMD, GPU occupancy). RDNA2/ROCr translation guide. | optimisation, demoscene, kernel tuning, roofline, SIMD |
| **traceability-gate** | Auto-triggered quality gate: trace markers [T-XXX], Doxygen contracts, no-fake-code rule, 10-iteration validation (compile, format, unit, fuzz, sanitizers, flow, resource, perf). | quality gate, Doxygen, trace, implementation integrity, 10-iteration |
| **knowledge-process** | Session continuity: analysis log (append-only delta), context tracker (local store), dev process (10-iteration validation), knowledge base (two-tier sanitised), App Engine deployment. | analysis log, context tracker, dev process, knowledge base |
| **low-level-toolkit** | Assembly, emulation, toolchains: ISA/ABI analysis, instruction selection, binary interfaces, emulator design, compiler/linker/sysroot reproducibility. | assembly, emulation, toolchain, ISA, ABI, binary, compiler |
| **utility-pair** | Two output styles: caveman (ultra-terse prose for humans) and ponytail (lazy senior dev, YAGNI, stdlib first, shortest path for code decisions). | caveman, ponytail, terse, lazy, YAGNI |
| **sherlock-it** | Performance investigation with persistent analysis log. FULL/HIGH/LOW modes. Baseline→decompose→instrument→investigate→optimise→verify. Diagnostic traps, hypothesis tracking, delta comparison across runs. | performance, profile, bottleneck, optimise, benchmark, trap |
| **ponytail-diag** | Structured debugging: one-line verdict by default, minimal/full expansion on demand. Internal model (call graph, truth tables, data-state flow). Hypothesis management, extended methods (fishbone, 5 whys, barrier, change, waterfall). Handoff to fix. | diagnose, one-line verdict, truth table, hypothesis, root cause |
| **debug-core** | Debug orchestrator: 12-step loop, truth tables, auto-unload, knowledge capture. Default entry for all debugging. | debug, reproduce, root cause, hypothesis, fix, verify |
| **debug-deep** | Escalation techniques: flow/state/contract/fishbone/FTA/5-whys/barrier/change/waterfall. Use only when fast loop cannot resolve. | deep debug, fishbone, fault tree, 5 whys, barrier analysis |
| **debug-fix** | Smallest patch for confirmed root cause. One causal hypothesis → one minimal patch → one verification cycle. Validation gates (compile, format, targeted test, reproducer, differential, sanitizers, regression). | apply fix, minimal patch, root cause fix |
| **debug-verify** | Verification ladder: static→build→targeted→reproducer→differential→regression→integration. Never claim unrun PASS. Risk-based escalation. | verify fix, validation, regression test, differential test |
| **debug-domain-router** | Load domain debug knowledge only when needed. Maps unresolved facts to minimal specialisations (C/C++, Windows, LLM, GGUF, quantisation, networking, GPU kernels, model serving, filesystem, distributed). Max two per cycle. | domain debug, specialised debug, C++ debug, GPU debug, LLM debug |
| **code-quality-gate** | Unified quality gate (merged from traceability-gate): trace markers, Doxygen contracts, no-fake-code, 10-iteration validation, Rust safety, component boundaries. Auto-triggers on code changes. | quality gate, Doxygen, contracts, validation, traceability |
| **plugin-adapter** | Universal plugin pattern: 4-step template (interface, implementation, registration, integration). Domain variants for compute, shader, quantisation, renderer, storage, network. | backend, adapter, vulkan, cuda, rocm, openvino, gpu, plugin |
| **demoscene** | Legendary demoscene optimisation patterns: farbrausch, Ryg, Haujobb, Wayfinder, Fiver2, Chaos Inc. Generic framework + RDNA2/ROCr/HSA translation guide. | demoscene, optimisation, farbrausch, Ryg, Haujobb |
| **knowledge-process** | Session continuity: analysis log (append-only delta), context tracker (local store), dev process (10-iteration validation), knowledge base (two-tier sanitised), App Engine deployment. | analysis log, context tracker, dev process, knowledge base |
| **low-level-toolkit** | Assembly, emulation, toolchains: ISA/ABI analysis, instruction selection, binary interfaces, emulator design, compiler/linker/sysroot reproducibility. | assembly, emulation, toolchain, ISA, ABI, binary, compiler |
| **utility-pair** | Two output styles: caveman (ultra-terse prose for humans) and ponytail (lazy senior dev, YAGNI, stdlib first, shortest path for code decisions). | caveman, ponytail, terse, lazy, YAGNI |
| **caveman** | Ultra-terse human-facing prose. Bullet points only. Caveman grammar. No preamble, no postamble, no pleasantries. | caveman, terse, minimal prose |
| **ponytail** | Lazy senior dev for code decisions. YAGNI ladder. Stdlib/native first. Intensity: lite/full/ultra. Marks shortcuts with upgrade path. | ponytail, lazy, YAGNI, stdlib, minimal |
| **rust-safety** | Rust ownership, lifetimes, error handling, memory safety, build/tooling, testing. No unwrap/expect in production. | Rust, ownership, lifetimes, unsafe, Cargo |
| **sglang-dev** | SGLang runtime: KV cache, tensor parallelism, speculative decoding, FlashInfer, server API, profiling, development flow. | SGLang, KV cache, tensor parallel, speculative, FlashInfer |
| **tensorrt-llm-dev** | TensorRT-LLM: C++ engine, Python build, quantisation (FP8/INT8/INT4/AWQ), tensor/pipeline parallelism, Paged KV cache, Triton backend, plugin system. | TensorRT-LLM, quantisation, tensor parallel, Triton, FP8 |
| **vllm-dev** | vLLM: PagedAttention, tensor parallel, Triton kernels, quantisation (GPTQ/AWQ/Marlin/SmoothQuant), GPU memory management, LoRA, monitoring, development flow. | vLLM, PagedAttention, tensor parallel, Triton, quantisation |
| **vulkan-compute** | Vulkan compute basics: instance/device, VMA memory, buffers/descriptors, command buffers, synchronisation, GLSL→SPIR-V, validation layers. | Vulkan, VK_KHR, SPIR-V, glslc, VMA, compute shader |
| **windows-system-architecture** | Windows internals: NT processes, threads, handles, I/O, security, WDDM, ETW, ABI, deployment. Separate Win32 contracts from NT details. | Windows, Win32, WDDM, ETW, WinDbg, handle |

## Loading model

Every skill declares:

```yaml
metadata:
  loading: on-demand
  auto_unload: true
```

A skill body loads only when its `trigger_keywords` match the active task (or when explicitly called). Once its purpose is served, it unloads — leaving only a one-line summary in context. No skill persists unless the task demands it.

The configuration lives in [`opencode.jsonc`](opencode.jsonc). Auto-trigger skills: `debug-core`, `traceability-gate`, `knowledge-process`. All others are conditional.

## Design principles

1. **Load the smallest specialist** that matches the active boundary.
2. **Add another skill only when the task crosses a concrete boundary** — API, ABI, memory, kernel, compiler, graphics, or model format.
3. **Keep shared workflows out of skills**; reference them explicitly when needed.
4. **No stubs, no placeholders, no fake success paths**. Every skill describes a complete, repeatable workflow with validation gates.
5. **Record the evidence**: version, host, target, toolchain, and what actually ran.

## Quality gate

`traceability-gate` (auto-triggered on code changes) enforces:

- Trace markers `[T-XXX]` on every non-trivial function
- Doxygen contracts with `@pre`/`@post`/`@param[in|out|in,out]`
- No `TODO`, `FIXME`, `pass`, `unimplemented!()`, stub functions, hardcoded test outputs
- 10-iteration validation: compile (`-Werror`), format, unit test, reproducer, golden test, fuzz, sanitizers, flow analysis, resource audit, performance (≤5% regression)

`implementation-integrity` is implicit — code must be real, complete, executable, and supported by executed evidence.

## Shared references

The `_systems-ml-shared/` directory holds version policy, porting checklists, model-format checklists, quality gates, and execution protocol. These are not skills and never auto-load. Read only the named file when the task requires it.

## Installation

Copy the repository root into your OpenCode skills directory. Preserve the layout: each skill is a directory with `SKILL.md` at the top level. Keep `_systems-ml-shared/` beside the skill directories.

Example calls:

```text
skill("amd-gpu-stack")
skill("llm-serving")
skill("porting-toolkit")
skill("debug-core")
```

For a cross-domain request, start with `systems-ml-stack-router` (if present) or let the conditional loader select the right set.

## Validation

Run the narrowest relevant build or test for any implementation change. Report anything not executed. The project validator checks: every configured skill exists, every `name` matches its directory, no initializer examples remain, JSON parses after comment removal.

## Licence

MIT. Individual skill files may include additional attribution or licensing notes where required.
