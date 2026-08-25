---
name: llm-hardcode
description: "Hand-opt LLM kernels: layout, cache, vectorization."
license: MIT
compatibility: opencode
---

# LLM Hardcode Development

## Memory Layout

- Tensors in **row-major** (C-order). `tensor[i][j] = data[i*stride_j + j]`.
- KV cache: store key/value per-layer. `[num_layers][num_heads][seq_len][head_dim]`.
- **Interleaved QKV**: pack `[q0,k0,v0, q1,k1,v1, ...]` for contiguous load.
- **Blocked layout**: tile [64, 64] or [128, 128] for cache efficiency.

## Cache-Aware Coding

- L1 cache line = 64 bytes = 16× float32. Touch data sequentially.
- Tile loops: `for i in 0..N step B: for j in 0..N step B:` — B ≈ sqrt(L1/elem_size).
- Software prefetch: `_mm_prefetch((char*)&data[i+B], _MM_HINT_T0)` 2 iterations ahead.
- Avoid strided access: transpose blocks before processing.

## SIMD Intrinsics (AVX-512 / AVX2)

- **FMA**: `_mm256_fmadd_ps(a, b, c)` = 8 FMA in 1 cycle. Latency 4, throughput 1/cycle.
- **Transpose**: `_MM_TRANSPOSE8_PS` for 8×8 float transpose.
- **Reduction**: `_mm256_reduce_add_ps` via horizontal add + shuffle.
- Mask registers: `_mm256_maskz_fmadd_ps(mask, a, b, c)` — avoid branches.
- **Gather**: `_mm256_i32gather_ps(base, idx, scale)` — stride = scale, stride 4-8.

## Numerical Precision

- **Round to nearest even**: default FPU behavior. `_MM_SET_ROUND(_MM_ROUND_NEAREST + _MM_ROUND_EVEN)`.
- **Clipping**: `min(max_val, max(min_val, x))` — prevents NaN/inf propagation.
- **Softmax**: subtract max before exp: `exp(x - max) / sum(exp(x - max))`.
- **LayerNorm**: 
```c
// eps = 1e-6
mean = sum(x) / n;
var = sum((x - mean)^2) / n;
y = (x - mean) / sqrt(var + eps) * weight + bias;
```
- **Mixed precision**: accumulate in FP32, store weights in FP16/BF16.

## Quantization (Q4_0 hardcode)

```c
// Block: 5×FP16 scale + 16×int4 (each int4 → 2 elements)
// Dequantize 16 elements:
for (int i = 0; i < 16; i++) {
    float scale = halves[i/2];        // FP16 → FP32
    int q1 = qbytes[i*2] & 0xF;       // low nibble
    int q2 = qbytes[i*2] >> 4;       // high nibble
    out[i*2]   = scale * (q1 - 8);    // int4 biased
    out[i*2+1] = scale * (q2 - 8);
}
```

## Kernel Patterns

- **Elementwise**: independent per element. High throughput. Vectorize fully.
- **Reduction**: sum/dot-product. Tree-reduce in registers → shared memory → atomic.
- **Scan (prefix sum)**: work-efficient (`upsweep + downsweep`).
- **Scatter/Gather**: non-coalesced. Use shared memory tiling to reorganize.
- **GEMM**: blocked (C = A×B). 3-level tiling: register → shared → global.
  - MR×NR register tile. K loop unrolled.
  - `packA`/packB` for contiguous load.

## Validation

- Compare FP32 reference vs FP16/BF16/INT8 within tolerance:
  - FP16/BF16: 1e-2 RMS
  - Q4: 1e-1 RMS
  - Q2_K: 5e-1 RMS
- Use `ggui_test` / custom golden tests with known outputs.
- `valgrind` (Linux) or `Application Verifier` (Windows) for memory errors.
