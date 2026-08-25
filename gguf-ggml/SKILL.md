---
name: gguf-ggml
description: "GGUF parsing, quant types, GGML dequant ops."
license: MIT
compatibility: opencode
---

# GGUF & GGML Development
@see c99-standards: opaque handles, checked arithmetic. @see debug-core: DBG_TRACE. @see traceability: [T-XXX].

## GGUF Format

- Magic: `0x46554646` ("FUF" + version byte) or `0x46576767` ("gg" prefix, legacy).
- Header v3: magic (4), version (4), num_tensors (8), num_metadata (4), metadata_size (8).
- Metadata key-value pairs: string key, type, value. Types: STRING, INT, FLOAT, BOOL, ARRAY, UCHAR.
- Tensors follow: name (length-prefixed string), type, dimensions, flags, block_size, data_offset.

## Safe Parsing (untrusted input)

```c
// Validate header before reading
if (read_u32(buf) != GGUF_MAGIC) return GGUF_ERROR_BAD_MAGIC;
uint32_t version = read_u32(buf);
if (version != 2 && version != 3) return GGUF_ERROR_BAD_VERSION;

// Before malloc: validate num_tensors * sizeof(tensor_info) for overflow
if (num_tensors > MAX_TENSORS) return GGUF_ERROR_TOO_MANY_TENSORS;
if (num_tensors > SIZE_MAX / sizeof(gguf_tensor_info_t)) return GGUF_ERROR_OVERFLOW;
```

- Never read data_offset without checking ≤ file_size.
- Validate tensor dimensions multiply without overflow.
- Check alignment before accessing tensor data.

## Quantization Types

| Type | Abbr | Block Size | Bits/Element | Formula |
|------|------|-----------|-------------|---------|
| Q4_0 | 2 | 32 | 4.5 | 20B block: 5×FP16 scale + 16×int4 |
| Q4_1 | 3 | 32 | 4.5 | 21B block: 5×FP16 scale + 16×int4 + 1×bias |
| Q5_0 | 6 | 32 | 5.5 | 24B block: 4×FP16 scale + 16×int5 |
| Q5_1 | 7 | 32 | 5.5 | 25B block: 4×FP16 scale + 16×int5 + 1×bias |
| Q8_0 | 10 | 32 | 8 | 34B block: 1×FP16 scale + 32×int8 |
| Q2_K | 10 | 16 | 3.25 | 9B block: 1×FP16 + 16×int2 + 2×FP16 |
| Q3_K | 1-4 | 16/32 | 3-5.5 | Variable block types |
| Q6_K | 5 | 256 | 6.5 | 666B block: 16×FP16 + 208×int6 |
| Q8_K | 12 | 256 | 8.5 | 131×FP16 + 208×int8 + scale |

## Dequantization (Q4_0 example)

```c
// Q4_0 block: 20 bytes = 5 × float16 (scales) + 16 × int4 (packed as 8 bytes)
void dequantize_q4_0(const void* block, float* out, int n) {
    const uint8_t* b = (const uint8_t*)block;
    float scale[5];
    // Read 5 FP16 scales from first 10 bytes
    for (int i = 0; i < 5; i++) scale[i] = half_to_float(*(uint16_t*)(b + i*2));
    // Unpack 4-bit values + apply scales
    uint8_t* q = (uint8_t*)(b + 10);  // 8 bytes = 16 × 4-bit values
    for (int i = 0; i < 8; i++) {
        out[i*2]     = scale[i/2] * ggml_q4_0_to_float(q[i] & 0xF);
        out[i*2 + 1] = scale[i/2] * ggml_q4_0_to_float(q[i] >> 4);
    }
}
```

## GGML Core Types

- `ggml_tensor`: `data` (void*), `ne[4]` (dims), `nb[4]` (stride), `type` (dtype), `op` (operation).
- `ggml_init_params_t`: `buffer_size`, `buffer` (caller-allocated), `no_alloc`.
- `ggml_new_tensor_1d(gctx, type, n)` — 1D tensor.
- `ggml_mul_mat(ctx, a, b)` — matrix multiplication.
- Backend: `ggml_backend_cpu_init()`, `ggml_backend_cuda_init()`, `ggml_backend_metal_init()`.

## Key Functions

- `ggml_backend_tensor_get(backend_buffer, tensor, host_ptr, size)` — copy GPU→CPU.
- `ggml_backend_tensor_set(backend_buffer, tensor, host_ptr, size)` — copy CPU→GPU.
- `ggml_backend_synchronize(backend)` — wait for all GPU ops to finish.
- `ggml_backend_compute_buffer(ctx, n, nodes, &params)` — execute graph.

## Validation

- Compare dequantized logits against FP16 reference (tolerance: 1e-3 for Q4, 1e-2 for Q2).
- Test edge cases: zero scales, max int4 (0xF), negative values.
- Use `gguf_dump.py` from llama.cpp to verify header integrity.
