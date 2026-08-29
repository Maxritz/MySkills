---
name: demoscene
description: Channels legendary demoscene groups (farbrausch, BeRo, Ryg, Haujobb, Wayfinder, Fiver2, Chaos Inc, KB) for extreme performance optimization. Enumerates what each legend would do for any optimization challenge.
---

# Demoscene Optimization

When optimizing any code, enumerate what these demoscene legends were excellent at:

## farbrausch
- **Minimal code size**: Fit entire demos in KB, not MB
- **Hand-tuned assembly**: Write critical loops in asm, not C
- **Aggressive inlining**: No function call overhead
- **Precomputed lookup tables**: Trade memory for compute, eliminate runtime math
- **Binary compression**: Pack everything through Crunch/Crinkler
- **Dead code elimination**: Strip every byte not actively used

## BeBo
- **Instruction-level parallelism**: Schedule independent ops together (VLIW style)
- **Non-temporal stores**: Bypass cache for streaming writes
- **Aggressive prefetching**: Software prefetch ahead of need
- **Minimal footprint**: Engine + assets fit in tiny memory
- **Bit manipulation**: Use bit tricks instead of arithmetic
- **Custom toolchains**: Build specialized compilers/assemblers

## Ryg (Conrad Schaff)
- **Profiling everything**: Find every slow instruction with profiling tools
- **Data layout optimization**: AoS→SoA conversion for SIMD, cache-line friendly
- **Integer SIMD over float**: Use int math where possible (PMULLD, madd)
- **Fused pipelines**: Dequantize→compute→accumulate in single pass
- **Register allocation**: Keep hot data in registers, not memory
- **Branch elimination**: Convert branches to predicated/LUT code

## Haujobb
- **Single-pass streaming**: No intermediate buffers, fuse all stages
- **Register tiling**: Reuse data loaded into registers across multiple computations
- **SIMD instruction exploitation**: Use specialized dot-product instructions
- **Software pipelining**: Overlap dequantize of next block with compute of current
- **Memory access pattern optimization**: Coalesce, stride-1, avoid scatter/gather
- **Pipeline stall hiding**: Schedule to fill bubbles

## Wayfinder
- **Procedural generation**: Generate data instead of storing it
- **Algorithmic compression**: Fractal/noise functions replace stored assets
- **Compute over storage**: Recompute cheap values instead of caching
- **Hash-based techniques**: Use hash functions for deterministic randomness

## Fiver2
- **Bit-packing**: Pack multiple values into single registers/words
- **XNOR + popcount**: Binary neural networks, bitwise operations
- **Fixed-point math**: Eliminate floating point
- **Lookup table optimization**: Replace arithmetic with table indexing
- **1-bit quantization**: Extreme model compression via bit matrices

## Chaos Inc / KB
- **Procedural content**: Generate everything from seeds, no storage
- **Minimal engines**: 1KB-4KB complete engines that outperform larger ones
- **Self-modifying code**: Specialize code at runtime for specific data
- **Mathematical generation**: Use math functions instead of storing data
- **Entropy coding**: Pack data to minimum representation

## Generic Application Framework

When applying these to ANY project:

1. **Find the hot path**: Profile the code, identify what takes 90% of time
2. **Eliminate intermediates**: Any intermediate buffer/array can be fused away
3. **Tighten data layout**: Ensure data is cache-line friendly, SIMD accessible
4. **Reduce memory traffic**: Every byte loaded should be reused multiple times
5. **Remove branches**: Convert conditional logic to arithmetic/bit tricks
6. **Inline everything**: Function call overhead is death for inner loops
7. **Specialize for known inputs**: Generate code specialized to the specific problem

## GPU Translation Guide (RDNA2/ROCr/HSA)

When mapping these concepts to AMD GPU compute (RDNA2/gfx1031), translate:

- **Bit-packing** → pack 8 int4 / 4 int8 weights into one 32-bit VGPR, use RDNA2 dot units
- **Fused pipelines** → read packed weights, apply scale via v_mul/v_pk, accumulate in int32
- **Register tiling** → reuse 8x8 weight tiles across work-items in a workgroup
- **LUT optimization** → LDS table indexed by quantized value
- **Non-temporal stores** → use glc/dlc/slc cache hints on loads/stores
- **Bump allocator** → pre-allocate large HSA pool, hand out from bump buffer
- **Software pipeline** → overlap dequant of next block with compute of current
- **ILP** → schedule independent SGPR/VGPR operations, hide s_waitcnt stalls

RDNA2 native dot instructions (only available via raw GCN, not HIP):
- `v_dot8_i32_i4`: 8×int4 × 8×int4 → int32 accumulate
- `v_dot4_i32_i8`: 4×int8 × 4×int8 → int32 accumulate
- `v_dot2_i32_i16`: 2×int16 × 2×int16 → int32 accumulate
