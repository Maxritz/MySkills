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

## Engine-specific implementation recipes

Detailed vLLM, SGLang and TensorRT-LLM commands are kept in [`references/engine-recipes.md`](references/engine-recipes.md). Load that file only when implementing or debugging one of these engines. CLI flags, Python APIs, KV-cache layouts and quantisation support are version-sensitive; check the installed version and its own help/docs before executing examples.

## Model-pool routing (on demand)

Use explicit policies for endpoint capability, context limits, health, latency/cost, privacy and failure isolation. Keep credentials and endpoint secrets outside version control. Detailed configuration and routing examples: [model-pool reference](references/model-pool.md).

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

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Treat all engine flags and APIs below as version-sensitive examples. Check the installed package version and its own help/docs before execution; validate a real request through generation, streaming termination, cancellation and cleanup, then report TTFT, inter-token latency, throughput and memory for a named workload.


## Boundaries

- Does not train/fine-tune (receives model artifacts)
- Does not convert formats (see `model-formats`)
- Does not write kernels (see `amd-gpu-stack`/`nvidia-cuda-stack`/`llm-hardcode`)
- Does not validate components in isolation (see `llm-components`)
- `stop llm-serving`: revert.