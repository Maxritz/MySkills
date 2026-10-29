---
name: amd-gpu-stack
description: "AMD GPU compute stack: HIP/ROCm, HSA/ROCr, CDNA and RDNA hardware, queue and memory behaviour, correctness, profiling and tuning."
compatibility: opencode
---

# AMD GPU Stack

Choose the layer that owns the observable failure. Do not assume a working HIP API proves the HSA queue, code object, memory model, GPU ISA path or framework integration is correct.

## Version and compatibility gate

Record the exact OS/kernel, GPU model and PCI ID, target ISA, driver, HIP/ROCm package release, compiler and framework versions. Capture the actual commands and environment variables.

- Check AMD's compatibility matrix for the exact OS, GPU/ISA, driver and framework combination before saying a stack is supported: https://rocm.docs.amd.com/
- The Linux ROCm stack, Windows HIP SDK, Radeon-specific framework packages and WSL are not interchangeable products. A component or framework may be supported without the entire ROCm stack being supported on that OS.
- Do not translate a Windows release number into a Linux release, TheRock version or internal component version by guess. Use the release's own compatibility and versioning notes.
- Verify targets with the installed tools, for example rocminfo, hipcc --version, the compiler's target list and the runtime device query. A GPU name alone is not a valid target-ISA check.
- Examples such as gfx1201 (RX 9070 XT class RDNA4) and gfx1100 (RX 7900 XTX class RDNA3) are identifiers, not a promise that every ROCm/HIP release supports those targets.

## Layer map

| Layer | Inspect | Typical evidence |
|---|---|---|
| API/library | HIP calls, rocBLAS, hipBLAS, RCCL, framework extension | API status, supported function/algorithm and minimal reproduction |
| Runtime | HSA agents, queues, signals, memory pools and code objects | Agent/queue capability, signal lifecycle, memory visibility, code-object target |
| Architecture | RDNA/CDNA ISA, wave mode, registers, LDS, matrix instructions | Compiler output, target-specific occupancy/resource use and differential result |
| System | Driver, kernel, topology, clocks, power, permissions | Exact compatibility row, kernel log, device query and topology |
| Profiling | Host launch, queue waits, copies, kernels, memory throughput | Version-matched profiler output with setup separated from timed execution |

## Diagnostic sequence

1. Preserve the first failure, exact input, API return code, command, build revision and device/runtime tuple.
2. Check device visibility, selected adapter, queue family/type, code-object ISA, memory allocation and copy path.
3. Reduce to one operation: a known-good library call, one kernel dispatch or one explicit copy. Add work back one dimension at a time.
4. Check all return codes, stream/event dependencies, kernel argument layout, buffer bounds, alignment, lifetime and host/device ownership.
5. Compare with a simple CPU/reference implementation using explicit tolerances. Repeatedly passing one fixture does not prove race freedom.
6. Profile only after correctness is established. Separate compile/load, allocation, host dispatch, synchronization, transfers, prefill/workload setup and steady-state kernel execution.

## Library and primitive selection

Prefer the supported library for standard operations before writing a custom kernel: rocBLAS/hipBLAS for dense linear algebra, the appropriate supported convolution/attention library for that workload, and RCCL for standard collectives. Verify that the installed version, datatype, layout, architecture and algorithm cover the exact operation.

A custom kernel is justified when the actual contract is unsupported or measurements show the library path is the bottleneck. Compare equivalent shapes, strides, precision, accumulation mode, workspace policy and warm-up. Do not compare a custom kernel against an untuned or semantically different library call.

## HSA/ROCr and memory ordering

- Query available agents, queue capabilities, ISA/code-object compatibility, memory pools and allocation flags. Do not assume a universal queue name such as COMPUTE_0 or that HIP dispatches to a particular hardware queue.
- For an AQL-level investigation, verify packet layout, ring/doorbell semantics, acquire/release scopes, completion-signal lifetime, timeout and queue teardown against the actual HSA specification/runtime.
- Keep kernarg layout and alignment consistent with the compiler's ABI. Host pointer values are not automatically valid device physical addresses.
- Distinguish allocation placement from accessibility and coherency. Fine-grained/coarse-grained flags, host-visible memory and device-local memory depend on the API/agent and platform.
- Do not assume a buffer is safe to free until all queues and asynchronous copies using it have completed.
- HIP stream/event synchronisation, HSA signal waits and Vulkan fences/barriers are different APIs with different memory-order contracts.

## RDNA and CDNA kernel work

RDNA and CDNA share AMD ISA lineage but target different products and optimisation trade-offs. Select a target-specific code path from supported compiler capabilities, not from a family-name guess.

- Verify wave size and subgroup assumptions using the target compiler/device capabilities. Never hard-code wave32 or wave64 as a universal default.
- Check register usage, LDS allocation, occupancy, memory coalescing, instruction dependencies, cache behaviour and launch overhead in compiled output and target profiling.
- Use MFMA/WMMA or other matrix instructions only when that specific ISA target and compiler expose the operation and operand format. Confirm intrinsic signatures and operand layouts from the installed compiler headers; similar-looking builtins do not imply the same lane layout.
- Specify accumulator type, rounding/saturation behaviour, denormal handling and reduction order. Compare results with a CPU or library oracle for edge shapes and odd tails.
- For quantised inference, validate block layout, scale/zero-point semantics, packing and tail handling before profiling. A faster kernel that reads the wrong layout is a correctness failure.

## Profiling rules

Profiler names, flags and output schemas change between ROCm releases. Check the installed rocprof/rocprofiler tool's own help and use documentation for the exact version. Do not assume that a profiler supports race detection or a metric merely because another version did.

Capture host-side time, GPU execution time, dispatch count, copies, synchronization waits, achieved bandwidth/compute and repeated-trial spread. Verify that the timed window does not accidentally include model loading or first-use JIT compilation. Do not infer per-token weight streaming from total file reads unless marginal IO changes with generated token count.

## HIP porting

HIPIFY is a source translation aid, not a semantic proof. For each ported operation, verify API coverage, stream semantics, memory ownership, supported precision, kernel launch geometry, inline assembly, device library coverage and error handling. PTX has no direct universal mapping to an AMD intrinsic; re-express the operation using the target compiler/library, then validate and benchmark it on that ISA.

## Validation checklist

- [ ] Exact GPU/ISA, OS, driver, HIP/ROCm and compiler versions recorded.
- [ ] Clean build targets the intended ISA and uses supported dependencies.
- [ ] API/kernel/copy errors are checked and the minimal reproducer is preserved.
- [ ] Bounds, odd dimensions, precision and memory lifecycle match a reference.
- [ ] Required sanitizer/validation checks were actually available and executed.
- [ ] Benchmark separates setup, launch, transfers, sync and device execution.
- [ ] Fallback and unsupported targets return an explicit result.

## Report

    AMD GPU STACK: ANALYSIS
    TARGET: GPU / ISA / OS / driver / HIP-ROCm version
    PATH: API-library / runtime / architecture / system / profiler
    REPRO: command, input, first error and revision
    CORRECTNESS: reference, tolerance, edge cases and result
    TIMING: setup, dispatch, transfer, sync and kernel time
    STATUS: PASS / FAIL / BLOCKED / NOT RUN
    BLOCKERS: unsupported combination or missing evidence

## Boundaries

- Use vulkan-compute-stack for Vulkan API/runtime queue and synchronisation issues.
- Use graphics-shader-kernels or shader-opt for shader semantics and tuning.
- Use llm-core, gguf-ggml or model-formats for model/tensor-format contracts.

## Optional references

- [stack-recipes.md](references/stack-recipes.md)
