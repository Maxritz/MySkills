---
name: shader-opt
description: Optimise compute and graphics shaders using compiler output, profiling, wave behaviour, memory access, register pressure and measured workload constraints.
license: MIT
compatibility: opencode
---

# Shader Optimisation

Optimise the shader that is actually dispatched, on the actual target, with correctness checks. A source-level simplification is not proof of a faster shader.

## Identify the execution model

Record API and shader language/version, target GPU/driver, compiler/toolchain, wave or subgroup behaviour where known, workgroup/thread-group dimensions, resource bindings, data layout, precision, dispatch size and workload. Never mix CUDA, HIP, GLSL, HLSL and SPIR-V intrinsics as though they were interchangeable.

## Find the limiting resource

- **Divergence:** lanes/waves take different paths. Compare coherent branching, predication and data reorganisation on the target compiler. Branchless arithmetic can cost more and can change exceptional-value semantics.
- **Memory traffic:** inspect coalescing, stride, alignment, cache reuse, redundant loads/stores and intermediate buffers.
- **Register pressure:** inspect VGPR/SGPR or equivalent compiler reports, spills and active-wave limits.
- **Local/shared memory:** verify layout, bank behaviour, capacity, barriers and producer-consumer ordering.
- **Instruction throughput:** inspect generated ISA, dependencies, conversion cost and vector/scalar utilisation.
- **Dispatch/synchronisation:** count dispatches, barriers, queue submissions and host waits; fuse only when saved overhead outweighs occupancy, register and parallelism costs.

## Tuning loop

1. Capture the correct baseline, output and repeated timings.
2. Build a hypothesis from a profile or compiler report.
3. Make one meaningful shader or dispatch change.
4. Compile for the exact target and inspect diagnostics/ISA if available.
5. Validate bounds, alignment, precision, race freedom, barriers and all supported shapes.
6. Compare output to a trusted reference using justified tolerances.
7. Re-measure GPU time and end-to-end time; account for synchronisation and instrumentation overhead.
8. Keep only reproducible improvements.

## Common transformations to evaluate, not assume

- Remove redundant passes and intermediate writes when data dependencies allow fusion.
- Tile/reuse data when it improves memory traffic without excessive register or local-memory use.
- Choose workgroup dimensions based on hardware, element count and compiler evidence.
- Hoist invariant calculations where this reduces actual work.
- Use subgroup/wave operations only when language support, subgroup size and cross-vendor semantics are handled.
- Specialise common shapes only with correct generic fallback behaviour.
- Avoid unnecessary precision conversions while meeting the numerical contract.

## Reject

- Blindly targeting 75% occupancy or a fixed block size.
- Claiming branchless code is always faster.
- Using vendor-specific intrinsics in a supposedly portable shader without feature guards.
- Guessing that a barrier, volatile qualifier or memory modifier provides the required cross-stage/host visibility.
- Reporting shader-only timing while claiming an end-to-end speedup.

## Output

State target, compiler, dispatch shape, before/after GPU and wall timings, variance, resource/compiler deltas, correctness result, generated-code evidence and remaining limitations.

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Record target GPU, compiler, shader model/SPIR-V version, launch shape and precision. Verify memory access, barriers, atomics and edge dimensions before tuning; inspect compiler output and measure the same workload with correctness retained.


## Boundaries

Use \`vulkan-compute-stack\` for Vulkan setup/synchronisation and \`amd-gpu-stack\` or \`nvidia-cuda-stack\` for vendor-specific architecture and profiling.