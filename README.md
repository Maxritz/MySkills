<img width="1024" height="384" alt="Banner" src="https://github.com/user-attachments/assets/6ece47ad-09de-4882-9cd9-81c2dad9a605" />

# MySkills

35 skills for systems programming, GPU compute, LLM infrastructure, debugging, and production code quality. Each skill loads on demand, does its job, then unloads. No context bloat.

## Catalogue

| Skill | What it does | Triggers |
|-------|--------------|----------|
| **amd-gpu-stack** | AMD GPU: ROCm/HIP platform, ROCr/HSA runtime, CDNA (MI200/MI300), RDNA (RX 6000/7000). MFMA kernels, multi-GPU, profiling. | AMD GPU, ROCm, HIP, HSA, MI200, MI300, RX 6000/7000 |
| **nvidia-cuda-stack** | CUDA: runtime, Hopper (H100/H200 FP8/TMA/cluster), Blackwell (B200/GB200 FP4/NVLink 5), Ampere (A100/RTX sparsity). Nsight, CUTLASS, TensorRT. | CUDA, NVIDIA, H100, H200, B200, FP8, FP4, TMA, Nsight |
| **vulkan-compute-stack** | Vulkan SDK 1.4.357.0: instance/device, VMA memory, buffers/descriptors, command buffers, sync (fences/semaphores/timeline/barriers), GLSL to SPIR-V, subgroup/cooperative matrix. | Vulkan, VK_KHR, SPIR-V, glslc, VMA, compute shader |
| **c-systems** | C99 and C++ systems code: ownership, ABI, RAII, templates, allocators, concurrency, performance contracts. Cross-language interop, porting discipline. | C99, C++, RAII, ABI, ownership, allocator, concurrency |
| **linux-kernel-dev** | Linux kernel: modules, drivers, KASAN, ftrace, lockdep, perf, crash debugging. Kernel-space and kernel/driver boundary work. | Linux kernel, kernel module, driver, KASAN, ftrace, lockdep, perf |
| **bare-metal-kernel** | Bare-metal OS kernel: boot process (GRUB/Stivale2), long mode, page tables (4-level), IDT/interrupts, PCI enumeration. x86-64 kernel from bootloader to long mode. | bootloader, GRUB, Stivale2, long mode, page tables, PML4, IDT, interrupts, PCI |
| **x86-arch** | x86-64 architecture deep-dive: ISA contracts, memory ordering, atomicity, privilege, paging, interrupts, CPUID, SIMD (AVX-512/AVX2/SSE), perf top-down analysis. | x86-64, ISA, memory ordering, TSO, atomicity, privilege, paging, interrupts, CPUID, SIMD |
| **memory-mgmt** | Memory management: virtual memory layouts, allocator hierarchy (buddy, SLAB, vmalloc, CMA, GPU), DMA & coherence, NUMA-aware allocation, validation (kmemleak, buddyinfo, numastat). | virtual memory, allocator, buddy, SLAB, SLUB, vmalloc, CMA, DMA, coherence, NUMA |
| **linux-user** | Linux userspace: syscalls, pthreads, epoll, mmap, signals, IPC, systemd/cgroups, security hardening (seccomp, capabilities). | syscall, pthread, epoll, mmap, signal, IPC, systemd, cgroup, process, thread |
| **windows-user** | Windows userspace: Win32/NT processes, threads, handles, IOCP, ETW, driver model (WDDM/KMDF/UMDF), deployment (MSI/MSIX). | Windows, Win32, NT, process, thread, handle, IOCP, ETW, WDDM, KMDF, UMDF |
| **sys-arch** | System architecture (platform-agnostic): architecture decomposition, component contracts, non-functional budgets, dependency direction, cross-platform patterns, validation gates. | architecture, component, boundary, dependency direction, non-functional, budget, contract |
| **model-formats** | GGUF, SafeTensors, ONNX, OpenVINO IR. Validation checklists, cross-format golden tests, security rules, provenance tracking. | GGUF, SafeTensors, ONNX, OpenVINO, quantisation, shard |
| **llm-core** | LLM core components: tokenizer, embeddings, attention, KV cache, MLP, sampling. Deterministic reference, intermediate validation, numerical tolerances. | tokenizer, embeddings, attention, KV cache, MLP, sampling |
| **llm-advanced** | LLM advanced components: Mixture of Experts (router, expert capacity, shared experts), speculative decoding (standard, Medusa, EAGLE), extended numerical tolerances per precision. | MoE, Mixture of Experts, speculative decoding, Medusa, EAGLE, router, expert |
| **llm-serving** | Unified serving: vLLM (PagedAttention), SGLang (Radix/speculative), TensorRT-LLM (TRT engine/FP8/FP4/Triton), model-pool routing. Benchmarks, monitoring, deployment checklist. | vLLM, SGLang, TensorRT-LLM, Triton, PagedAttention, speculative |
| **llm-hardcode** | Hand-optimised LLM kernels: memory layout, cache-aware coding, SIMD intrinsics (AVX-512/AVX2), quantisation (Q4_0), numerical precision, validation. | LLM kernel, SIMD, quantisation, cache, AVX-512 |
| **python-engineering** | Production Python: packaging, typing, async, native extensions (cffi/Numba), profiling, reproducible environments (uv, Docker). | Python, NumPy, Numba, async, packaging, profiling |
| **python-perf** | Python performance: NumPy vectorization, Numba JIT (CPU/GPU), C extensions (cffi), profiling (cProfile, line_profiler, perf). | Python, NumPy, Numba, cffi, profiling, vectorization, JIT, AVX2, AVX-512, CUDA |
| **python-conversion** | Python to native conversion: component-by-component translation to C/C++/CUDA/HIP/ONNX/MLIR with differential testing. Frozen reference, specification template, tolerance tracking. | Python, conversion, C++, CUDA, HIP, ONNX, MLIR, differential test |
| **porting-toolkit** | Cross-porting workflow: capability matrix, change isolation, cross-compilation, toolchains, assembly, emulation. Six phases from matrix to validation. | port, cross-compile, cross-platform, adapter, capability probe |
| **architecture-boundaries** | Component architecture: modular boundaries, backend demarcation, porting isolation. Dependency direction, explicit interfaces, replacement seams, platform adapters. | component, module, architecture, boundary, backend, service |
| **optimization-toolkit** | Extreme optimisation: demoscene legends (farbrausch, Ryg, Haujobb) plus kernel tuning (roofline, cache, SIMD, GPU occupancy). RDNA2/ROCr translation guide. | optimisation, demoscene, kernel tuning, roofline, SIMD |
| **traceability-gate** | Auto-triggered quality gate: trace markers [T-XXX], Doxygen contracts, no-fake-code rule, 10-iteration validation (compile, format, unit, fuzz, sanitizers, flow, resource, perf). | quality gate, Doxygen, trace, implementation integrity, 10-iteration |
| **knowledge-process** | Session continuity: analysis log (append-only delta), context tracker (local store), dev process (10-iteration validation), knowledge base (two-tier sanitised), App Engine deployment. | analysis log, context tracker, dev process, knowledge base |
| **low-level-toolkit** | Assembly, emulation, toolchains: ISA/ABI analysis, instruction selection, binary interfaces, emulator design, compiler/linker/sysroot reproducibility. | assembly, emulation, toolchain, ISA, ABI, binary, compiler |
| **utility-pair** | Two output styles: caveman (ultra-terse prose for humans) and ponytail (lazy senior dev, YAGNI, stdlib first, shortest path for code decisions). | caveman, ponytail, terse, lazy, YAGNI |
| **sherlock-it** | Performance investigation with persistent analysis log. FULL/HIGH/LOW modes. Baseline to verify. Diagnostic traps, hypothesis tracking, delta comparison across runs. | performance, profile, bottleneck, optimise, benchmark, trap |
| **ponytail-diag** | Structured debugging: one-line verdict by default, minimal/full expansion on demand. Internal model (call graph, truth tables, data-state flow). Hypothesis management, extended methods (fishbone, 5 whys, barrier, change, waterfall). Handoff to fix. | diagnose, one-line verdict, truth table, hypothesis, root cause |
| **debug-core** | Debug orchestrator: 12-step loop, truth tables, auto-unload, knowledge capture. Default entry for all debugging. | debug, reproduce, root cause, hypothesis, fix, verify |
| **debug-deep** | Escalation techniques: flow/state/contract/fishbone/FTA/5 whys/barrier/change/waterfall. Use only when fast loop cannot resolve. | deep debug, fishbone, fault tree, 5 whys, barrier analysis |
| **debug-fix** | Smallest patch for confirmed root cause. One causal hypothesis to one minimal patch to one verification cycle. Validation gates (compile, format, targeted test, reproducer, differential, sanitizers, regression). | apply fix, minimal patch, root cause fix |
| **debug-verify** | Verification ladder: static to build to targeted to reproducer to differential to regression to integration. Never claim unrun PASS. Risk-based escalation. | verify fix, validation, regression test, differential test |
| **debug-domain-router** | Load domain debug knowledge only when needed. Maps unresolved facts to minimal specialisations (C/C++, Windows, LLM, GGUF, quantisation, networking, GPU kernels, model serving, filesystem, distributed). Max two per cycle. | domain debug, specialised debug, C++ debug, GPU debug, LLM debug |
| **code-quality-gate** | Unified quality gate: trace markers, Doxygen contracts, no-fake-code, 10-iteration validation, Rust safety, component boundaries. Auto-triggers on code changes. | quality gate, Doxygen, contracts, validation, traceability |
| **low-level-toolkit** | Assembly, emulation, toolchains: ISA/ABI analysis, instruction selection, binary interfaces, emulator design, compiler/linker/sysroot reproducibility. | assembly, emulation, toolchain, ISA, ABI, binary, compiler |
| **caveman** | Ultra-terse human-facing prose. Bullet points only. Caveman grammar. No preamble, no postamble, no pleasantries. | caveman, terse, minimal prose |
| **ponytail** | Lazy senior dev for code decisions. YAGNI ladder. Stdlib/native first. Intensity: lite/full/ultra. Marks shortcuts with upgrade path. | ponytail, lazy, YAGNI, stdlib, minimal |
| **rust-safety** | Rust ownership, lifetimes, error handling, memory safety, build/tooling, testing. No unwrap/expect in production. | Rust, ownership, lifetimes, unsafe, Cargo |
| **sglang-dev** | SGLang runtime: KV cache, tensor parallelism, speculative decoding, FlashInfer, server API, profiling, development flow. | SGLang, KV cache, tensor parallel, speculative, FlashInfer |
| **tensorrt-llm-dev** | TensorRT-LLM: C++ engine, Python build, quantisation (FP8/INT8/INT4/AWQ), tensor/pipeline parallelism, Paged KV cache, Triton backend, plugin system. | TensorRT-LLM, quantisation, tensor parallel, Triton, FP8 |
| **vllm-dev** | vLLM: PagedAttention, tensor parallel, Triton kernels, quantisation (GPTQ/AWQ/Marlin/SmoothQuant), GPU memory management, LoRA, monitoring, development flow. | vLLM, PagedAttention, tensor parallel, Triton, quantisation |
| **vulkan-compute-stack** | Vulkan SDK 1.4.357.0: instance/device, VMA memory, buffers/descriptors, command buffers, sync (fences/semaphores/timeline/barriers), GLSL to SPIR-V, subgroup/cooperative matrix. | Vulkan, VK_KHR, SPIR-V, glslc, VMA, compute shader |

## Loading model

Every skill declares:

```yaml
metadata:
  loading: on-demand
  auto_unload: true
```

A skill body loads only when its trigger_keywords match the active task (or when explicitly called). Once its purpose is served, it unloads leaving a one-line summary. No skill persists unless the task demands it.

Configuration in `opencode.jsonc`. Auto-trigger: `debug-core`, `traceability-gate`, `knowledge-process`. All others conditional.

## Design principles

1. Load the smallest specialist that matches the active boundary.
2. Add another skill only when the task crosses a concrete boundary (API, ABI, memory, kernel, compiler, graphics, or model format).
3. Keep shared workflows out of skills; reference them explicitly when needed.
4. No stubs, no placeholders, no fake success paths. Every skill describes a complete, repeatable workflow with validation gates.
5. Record the evidence: version, host, target, toolchain, and what actually ran.

## Quality gate

`traceability-gate` (auto-triggered on code changes) enforces:

- Trace markers [T-XXX] on every non-trivial function
- Doxygen contracts with @pre/@post/@param[in/out/in,out]
- No TODO, FIXME, pass, unimplemented!(), stub functions, hardcoded test outputs
- 10-iteration validation: compile (-Werror), format, unit test, reproducer, golden test, fuzz, sanitizers, flow analysis, resource audit, performance (5% regression max)

`implementation-integrity` is implicit: code must be real, complete, executable, and supported by executed evidence.

## Shared references

The `_systems-ml-shared/` directory holds version policy, porting checklists, model-format checklists, quality gates, and execution protocol. Not skills, never auto-load. Read only the named file when the task requires it.

## Credits

The `ponytail` skill was inspired by Dietrich Gebert's original work at https://github.com/DietrichGebert/ponytail — his YAGNI-first philosophy sparked this entire skill ecosystem.

An expanded variant lives in this repo at https://github.com/Maxritz/MySkills/blob/main/ponytail/SKILL.md — adding intensity levels (lite/full/ultra), explicit ladder rules, upgrade-path markers, and a separate `caveman` skill for terse prose.

The `demoscene` and `optimization-toolkit` skills draw inspiration from farbrausch (https://github.com/farbrausch) and the wider demoscene community — legendary groups like Ryg, Haujobb, Wayfinder, Fiver2, Chaos Inc whose extreme optimisation techniques continue to push what is possible.

## Installation

Copy the repository root into your OpenCode skills directory. Preserve the layout: each skill is a directory with SKILL.md at the top level. Keep `_systems-ml-shared/` beside the skill directories.

Example calls:

```
skill("amd-gpu-stack")
skill("llm-serving")
skill("porting-toolkit")
skill("debug-core")
```

For a cross-domain request, start with `systems-ml-stack-router` (if present) or let the conditional loader select the right set.

## Validation

Run the narrowest relevant build or test for any implementation change. Report anything not executed. The project validator checks: every configured skill exists, every name matches its directory, no initializer examples remain, JSON parses after comment removal.

## Licence

MIT. Individual skill files may include additional attribution or licensing notes where required.
