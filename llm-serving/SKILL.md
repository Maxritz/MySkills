---
name: llm-serving
description: "Unified LLM serving: vLLM (PagedAttention), SGLang (KV cache, speculative), TensorRT-LLM (TRT engine, FP8/FP4), model-pool (endpoint routing). Benchmarks, monitoring, deployment."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: false
  trigger_keywords: ["vLLM", "SGLang", "TensorRT-LLM", "Triton", "serving", "PagedAttention", "KV cache", "tensor parallel", "speculative decoding", "quantization", "OpenAI API"]
---

# LLM Serving

**Unified serving stack** across vLLM, SGLang, TensorRT-LLM with model-pool routing. Choose engine by workload; validate with benchmarks.

## Engine Selection Matrix

| Workload | Recommended Engine | Why |
|----------|-------------------|-----|
| **High throughput, OpenAI API** | vLLM | Mature, PagedAttention, broad quantization, OpenAI-compatible |
| **Low latency, speculative decoding** | SGLang | Radix attention, speculative, FlashInfer, torch.compile |
| **Maximum throughput, FP8/FP4** | TensorRT-LLM | TRT engine optimization, FP4 microscaling, Triton backend |
| **Multi-model, cost routing** | model-pool + any | Route cheap→verify, isolate failures |
| **Intel CPU/NPU** | OpenVINO | Auto-batching, AUTO device, NPU support |

---

## Engine-specific implementation

Keep detailed engine instructions in the specialist skill to avoid loading duplicate runbooks.

| Engine | Load | Use for |
|---|---|---|
| vLLM | vllm-dev | PagedAttention, scheduler, block management, runtime flags, kernels and engine-specific regressions |
| SGLang | sglang-dev | RadixAttention, prefix reuse, KV cache and runtime profiling |
| TensorRT-LLM | tensorrt-llm-dev | Engine build, plugins, quantisation, parallelism and TensorRT deployment |

Verify current command-line flags, Python APIs, supported GPU architectures and quantisation modes against the exact installed version. Treat example flags in any skill as prompts to validate, not guarantees of current support.

## Shared serving contract

- Record model/tokenizer revision, quantisation, context length, concurrency, batch policy, KV-cache dtype and hardware/software versions before comparing engines.
- Exercise the actual public API with success, malformed request, cancellation, timeout, overload and shutdown cases.
- Check streaming order, request isolation, client disconnect cleanup, admission control, memory exhaustion and scheduler fairness.
- Report time-to-first-token, inter-token latency, throughput, tail latency, peak memory and error rate separately. Do not combine prefill and decode into one unexplained throughput number.
- Validate output correctness against a fixed prompt set and deterministic configuration before using speed results.

## 4. Model Pool (Endpoint Routing)

### Architecture
```
Request → debug-domain-router → Route
  ├─ Code generation (cheap) → Small local model (7B-)
  ├─ Validation/verify       → Main endpoint (GPT-4/Claude/70B+)
  ├─ Security audit          → Cheap + debug-reference
  └─ Numerical proof         → Main endpoint
```

### Configuration (`~/.config/opencode/models/pool.json` - gitignored)
```json
{
  "write_endpoints": [
    {"name": "gemma-2b-local", "base_url": "http://localhost:8080", "cost_per_1k": 0.0001, "max_tokens": 2048},
    {"name": "phi-3-mini-local", "base_url": "http://localhost:8081", "cost_per_1k": 0.0002, "max_tokens": 4096}
  ],
  "verify_endpoints": [
    {"name": "gpt-4o", "base_url": "https://api.openai.com/v1", "cost_per_1k": 0.03, "model": "gpt-4o"},
    {"name": "claude-3-opus", "base_url": "https://api.anthropic.com/v1", "cost_per_1k": 0.075, "model": "claude-3-opus"},
    {"name": "llama3-70b-local", "base_url": "http://localhost:8000", "cost_per_1k": 0.001, "model": "llama-3-70b"}
  ],
  "routing_rules": {
    "code_generation": "write_endpoints",
    "validation": "verify_endpoints",
    "security_audit": ["write_endpoints", "debug-reference"],
    "numerical_proof": "verify_endpoints"
  }
}
```

### Routing Logic
```python
def route_request(task_type, prompt, context):
    if task_type == "code_generation":
        endpoint = select_cheapest(write_endpoints)
        response = call_endpoint(endpoint, prompt)
        # Log for verification
        log_to_analysis(response, endpoint.name)
        return response
    
    elif task_type == "validation":
        # Route to main endpoint for cross-check
        endpoint = select_best(verify_endpoints)
        return call_endpoint(endpoint, prompt)
    
    # ... other rules
```

---

## Unified Benchmarking

### Standard Workloads
```python
WORKLOADS = {
    "prefill_heavy": {"batch": 32, "input_len": 4096, "output_len": 128},
    "decode_heavy": {"batch": 1, "input_len": 128, "output_len": 4096},
    "chat": {"batch": 8, "input_len": 2048, "output_len": 512},
    "code_gen": {"batch": 4, "input_len": 1024, "output_len": 2048},
    "speculative": {"batch": 1, "input_len": 512, "output_len": 1024, "draft": True},
}

def benchmark_engine(engine, workload, num_requests=100):
    latencies = []
    for _ in range(num_requests):
        t0 = time.perf_counter()
        engine.generate(**workload)
        t1 = time.perf_counter()
        latencies.append(t1 - t0)
    
    return {
        "p50": np.percentile(latencies, 50),
        "p95": np.percentile(latencies, 95),
        "p99": np.percentile(latencies, 99),
        "throughput": sum(workload["output_len"] for _ in range(num_requests)) / sum(latencies),
    }
```

### Comparison Report
```
ENGINE COMPARISON: <workload>
ENGINE: <vLLM|SGLang|TensorRT-LLM>
HARDWARE: <GPU x N>
CONFIG: TP=<N>, quant=<type>, batch=<N>, context=<N>
METRICS:
  TTFT (p50/p95/p99): <ms>
  Inter-token latency (p50/p95/p99): <ms>
  Throughput: <tokens/sec>
  GPU Memory: <GB>/<GB> (<util>%)
  Cache Hit Rate: <pct>
QUALITY: <pass/fail vs reference>
COST: <$/1M tokens>
```

---

## Deployment Checklist

| Check | vLLM | SGLang | TensorRT-LLM |
|-------|------|--------|--------------|
| **Engine builds** | `pip install -e .` | `pip install -e .[dev]` | `python setup.py install` |
| **Quantization works** | `--quantization fp8` | `--quantization fp8` | `quant_algo="fp8"` |
| **TP scales** | `--tensor-parallel-size N` | `--tp-size N` | `tensor_parallelism=N` |
| **KV cache fits** | `gpu_memory_utilization` | `mem-fraction-static` | `paged_state=True` |
| **API compatible** | OpenAI `/v1/*` | `/generate` | Triton HTTP/gRPC |
| **Metrics exposed** | `--enable-metrics` | Built-in | Prometheus exporter |
| **Speculative decoding** | `--speculative-draft` | `--speculative-draft` | `--speculative_decoding` |
| **Prefix caching** | `--enable-prefix-caching` | Auto (radix) | N/A |
| **Chunked prefill** | `--enable-chunked-prefill` | N/A | N/A |

---

## Output Report

```
LLM SERVING: <engine> DEPLOYMENT
ENGINE: <vLLM|SGLang|TensorRT-LLM|model-pool>
MODEL: <path/name> (TP=<N>, PP=<N>, quant=<type>)
HARDWARE: <GPU x N> (<VRAM> GB each)
CONFIG: <key params>
BENCHMARK: <workload> → TTFT=<ms> ITL=<ms> Throughput=<tok/s>
MEMORY: <allocated>/<total> (<util>%)
CACHE: <hit_rate>% (blocks: <gpu>/<cpu>)
QUALITY: <pass/fail> (logits diff < tol)
MONITORING: <Prometheus/OpenAI compatible>
BLOCKERS: <list>
```

---

## Boundaries

- Does not train/fine-tune (receives model artifacts)
- Does not convert formats (see `model-formats`)
- Does not write kernels (see `amd-gpu-stack`/`nvidia-cuda-stack`/`llm-hardcode`)
- Does not validate components in isolation (see `llm-core`)
- `stop llm-serving`: revert.