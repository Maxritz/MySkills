---
name: vino
description: "OpenVINO: IR format, quantization, NPU/GPU/CPU."
license: Apache-2.0
compatibility: opencode
---

# Intel OpenVINO

## Model Formats

- **IR (Intermediate Representation)**: `.xml` (topology) + `.bin` (weights).
- **ONNX**: Direct import via `ov::Core::read_model("model.onnx")`.
- **PaddlePaddle**: `--input_model model.pdmodel`.
- Compile: `mo --input_model model.onnx --output_dir ir/`.

## Inference Pipeline

1. `ov::Core core;` — initialize runtime.
2. `auto model = core.read_model("model.xml");` — load IR.
3. `auto compiled = core.compile_model(model, "CPU");` — or "GPU", "NPU", "AUTO".
4. `auto infer_request = compiled.create_infer_request();`
5. `infer_request.infer();` — blocking. Or `infer_request.start_async();` + `wait()`.

## Model Optimizer (mo)

```bash
# ONNX → IR
mo --input_model model.onnx --output_dir ir/ --data_type FP16

# Input shape
--input_shape [1,3,224,224]

# Quantization
mo --input_model model.onnx --compress_weights 0  # FP32
```

## Quantization

- **PTQ (Post-Training)**: `pot` or `nncf` tool. No retraining needed.
- **QAT (Quantization-Aware Training)**: insert fake-quant nodes during training.
- INT8: `--data_type INT8` in MO. Requires calibration dataset.
- `nncf.quantize(model, dataset, subset_size=300)` — Python API for PTQ.

## Auto-Batching

- `core.set_property("CPU", {ov::auto_batch_device_config(), "BATCH_SIZE=4"});`
- Combines multiple inference requests into single batch for throughput.
- `ov::hint::inference_precision` — control FP16 vs FP32 on GPU.

## Async API

```cpp
auto start = std::chrono::steady_clock::now();
infer_request.start_async();
infer_request.wait();
auto elapsed = std::chrono::steady_clock::now() - start;
```

## GPU/NPU

- GPU: OpenCL backend. `core.compile_model(model, "GPU");`
- NPU: `ov::intel_npu::Device` — Intel Core Ultra NPU. Requires GNA plugin.
- AUTO device: `core.compile_model(model, "AUTO")` — auto-selects CPU/GPU/NPU.
- `ov::hint::performance_mode(ov::hint::PerformanceMode::THROUGHPUT)`.

## Performance

- `benchmark_app -m model.xml -d CPU -api async -niter 1000 -nthread 4`
- Metrics: latency, throughput (FPS), CPU/GPU utilization.
- `--cache_dir` to cache compiled graph for faster startup.
