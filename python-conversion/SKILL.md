---
name: python-conversion
description: "Python to native conversion: component-by-component translation to C/C++/CUDA/HIP/ONNX/MLIR with differential testing. Frozen reference, specification template, tolerance tracking, reproducible toolchain."
compatibility: opencode
---
# Python Conversion

Port semantics, not syntax. Convert one component at a time, using a frozen source implementation and acceptance criteria.

## Workflow

1. **Inventory:** record source/target language, runtime, dependencies, dtype, layout, side effects and supported platforms.
2. **Specify:** freeze input/output shapes, defaults, error behaviour, state transitions and numerical tolerances.
3. **Convert by component:** tokenizer, embeddings, attention/RoPE, MLP/norm, sampling and packaging each get their own contract and test.
4. **Differential-test:** compare intermediate values and final outputs with the source at fixed seeds/inputs; include edge cases and malformed inputs.
5. **Integrate:** verify dispatch, dependencies, build/package, import and target runtime. Test the packaged artefact, not only the source tree.
6. **Profile last:** preserve correctness first; measure representative workloads and separate conversion/build overhead from runtime performance.

Detailed specification, component templates, differential harness and packaging examples: [conversion recipes](references/conversion-recipes.md).

## Output Report

```
PYTHON CONVERSION: ANALYSIS
SOURCE: <python_ref>
TARGET: <cpp|cu|hip|onnx|mlir>
COMPONENTS: <converted>/<total>
TOLERANCES: rtol=<val> atol=<val> max_ulp=<val>
DIFFERENTIAL: <passed>/<total> ✅/❌
PROVENANCE: source=<commit> converter=<ver> quant=<params>
BLOCKERS: <missing deps|conversion gap|tolerance breach>
```

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Freeze source outputs, config and dependency versions before conversion. Differential-test intermediate and end-to-end behaviour, include boundary and malformed cases, and account for packaging, deployment and numerical drift as separate acceptance criteria.


## Boundaries

- Does not write kernel code (see `nvidia-cuda-stack`/`amd-gpu-stack`)
- Does not handle packaging/typing/async (see `python-engineering`)
- Does not optimise numerical kernels (see `python-perf`)
- Does not validate model formats (see `model-formats`)
- `stop python-conversion`: revert.