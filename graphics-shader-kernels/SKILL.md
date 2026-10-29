---
name: graphics-shader-kernels
description: Designs and validates GPU shader and compute-kernel implementations, including dispatch geometry, memory semantics, precision and cross-vendor portability.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["shader kernel", "compute shader", "GLSL", "HLSL", "SPIR-V", "workgroup size"]
---

# Graphics and Compute Shader Kernels

Use this skill to implement and validate shader behaviour. Use shader-opt for profile-driven optimisation and the relevant vulkan-compute-stack, amd-gpu-stack or nvidia-cuda-stack skill for API/runtime-specific issues.

## Contract before shader code

Record input/output layouts, element widths, alignment, dispatch dimensions, valid index ranges, precision contract, aliasing rules, synchronization scope and permitted out-of-range behaviour. Define the CPU/reference result for a small deterministic workload.

## Correct implementation

- Prove every global index is in bounds, including partial workgroups and zero/small dimensions. Guard padded lanes before memory access.
- Treat workgroup/shared-memory barriers as control-flow and memory-ordering requirements. Every participating invocation must reach required barriers under valid uniform control flow.
- Distinguish workgroup barriers, subgroup operations, device memory barriers and host/API synchronization. One is not a substitute for another.
- Check storage layout, descriptor/parameter offsets, push-constant limits, alignment and host-shader struct agreement.
- Use subgroup operations only with explicit assumptions about subgroup size, lane layout and feature availability. Provide a fallback or declare the capability requirement.
- Define numerical behaviour for denormals, NaNs, signed zero, integer overflow, fused operations and reduction order where these can affect results.
- Keep shader compilation, SPIR-V validation, pipeline creation, dispatch and result readback in the validation path. A shader that compiles is not proven correct.
- Avoid undefined races and write-after-write conflicts. Use validation tools and race analysis where available; a clean run is not proof that all interleavings are safe.

## Test matrix

Exercise dimensions below, equal to and above workgroup/tile sizes; non-multiples; empty inputs; maximum supported sizes; repeated dispatch; multiple queues when applicable; and at least two vendors or a documented target limitation. Compare against a simple reference with explicit absolute and relative tolerances.

## Report

Include target API, device, driver, shader compiler, feature requirements, dispatch geometry, reference comparison, validation-tool output and unresolved portability limits. Optimisation claims belong in shader-opt and require measurements on the target.
