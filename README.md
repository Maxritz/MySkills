# OpenCode Skills Library

> CPU-first, C99-compatible AI development skills for OpenCode.
> 46 skills: 5 auto-triggered (always in context) + 41 on-demand (load only when called).
> Developed and validated through internal testing against sglangC99.

## Token Budget

| Level | Loading | Skills | Tokens (always) | Notes |
|-------|---------|--------|-----------------|-------|
| 1 | Always in context | All 46 | **~533 tokens** | Name + ~45-char description per skill |
| 2 | On-demand (`skill()` call) | 41 | ~404 avg | Full body — only loads when triggered |
| 3 | Resource | N/A | 0 | External docs/fixtures never loaded unless needed |

## Skill Flowchart

```
debug-core (auto, 78 lines, always in context)
  |-- DBG_TRACE/DBG_ASSERT instrumentation on every function
  |-- 12-step evidence loop (reproduce -> fix -> verify -> regress)
  |-- references debug-domain-router ("what fact needs domain knowledge?")
  |     |-- C/C++  -> debug-localize + debug-reference
  |     |-- GGUF   -> debug-invariants + debug-mde
  |     |-- LLM    -> debug-hypothesis + debug-root-cause
  |     |-- (other domains: cdna, rdna, vulkan, etc.)
  |     |-- NEVER loads entire domain pack - only the technique needed
  |-- escalates to debug-deep (forensics) when fast loop cannot resolve

dox-validate (auto)       -> Doxygen on every function/struct/module
dev-process (auto)        -> 10-iteration validation chain
traceability (auto)       -> [T-XXX] markers + addr2line reversibility
context-tracker (auto)    -> Local disk-backed session memory
```

Function flow charts (truth table / decision tree / data model trace) are
available in `tests/sample_flowcharts.md`.

## What Each Skill Helps With

### Auto-Triggered (5 skills — always in context, ~533 tokens)

| Skill | Helps With |
|-------|-----------|
| `debug-core` | Any software failure: DBG_TRACE instrumentation, 12-step debug loop, routes to domain-specific debug skills |
| `dev-process` | Planning any task: architecture-first, 10-iteration validation (compile, test, fuzz, sanitize, flow analysis) |
| `dox-validate` | Code quality: Doxygen on every function, no fake code/placeholders, 10-iter validation chain |
| `traceability` | Debugging: `[T-XXX]` flow markers, `-g3` debug symbols, `addr2line` binary-to-source mapping |
| `context-tracker` | Session memory: save/summarize/retrieve context locally, never reload full conversation |

### Debug Pipeline (13 skills — progressive specialization)

Each loads **only when debug-core + debug-domain-router determine it's needed**:

| Skill | When To Load | Helps With |
|-------|-------------|------------|
| `debug-reproduce` | Failure exists but can't reproduce | Capture minimal repro, isolate env factors |
| `debug-localize` | Need to find WHERE failure starts | Bisect input/state/transformation/output boundaries |
| `debug-reference` | Unsure if output is correct | Compare against spec/known-good/trusted impl |
| `debug-hypothesis` | Testing multiple theories | Maintain 2-4 hypotheses, eliminate with evidence |
| `debug-mde` | Multiple hypotheses remain | Pick cheapest experiment distinguishing them |
| `debug-invariants` | Need contract validation | Check ownership/bounds/type rules at failure boundary |
| `debug-fix` | Root cause confirmed | Apply smallest patch, retest immediately |
| `debug-verify` | Fix applied, need proof | Verification ladder: static -> unit -> repro -> regression |
| `debug-root-cause` | Need causal chain clarity | symptom -> first bad state -> cause -> defect |
| `debug-reduce` | Repro case too large | Shrink failing input while preserving failure |
| `debug-deep` | Fast loop cannot resolve | Escalate: data models, truth tables, fault trees |
| `debug-domain-router` | Need domain knowledge | Routes to domain-specific skills (C/C++, GGUF, LLM...) |

### On-Demand Domain Skills (33 skills)

#### Languages
| Skill | Helps With |
|-------|-----------|
| `c99-standards` | Strict C99: opaque handles, checked arithmetic, tagged unions, error codes |
| `cpp-modern` | C++17/20: RAII, move semantics, smart pointers, concepts, ranges |
| `rust-safety` | Rust: ownership, lifetimes, no unsafe, Cargo workspace |
| `python-performance` | NumPy vectorization, Numba JIT, avoid hot loops |

#### GPU Compute
| Skill | Helps With |
|-------|-----------|
| `cuda-optimization` | SM/warp/block, memory hierarchy, coalescing, occupancy |
| `rocm-hip` | HIP migration from CUDA, device kernels |
| `rocr-core` | ROCm runtime: hsa_init, queues, signals, kernel dispatch |
| `cdna` | AMD CDNA: matrix cores (MFMA), rocBLAS |
| `rdna` | AMD RDNA: wave32, LDS, vector registers |

#### Systems
| Skill | Helps With |
|-------|-----------|
| `os-kernel` | x86-64 long mode, GDT/IDT, paging, PCI, AHCI |
| `x86-assembly` | Registers, AVX-512, cache-line optimization |
| `windows-systems` | Win32: processes, I/O, Registry, COM |
| `linux-systems` | Syscalls, pthreads, epoll, mmap, systemd |

#### Graphics
| Skill | Helps With |
|-------|-----------|
| `vulkan-compute` | VkBuffer/VkImage, descriptor sets, command buffers |
| `directx-compute` | ID3D12Device, descriptor heaps, root signatures |
| `shader-opt` | Register allocation, occupancy, branch divergence |

#### AI Engines
| Skill | Helps With |
|-------|-----------|
| `gguf-ggml` | GGUF binary parsing, quantization types, GGML dequant |
| `safetensors-handler` | SafeTensors: JSON header, mmap, dtype validation |
| `llamacpp-dev` | llama.cpp: GGUF loading, quantization, GPU offload |
| `sglang-dev` | SGLang: KVCache, tensor parallelism, speculative decode |
| `vllm-dev` | vLLM: PagedAttention, tensor parallel, Triton kernels |
| `tensorrt-llm-dev` | TensorRT-LLM: C++ engine, FP8/INT8, tensor parallel |
| `llm-hardcode` | Hand-optimized: manual kernel writing, memory layout |
| `vino` | OpenVINO: IR format, NPU/GPU/CPU inference |

#### Infrastructure & Patterns
| Skill | Helps With |
|-------|-----------|
| `plugin-adapter` | Universal 4-step plugin template (any backend/shader/quant) |
| `app-engine-deploy` | GCP App Engine: app.yaml, scaling, IAM |
| `kernel-tuning` | Profiling: cache/bandwidth optimization, SIMD |
| `ponytail` | Lazy coding: YAGNI, stdlib first, shortest diff |
| `caveman` | Terse prose: no preamble, bullet-only communication |

## Usage

Skills auto-discover from `~/.config/opencode/skills/*/SKILL.md`.

```
skill("debug-localize")     # Find where failure starts
skill("gguf-ggml")          # Load GGUF parsing + quantization
skill("plugin-adapter")     # Load universal plugin pattern
skill("debug-domain-router") # Ask: what domain knowledge do I need?
```

## Testing

```bash
python tests/test_skills.py              # 184 assertions, all PASS
python tests/test_token_comparison.py    # Debug session token cost analysis
```

Validates: discovery, YAML frontmatter, name matching, auto-trigger config, content sanity, debug pipeline integrity, conditional loading, interop, line counts, and token budget.

## Evaluation against sglangC99

Skills were developed and validated through internal testing against
`C:\Users\rina0423\Desktop\AI-stuff\base-test\sglangC99`:

- `debug-core` validates DBG_TRACE coverage in `sglangC99/src/` functions (12-step loop)
- `traceability` checks `[T-XXX]` markers per `sglangC99/AGENTS.md` requirement
- `dox-validate` ensures Doxygen compliance in `sglangC99/include/` headers
- `gguf-ggml` + `@see c99-standards` validates GGUF parsing in `sglangC99/tests/test_gguf.c`
- `plugin-adapter` matches backend dispatch pattern in `sglangC99/src/`
- `context-tracker` stores test results locally at `~/.config/opencode/contexts/`

**Validation protocol:** Run `python tests/test_skills.py` (184 assertions, all PASS)
then `python tests/test_token_comparison.py` to verify debug session token costs.

## License

MIT. See individual skill files for license details.
