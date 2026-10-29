# LLM Serving: Engine-specific Recipes

These recipes are detailed implementation examples, not a promise that the current installed release accepts every flag or API. Verify package versions and official release documentation before execution.

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

