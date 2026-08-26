# Modular skill suite manifest

| Skill | Load when |
|---|---|
| `systems-ml-stack-router` | Route cross-domain systems, graphics, compiler, model-format, and LLM tasks to the smallest set of conditionally loaded skills. Use when a request spans multiple layers or the correct specialist is unclear. |
| `rocm-stack` | Develop, debug, profile, or optimize AMD ROCm/HIP applications, libraries, kernels, and distributed GPU workloads. Use for rocBLAS, RCCL, rocprof, rocminfo, HIP, ROCm packaging, or AMD GPU performance tasks. |
| `rocr-runtime` | Work with AMD ROCr/HSA runtime behavior, agents, queues, AQL packets, signals, memory pools, code objects, and low-level runtime diagnostics. Use for ROCr-specific failures or runtime integration. |
| `linux-kernel` | Develop, configure, build, debug, or port Linux kernel code, modules, drivers, memory management, scheduling, tracing, or DMA paths. Use for kernel-space or kernel/driver boundary work. |
| `windows-system-architecture` | Design, debug, or port Windows system software involving NT processes, threads, handles, I/O, security, WDDM, ETW, ABI, deployment, or host/driver boundaries. |
| `cuda-stack` | Develop, debug, optimize, or port NVIDIA CUDA runtime/driver applications, streams, events, graphs, cooperative groups, memory, kernels, and profiling workflows. |
| `directx-ai-ml` | Develop or debug DirectX 12, DXGI, DXIL, shader-model, Agility SDK, DirectML, resource/heaps/fences, and Windows GPU AI/ML integration. |
| `python-conversion` | Convert Python models, numerical code, and pipelines to C/C++, CUDA/HIP, ONNX, MLIR, or deployable artifacts while preserving behavior, dtype, shape, and error contracts. |
| `python-engineering` | Implement, refactor, package, profile, and test production Python software, including async services, native extensions, typing, dependencies, and reproducible environments. |
| `c99-systems` | Write, port, review, or debug portable C99 systems code with explicit ownership, ABI, error handling, concurrency, and low-level performance contracts. |
| `cpp-systems` | Write, port, review, or debug production C++ systems code involving RAII, templates, allocators, concurrency, ABI, performance, and native integration. |
| `assembler` | Analyze, write, optimize, or validate assembly, disassembly, ABI, calling conventions, instruction selection, binary interfaces, and low-level code generation. |
| `llm-components` | Design, implement, convert, benchmark, or debug LLM components such as tokenization, embeddings, attention, KV cache, sampling, quantization, MoE, speculative decoding, and serving APIs. |
| `system-architecture` | Design or review end-to-end systems by decomposing requirements, boundaries, data/control paths, performance budgets, failure domains, and observability. |
| `memory-management` | Analyze or design CPU/GPU/OS memory behavior including virtual memory, allocators, NUMA, DMA, pinned/pageable memory, cache/coherence, synchronization, and fragmentation. |
| `x86-architecture` | Analyze or optimize x86/x86-64 ISA, privilege, paging, caches, SIMD, atomics, CPUID, virtualization, ABI, and performance behavior. |
| `emulation` | Design, implement, debug, or validate CPU, ISA, device, system, or API emulators and simulators, including translation, timing, determinism, snapshots, and conformance. |
| `graphics-shader-kernels` | Develop, port, debug, or optimize graphics and compute shaders/kernels using HLSL, GLSL, SPIR-V, DXIL, Vulkan, DirectX, barriers, subgroups, and GPU profiling. |
| `cross-porting` | Port software, kernels, shaders, APIs, or model components across operating systems, CPUs, GPUs, graphics APIs, runtimes, ABIs, or compilers. |
| `cross-compilation` | Configure, debug, and reproduce cross-compilation for different OS, CPU, GPU, ABI, sysroot, SDK, or deployment targets. |
| `toolchains` | Select, configure, diagnose, and reproduce compilers, assemblers, linkers, SDKs, sysroots, build systems, package managers, and binary artifacts. |
| `gguf-format` | Inspect, validate, convert, shard, quantize, or integrate GGUF model artifacts with LLM runtimes while preserving tensor, metadata, tokenizer, and quantization correctness. |
| `safetensors-format` | Inspect, validate, shard, stream, convert, or integrate SafeTensors model artifacts with secure tensor loading and LLM/ML runtimes. |
| `implementation-integrity` | Ensure generated, repaired, or modified code is real, complete, executable, non-placeholder, and supported by actual validation rather than demo, stub, fake, or unverified behavior. |
| `code-contract-comments` | Write concise, accurate comments and contracts for functions, classes, APIs, kernels, and modules, including preconditions, ownership, invariants, side effects, errors, and concurrency. |
| `modular-component-boundaries` | Design, split, remove, or refactor application components with explicit ownership, interfaces, dependency direction, lifecycle, configuration, and replacement seams. |
| `backend-component-demarcation` | Define and refactor backend/service boundaries across transport, application, domain, persistence, infrastructure, workers, jobs, and configuration. |
| `porting-change-isolation` | Isolate platform-specific changes during cross-porting, backend replacement, compiler migration, or OS/ISA/GPU/API changes. |
