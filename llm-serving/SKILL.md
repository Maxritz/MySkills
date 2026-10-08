---
name: llm-serving
description: "Unified LLM serving: vLLM (PagedAttention), SGLang (KV cache, speculative), TensorRT-LLM (TRT engine, FP8/FP4), model-pool (endpoint routing). Benchmarks, monitoring, deployment."
compatibility: opencode
metadata:
  loading: on-demand
  auto_trigger: true
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

## 1. vLLM (PagedAttention)

### Architecture
```
HTTP Server (FastAPI)
  → Engine (LLMEngine)
    → Scheduler (priority, preemption, chunked prefill)
    → Workers (TP ranks, Ray/MP)
      → ModelExecutor (HF loading, custom ops)
      → Worker (forward pass, KV cache mgmt)
      → CacheEngine (PagedAttention blocks)
```

### PagedAttention
```python
# Block size = 16 tokens (default)
# gpu_cache: List[Tuple[key_cache, value_cache]] per layer
# cpu_cache: pinned memory for swap
# BlockAllocator: manages free GPU/CPU blocks
# BlockTable: seq_id -> List[physical_block_id]

# Swap when OOM:
#   swap_out: GPU blocks → CPU (pinned) → free GPU blocks
#   swap_in: CPU blocks → GPU → update BlockTable
```

### Key Configuration
```python
# Server
python -m vllm.entrypoints.openai.api_server \
  --model /path/to/model \
  --tensor-parallel-size 4 \
  --dtype auto \
  --quantization fp8 \
  --gpu-memory-utilization 0.9 \
  --max-model-len 32768 \
  --block-size 16 \
  --enable-prefix-caching \
  --enable-chunked-prefill \
  --max-num-batched-tokens 8192 \
  --port 8000

# Quantization
--quantization fp8        # H100+, FP8 weights+activations
--quantization int8       # Weight-only or SmoothQuant
--quantization awq        # AWQ 4-bit
--quantization gptq       # GPTQ 4-bit
--quantization marlin     # Marlin 4-bit (custom kernel)
```

### API (OpenAI Compatible)
```bash
# Chat Completions
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "llama-3-70b", "messages": [{"role": "user", "content": "Hello"}], "temperature": 0.7, "max_tokens": 512, "stream": true}'

# Completions
curl -X POST http://localhost:8000/v1/completions \
  -d '{"model": "llama-3-70b", "prompt": "Once upon a time", "max_tokens": 256}'
```

### Monitoring (Prometheus)
```yaml
# --enable-metrics exposes /metrics
vllm:token_throughput        # tokens/sec (total)
vllm:gpu_memory_utilization  # 0.0-1.0
vllm:num_requests_running    # active requests
vllm:num_requests_waiting    # queued
vllm:iteration_tokens_total  # prefill + decode tokens
vllm:request_latency_seconds # p50/p95/p99
```

---

## 2. SGLang (Radix + Speculative)

### Architecture
```
HTTP Server (sglang.entrypoints.http_server)
  → Engine (Engine)
    → Scheduler (DP/TP, speculative coordination)
    → ModelExecutor (HF models + attention kernels)
    → Runtime (Rust: token fusion, KV cache, scheduler)
```

### Key Features
```python
# Server
python -m sglang.entrypoints.http_server \
  --model-path /path/to/model \
  --tp-size 4 \
  --dtype auto \
  --quantization fp8 \
  --mem-fraction-static 0.9 \
  --context-length 32768 \
  --cuda-graph-bs 1 2 4 8 16 32 \
  --speculative-draft lmsys/llama-3-8b \
  --speculative-num-draft-tokens 4 \
  --port 30000

# FlashInfer (required for best perf)
pip install flashinfer --index-url https://flashinfer.ai/whl

# Radix Attention (tree-structured KV cache for prefix sharing)
# Automatically enabled for common prefixes
```

### Speculative Decoding
```python
# Draft model must be smaller (e.g., 300M → 7B, or 8B → 70B)
# --speculative-draft <model> --speculative-num-draft-tokens <gamma>

# Medusa (multiple heads on target model)
# --medusa-num-heads 4

# EAGLE (feature-based draft)
# --speculative-draft eagle-model
```

### API
```bash
# Similar to vLLM OpenAI-compatible
curl -X POST http://localhost:30000/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama-3-70b", "prompt": "Hello", "temperature": 0.7, "max_new_tokens": 512, "stream": true}'
```

### Profiling
```bash
# Latency benchmark
SGLANG_PROFILING=1 python -m sglang.benchmark.bench_latency \
  --model-path /path/model --batch-size 32 --input-len 1024 --output-len 128

# nsys for kernel profiling
nsys profile -o sglang_trace python -m sglang.entrypoints.http_server ...
```

---

## 3. TensorRT-LLM (TRT Engine + Triton)

### Build Pipeline
```python
# Python build script
from tensorrt_llm import BuildConfig, build
from tensorrt_llm.models import LLaMAForCausalLM

model = LLaMAForCausalLM.from_hugging_face("meta-llama/Llama-3-70B")
config = BuildConfig(
    max_batch_size=32,
    max_input_len=4096,
    max_output_len=2048,
    dtype="float16",
    tensor_parallelism=8,
    pipeline_parallelism=1,
    quant_algo="fp8",          # fp8, int8, int4_awq, int4_gptq
    fp8_mode="fp8",            # fp8, fp8_rowwise
    paged_state=True,          # Paged KV cache
    max_tokens_per_block=256,  # block size
    strongly_typed=True,
    use_custom_all_reduce=True,
    enable_context_fmha=True,  # FMHA kernel
    remove_input_padding=True,
)
engine = build(model, config)
engine.save("llama3-70b-fp8-tp8")
```

### Quantization
| Algorithm | Config | Hardware |
|-----------|--------|----------|
| **FP8** | `quant_algo="fp8"` | H100/H200/B200 |
| **INT8 SmoothQuant** | `quant_algo="int8", smoothquant=0.5` | All |
| **INT8 Weight-only** | `quant_algo="int8", weight_only=True` | All |
| **INT4 AWQ** | `quant_algo="int4_awq"` | All |
| **INT4 GPTQ** | `quant_algo="int4_gptq"` | All |
| **FP4 (Blackwell)** | `quant_algo="fp4"` | B200/GB200 |

### Tensor Parallelism
```python
# TP splits: QKV (column), MLP (row/column)
# nccl for inter-GPU, MPI for multi-node
# BuildConfig(tensor_parallelism=8, pipeline_parallelism=1)
# --tensor_parallel_size 8 --pipeline_parallel_size 1
```

### Triton Backend Deployment
```
model_repository/
  llama3-70b/
    1/
      model.py          # Python backend
      config.pbtxt      # Engine dir, batching
    config.pbtxt        # Model config
```

**config.pbtxt:**
```protobuf
name: "llama3-70b"
backend: "python"
max_batch_size: 32
input [
  {name: "input_ids", data_type: TYPE_INT32, dims: [-1]}
  {name: "input_lengths", data_type: TYPE_INT32, dims: [1]}
  {name: "request_output_len", data_type: TYPE_UINT32, dims: [1]}
  {name: "runtime_top_k", data_type: TYPE_UINT32, dims: [1]}
  {name: "runtime_top_p", data_type: TYPE_FP32, dims: [1]}
  {name: "beam_search_diversity_rate", data_type: TYPE_FP32, dims: [1]}
  {name: "temperature", data_type: TYPE_FP32, dims: [1]}
  {name: "repetition_penalty", data_type: TYPE_FP32, dims: [1]}
  {name: "random_seed", data_type: TYPE_UINT64, dims: [1]}
  {name: "stop_words_list", data_type: TYPE_INT32, dims: [2, -1]}
  {name: "bad_words_list", data_type: TYPE_INT32, dims: [2, -1]}
]
output [
  {name: "output_ids", data_type: TYPE_INT32, dims: [-1, -1]}
  {name: "sequence_length", data_type: TYPE_INT32, dims: [-1]}
  {name: "cum_log_probs", data_type: TYPE_FP32, dims: [-1]}
  {name: "output_log_probs", data_type: TYPE_FP32, dims: [-1]}
]
parameters {
  key: "engine_dir"
  value { string_value: "/engines/llama3-70b-fp8-tp8" }
}
parameters {
  key: "max_queue_size"
  value { string_value: "100" }
}
parameters {
  key: "batching_strategy"
  value { string_value: "inflight_fused_batching" }
}
```

**model.py:**
```python
from triton_python_backend_utils import get_input_tensor_by_name, Tensor
import tensorrt_llm.bindings as trtllm

class TritonPythonModel:
    def initialize(self, args):
        self.engine = trtllm.GptManager(args['model_repository'] + '/engine_dir')
    
    def execute(self, requests):
        responses = []
        for request in requests:
            input_ids = get_input_tensor_by_name(request, "input_ids").as_numpy()
            # ... parse other inputs ...
            
            # Execute
            outputs = self.engine.generate(
                input_ids=input_ids,
                max_new_tokens=request_output_len,
                top_k=runtime_top_k,
                top_p=runtime_top_p,
                temperature=temperature,
                repetition_penalty=repetition_penalty,
                random_seed=random_seed,
            )
            
            # Create response tensors
            output_ids = Tensor("output_ids", outputs.output_ids)
            sequence_length = Tensor("sequence_length", outputs.sequence_length)
            responses.append(InferenceResponse(output_tensors=[output_ids, sequence_length]))
        return responses
```

### Benchmarks
```bash
# Perplexity
python examples/eval.py --engine_dir=./engines --dataset=wikitext2

# Latency
python examples/benchmark.py --engine_dir=./engines --num_requests=100 --input_len=512 --output_len=128

# Throughput
python examples/benchmark.py --engine_dir=./engines --batch_size=32
```

---

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
- Does not validate components in isolation (see `llm-components`)
- `stop llm-serving`: revert.