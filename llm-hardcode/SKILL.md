---
name: llm-hardcode
description: "Hand-optimised LLM kernels: tensor layouts, quantised matvec/GEMM, SIMD, cache behaviour, numerical accuracy and differential validation."
license: MIT
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
---

# LLM Hardcode Development

Write custom kernels only when a measured workload justifies them. Preserve the operator contract, exact tensor layout, data type, quantisation semantics and a trusted correctness reference.

## Memory and tensor layout

- Do not assume every tensor is contiguous or row-major. Respect explicit strides, dimensions, transpose flags, alignment and broadcasting semantics.
- Record tensor shape, dtype, layout, quantisation type, block size and accumulation precision before writing the kernel.
- For KV cache, document layout by layer, head, token and head dimension. Benchmark the actual access pattern rather than choosing a layout by convention.
- Tile GEMM/matvec only after measuring the working set, data reuse and launch/dispatch cost.

## CPU SIMD

- Use the exact CPU vendor/family/model, available ISA extensions, OS state, compiler version and target flags to select intrinsics.
- Provide runtime dispatch or a safe baseline implementation when binaries may run on CPUs without the specialised ISA.
- Check compiler intrinsic headers and generated ISA. An intrinsic's name, vector width or instruction count does not establish its latency or throughput.
- AVX2, AVX-512, FMA, VNNI and other extensions are not interchangeable. Masked operations may require particular ISA subsets such as AVX-512VL.
- Validate alignment, tails, signedness, saturation, overflow, reduction order and multithreading. Avoid undefined behaviour from aliasing or out-of-range vector loads.

## Quantisation formats

Treat each quantisation layout as a binary contract. Pin the exact GGML/llama.cpp revision and consult its definitions and reference dequantisers:
- https://github.com/ggml-org/llama.cpp/wiki/Tensor-Encoding-Schemes
- https://github.com/ggml-org/llama.cpp/blob/master/ggml/include/gguf.h

For the common GGML Q4_0 block layout, the block stores one 16-bit scale value and 16 packed bytes for 32 four-bit values, for 18 bytes per block (4.5 storage bits per weight before surrounding tensor/layout overhead). Each byte contains two nibbles; the decoded values are transformed using the format's signed offset and scale convention. Verify the exact packing order and formula in the target revision before implementing it.

Do not assume:
- that every quant type uses the same number of scales or one zero-point field;
- that nominal bits per weight equals exact storage size;
- that the scale must be positive;
- that a tensor's element count is always a multiple of its block size;
- that a format name guarantees an unchanged layout across revisions.

For every supported type, test complete blocks and tails, minimum and maximum codes, zero or unusual scales, negative values, alignment and malformed metadata.

## Numerical behaviour

- Softmax should subtract the maximum before exponentiation, with defined handling for empty inputs and non-finite values.
- Clamping does not automatically prevent NaN propagation; define the desired NaN/Inf policy explicitly.
- LayerNorm and RMSNorm are different operations. Preserve the exact formula, epsilon placement, accumulation type and weighting/bias rules.
- Mixed precision must define where values are converted and what type accumulates partial sums.
- Reduction order can change floating-point results. Use project-specified tolerances and reference comparisons instead of universal tolerances copied from another workload.

## Kernel patterns

- Elementwise work: vectorise contiguous spans and handle tails safely.
- Reductions: use a measured reduction tree; account for lane/wave communication and numerical order.
- GEMM: tune register, local/shared memory and global-memory reuse together. Packing may help repeated work but can cost more than it saves for one-off matvec.
- Fusion: remove intermediate traffic only when added register pressure, code size and reduced parallelism do not erase the gain.
- Gather/scatter: inspect access locality and cache behaviour before introducing complex staging.

## Validation

1. Freeze a deterministic scalar or trusted reference path.
2. Compare outputs over representative shapes, edge cases and randomised inputs.
3. Define metrics and tolerances for dequantisation, intermediate tensors, logits and end-to-end output.
4. Run sanitizers or memory checking where available.
5. Benchmark identical workloads with correct warm-up and synchronisation, repeated measurements and raw timings.
6. Inspect generated ISA and counters to explain the measured benefit.
7. Keep the previous implementation and add a regression test for each discovered defect.

## Output

Report target ISA, compiler flags, layout and quant type, correctness deltas, raw timings and spread, fallback behaviour, generated-code evidence, and remaining limitations.

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Pin the exact quantisation layout and compiler/ISA. Dispatch only after checking CPU features and OS-managed vector state, keep a safe fallback, and compare dequantised values and outputs against a trusted oracle before performance claims.


## Boundaries

Use gguf-ggml for model-file/quantisation contracts, llm-core for inference operator semantics, and kernel-tuning for broader profiling. Do not call a kernel complete because it compiles or runs one shape.
