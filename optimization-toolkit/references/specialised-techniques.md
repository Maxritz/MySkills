# Optimisation Toolkit: Specialised Technique Notes

Use these notes only when demoscene/code-size constraints or RDNA2-native instruction work is relevant. Prefer the dedicated skills linked from the core for task-specific guidance.

## 1. Demoscene Legends Framework

When optimizing any hot path, enumerate what each legend would do:

### farbrausch (Minimalism)
- **Code size**: Fit in KB, not MB
- **Hand-tuned asm**: Critical loops in asm
- **Aggressive inlining**: No call overhead
- **Lookup tables**: Trade memory for compute
- **Binary compression**: Crunch/Crinkler
- **Dead code elimination**: Strip every unused byte

### Ryg / BeRo (Instruction-Level)
- **ILP**: Schedule independent ops (VLIW style)
- **Non-temporal stores**: Bypass cache for streaming
- **Prefetching**: Software prefetch ahead
- **Bit manipulation**: Bit tricks over arithmetic
- **Custom toolchains**: Specialized compilers

### Haujobb (Streaming)
- **Single-pass**: No intermediate buffers
- **Register tiling**: Reuse loaded data
- **SIMD dot-product**: Specialized instructions
- **Software pipelining**: Overlap dequantize/compute
- **Coalesced access**: Stride-1, no scatter/gather
- **Stall hiding**: Schedule to fill bubbles

### Wayfinder / Fiver2 (Procedural)
- **Procedural generation**: Generate, don't store
- **Algorithmic compression**: Fractal/noise replace assets
- **Bit-packing**: Multiple values per register
- **XNOR + popcount**: Binary neural nets
- **Fixed-point**: Eliminate float
- **1-bit quantization**: Extreme compression

### Chaos Inc / KB (Entropy)
- **Procedural content**: Generate from seeds
- **Minimal engines**: 1-4KB outperforming larger
- **Self-modifying code**: Specialize at runtime
- **Entropy coding**: Minimum representation

---

## 4. RDNA2/ROCr/HSA Translation (GPU)

| Demoscene Concept | RDNA2/ROCr Mapping |
|-------------------|---------------------|
| **Bit-packing** | Pack 8 int4 / 4 int8 into 32-bit VGPR, use `v_dot8_i32_i4` |
| **Fused pipelines** | Read packed weights, scale via `v_mul`/`v_pk`, accumulate int32 |
| **Register tiling** | Reuse 8×8 weight tiles across work-items |
| **LUT optimization** | LDS table indexed by quantized value |
| **Non-temporal stores** | `glc`/`dlc`/`slc` cache hints on loads/stores |
| **Bump allocator** | Pre-allocate HSA pool, hand out from bump buffer |
| **Software pipeline** | Overlap dequant(next) with compute(current) |
| **ILP** | Schedule independent SGPR/VGPR ops, hide `s_waitcnt` stalls |

### RDNA2 Native Dot Instructions (Raw GCN only)
```asm
// v_dot8_i32_i4: 8×int4 × 8×int4 → int32 accumulate
v_dot8_i32_i4 v0, v1, v2, v3

// v_dot4_i32_i8: 4×int8 × 4×int8 → int32
v_dot4_i32_i8 v0, v1, v2

// v_dot2_i32_i16: 2×int16 × 2×int16 → int32
v_dot2_i32_i16 v0, v1, v2
```

---
