---
name: python-conversion
description: "Semantics-preserving conversion of Python model/runtime components to C/C++, GPU backends or interchange formats with independent differential validation."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["Python conversion", "C++ port", "CUDA port", "HIP port", "ONNX export", "MLIR", "differential test", "native backend", "torch conversion"]
---

# Python Conversion

Translate behaviour, not syntax. Freeze the source implementation and its exact inputs/outputs before replacing a component. A build, import or single matching prompt does not establish equivalence.

## 1. Freeze a source contract

For the source revision, record:
- Model/config/tokenizer revisions and hashes.
- Shapes, strides, dtypes, layouts, quantisation/block format and device.
- Special tokens, preprocessing, masks, RoPE variant/scaling, cache semantics and output ordering.
- Error and side-effect behaviour, including empty inputs and invalid shapes.
- Numerical acceptance criteria and the workload used to measure performance.

Read dimensions and architecture fields from the actual model configuration. Do not combine convenient defaults from different model families. For grouped-query attention, validate that query-head count is divisible by key/value-head count; do not hard-code assumed dimensions where the source config is available.

## 2. Choose one component and backend

Start with a small, independently testable contract and keep the reference path runnable.

| Component | Contract to preserve | Common hidden mismatch |
|---|---|---|
| Tokenizer | IDs, special tokens, normalisation, merges/scores, byte fallback | Different tokenizer revision or added-token handling |
| Embedding | Token indexing, padding, vocabulary map and output dtype | Index width, offsets or missing padding semantics |
| Attention | Q/K/V layout, head mapping, masks, RoPE, scaling, softmax precision | Incorrect RoPE pairing, causal-mask alignment, KV-head broadcast |
| KV cache | Positions, page/block mapping, reuse, eviction and ownership | Stale slots, off-by-one positions, sharing across requests |
| MLP/norm | Activation, gate/up ordering, epsilon, reduction and accumulation dtype | SwiGLU order, epsilon placement, FMA/rounding differences |
| Quantised matmul | Exact block layout, scale/zero-point, packing, tails and accumulator | Treating a block quantiser as uniform bits-per-weight |
| Sampling | Logit transforms, tie rules, RNG algorithm/state, stop logic | Same seed but different RNG/operation order |
| Export graph | Opset/runtime support, dynamic shapes, external weights, preprocessing | Operator-provider mismatch or changed defaults |

Do not assume FlashAttention, a particular quantiser, CUDA, HIP, Vulkan or ONNX supports every model/configuration. Probe the actual library/runtime version and target capability. If the target cannot preserve the contract, report the unsupported behaviour rather than silently substituting a different one.

## 3. Specification and numeric policy

Keep model metadata in a versioned manifest rather than scattering literals through kernels. Validate positive dimensions, head-count divisibility, shape products, arithmetic overflow, tensor names, tensor types, alignment and memory limits before allocation.

Define tolerances per operation and dtype. Use exact comparison for integer/token outputs; use absolute and relative tolerance for floating-point tensors; add top-k/logit checks where appropriate. An ULP limit is useful only when the test actually computes ULP distance for the specific format. Do not record an unused tolerance field.

Use the same input tensors for reference and target. For stochastic generation, compare deterministic logits or use an explicitly specified RNG contract. A seed alone does not guarantee bitwise-identical output across runtimes, precision modes or devices.

## 4. Differential test primitive

This helper is real Python and can be imported into a project test. It tests array equivalence, not a complete model conversion.

    import numpy as np

    def compare_outputs(reference, candidate, *, rtol: float, atol: float):
        ref = np.asarray(reference)
        got = np.asarray(candidate)
        if ref.shape != got.shape:
            raise AssertionError(f"shape mismatch: {ref.shape} != {got.shape}")
        if ref.size == 0:
            raise AssertionError("empty output requires an explicit contract")
        if not np.isfinite(ref).all() or not np.isfinite(got).all():
            raise AssertionError("non-finite reference or candidate output")
        delta = np.abs(got.astype(np.float64) - ref.astype(np.float64))
        np.testing.assert_allclose(got, ref, rtol=rtol, atol=atol)
        return {
            "max_abs_error": float(delta.max()),
            "rms_abs_error": float(np.sqrt(np.mean(delta * delta))),
        }

A project-level test must call both real implementations with identical inputs. Include intermediate checks as well as end-to-end checks so the first divergent component is visible. Add minimal shapes, non-multiple tails, long sequence, mixed sequence lengths, invalid inputs and cache reuse where relevant. Assert outputs as well as side effects and error statuses.

Do not invent module imports, fixtures or a green test result. If the reference/target adapters are not implemented yet, report that as missing wiring and create a proper test plan; do not present the helper above as proof that conversion is complete.

## 5. Conversion by component

1. Convert one component and keep the old reference available.
2. Confirm interface shape, data layout, precision and error handling before optimising.
3. Compare intermediate tensors against the reference.
4. Test boundary/negative cases and lifetime under repeated use.
5. Only then fuse operations or add ISA-specific/GPU kernels.
6. Re-run differential tests after every material optimisation and record any intentional semantic difference.

For attention, test causal mask edges, RoPE positions/scaling, GQA/MQA head broadcast, sequence lengths around tile/page boundaries and cache reuse. For sampling, test all-masked logits, NaNs/infinities, ties, top-k/top-p boundary, minimum/maximum temperature, stop-token behaviour and RNG repeatability under the documented scope.

## 6. Build and package by backend

Do not put TOML, Meson syntax, CMake, Python and CUDA/HIP snippets in one executable code block. They are different files/languages and need separate build logic.

- CPU-only extension: use the project's chosen Python build backend and verify the produced wheel and installed import from a clean environment.
- CUDA: use the pinned CUDA Toolkit/compiler and its documented build integration. Verify compute capability, target code generation, driver/runtime compatibility and library versions.
- HIP/ROCm: use the installed supported HIP compiler and CMake/Meson integration for that release. Validate the exact GPU target and OS/driver compatibility.
- Vulkan: compile SPIR-V for the intended environment, validate layouts/feature requirements and exercise the real dispatch/readback path.
- ONNX/MLIR: record opset/dialect/runtime revisions, supported operators, shape assumptions and target execution-provider behaviour.

Build one backend per explicitly configured target unless the build system has a verified multi-backend design. Do not use imaginary functions such as find_cuda or find_hip in Meson; do not list CUDA/HIP sources in a C++-only project and assume they are compiled. For packaging details, use python-engineering and model-formats.

## 7. Reproducibility and release gate

Record source commit, model/tokenizer hashes, converter revision, compiler flags, target ISA, runtime version, quantisation parameters, test inputs/outputs and tolerance rules. Store conversion outputs in staging, validate all files and metadata, then atomically publish a manifest. Preserve the last known-good artefact if validation fails.

Report components converted/verified separately. Passing unit tests for one operator does not validate the full model; matching tensor outputs does not establish task quality; task quality does not prove runtime safety.

## Output report

    PYTHON CONVERSION: ANALYSIS
    SOURCE: code/model/config/tokenizer revision
    TARGET: language/backend/format and target ISA
    COMPONENTS: implemented / tested / unimplemented
    DIFFERENTIAL: cases passed / failed / blocked
    NUMERICAL: tolerances, max/RMS error and task-level check
    PROVENANCE: hashes, compiler, converter and quantisation parameters
    STATUS: PASS / FAIL / BLOCKED / NOT RUN
    BLOCKERS: explicit list

## Boundaries

- Use python-engineering for package metadata, typing and async lifecycle.
- Use python-perf for Python/NumPy/native performance tuning.
- Use c-systems for C/C++ ABI and ownership.
- Use model-formats for GGUF/SafeTensors/ONNX/OpenVINO file contracts.
- Use amd-gpu-stack or nvidia-cuda-stack for the native GPU backend.
- Use goli-mat-de if claimed conversions contain placeholders or unverified completion claims.
