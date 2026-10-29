---
name: nvidia-cuda-stack
description: "NVIDIA GPU compute stack: CUDA runtime/driver, streams, graphs, memory, kernel execution, libraries, profiling and architecture-aware validation."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: false
  trigger_keywords: ["CUDA", "NVIDIA", "H100", "H200", "B200", "GB200", "A100", "RTX", "PTX", "SASS", "Nsight", "cuBLAS", "cuDNN", "NCCL", "TensorRT"]
---

# NVIDIA CUDA Stack

## Version and target gate

Record OS, GPU SKU and compute capability, driver, CUDA Toolkit, compiler version, framework/library versions and target binary architecture. Use the installed CUDA documentation and supported GPU matrices for exact version combinations.

The CUDA version printed by nvidia-smi describes driver compatibility, not necessarily the Toolkit installed on the machine. Do not declare a toolkit/driver mismatch from those two version strings alone. Verify nvcc --version, driver API/runtime errors and the version compatibility documentation.

Official reference: https://docs.nvidia.com/cuda/cuda-c-programming-guide/

## Choose the layer

| Layer | Inspect |
|---|---|
| Runtime/driver | Device selection, streams/events, graphs, memory allocation, errors and object lifetime |
| Kernel/ISA | Launch geometry, bounds, race conditions, registers, shared memory, PTX/SASS and numerical contract |
| Libraries | cuBLASLt/cuBLAS, cuDNN, CUTLASS, NCCL and TensorRT capability for the actual shape/dtype/layout |
| Profiling | Nsight Systems for end-to-end scheduling; Nsight Compute for kernel metrics; matching profiler version |

## Mandatory capture

1. Preserve the first error and exact reproducer, source revision and launch command.
2. Record cudaGetDeviceProperties or equivalent output, compute capability, memory, enabled features and binary targets.
3. Capture API return codes. Check launch errors and asynchronous errors separately; an error can surface at a later synchronisation point.
4. Record stream dependencies, event ordering, buffer lifetimes, host/device transfer direction and graph-capture constraints.
5. Reproduce with the simplest library or kernel path before changing architecture-specific code.

## Runtime and memory correctness

- Treat every CUDA call's status as part of the control flow. Do not continue with uninitialised pointers or assume a failed allocation returned usable memory.
- Check all launch dimensions, index arithmetic, offsets, pitch/stride, alignment and tail masks. Guard partial blocks and zero-sized workloads.
- Distinguish a launch configuration, kernel completion, memory visibility and host observation. Use streams, events and synchronisation for the actual producer-consumer dependency; avoid global synchronisation as an unexplained fix.
- Keep host buffers, device allocations, streams, events and graph/executable objects alive until all asynchronous users have completed.
- Unified memory does not imply free migration, deterministic placement or negligible page-fault cost. Measure migration and prefetch behaviour on the target.
- Treat graph capture as a separate execution mode. Allocation, host callbacks, synchronisation and API calls supported during capture depend on the API and toolkit version.
- Prefer the official Compute Sanitizer tools for supported memory, race, init and synchronization checks. A clean tool run is evidence for the tested workload, not proof against every schedule.

## Library-first policy

Use supported libraries for standard operations before implementing a custom kernel. Confirm datatype, accumulation precision, layout, epilogue, workspace, determinism, shape and compute-capability support for the installed library version.

Use custom PTX/SASS, inline assembly, CUTLASS or handwritten kernels only when a measured requirement is unsupported or the library path is demonstrably the bottleneck. Inline assembly must declare constraints and clobbers correctly, and it must match the exact target ISA and compiler contract.

## Architecture-specific work

- **Ampere and later:** verify the specific GPU's tensor-core datatypes, asynchronous copy options, shared-memory limits and required instruction/toolkit support. Do not generalise one Ampere device to every SKU.
- **Hopper and later:** TMA, thread-block clusters, distributed shared memory and related operations require capability checks, correct launch attributes, valid tensor-map descriptors and matching compiler/runtime support.
- **Blackwell and later:** do not assume FP4/FP6, microscaling, cluster sizes or library support are interchangeable across chips and software releases. Confirm the exact supported data formats and kernel path.
- Compute capability alone does not prove that a feature is enabled or that a specific library uses it. Inspect actual compiled code or profiling evidence where the claim matters.

### Cluster launch attribute pattern

For toolkits that support extended launches and clusters, the attribute is passed through the attributes array. The cluster dimension is not a direct member of cudaLaunchConfig_t.

    cudaLaunchConfig_t config = {};
    config.gridDim = dim3(grid_x, grid_y, grid_z);
    config.blockDim = dim3(threads_x, threads_y, threads_z);
    config.dynamicSmemBytes = dynamic_shared_bytes;

    cudaLaunchAttribute attrs[1] = {};
    attrs[0].id = cudaLaunchAttributeClusterDimension;
    attrs[0].val.clusterDim = dim3(cluster_x, cluster_y, cluster_z);
    config.attrs = attrs;
    config.numAttrs = 1;

    // Confirm grid dimensions satisfy cluster divisibility and that the
    // kernel, GPU, CUDA Toolkit and driver support this launch mode.
    cudaError_t status = cudaLaunchKernelEx(&config, kernel, arg0, arg1);
    if (status != cudaSuccess) {
        /* Return or report status using the caller's error contract. */
    }

This is a launch-API pattern, not a complete kernel or application. Check the exact header signatures, cluster support and argument types for the pinned toolkit. For TMA, use the documented tensor-map and copy/wait primitives or supported abstractions for that release; do not paste an unverified compiler builtin from another toolchain.

## Multi-GPU and communication

- Verify device enumeration, peer-access capability, topology, rank/world-size agreement and collective ordering.
- Use a supported NCCL collective for standard all-reduce/broadcast operations; check every return status and confirm datatype/operator support in the installed NCCL version.
- Ensure all ranks enter compatible collectives and propagate failures without leaving peers blocked indefinitely.
- Do not assume a fixed NVLink bandwidth, topology, MIG partition count or collective algorithm from a product-family label. Inspect the actual device and topology.

## Profiling and benchmarks

1. Establish correctness and a reproducible baseline before tuning.
2. Use Nsight Systems to identify CPU stalls, launch overhead, copies, synchronisation and pipeline gaps; use Nsight Compute for kernel-level metrics.
3. Separate compilation/loading, warm-up, allocation, host-to-device transfer, device execution and readback. Avoid timing an asynchronous launch without measuring completion.
4. Fix input shapes, layout, dtype, accumulation, batch/concurrency, clocks/power state, driver/toolkit, library algorithm and warm-up.
5. Report median and spread over repeated trials, plus correctness deltas, bandwidth/throughput and peak memory. Do not report the best sample alone.
6. Compare against the strongest applicable library baseline under identical semantics. Do not claim improvement if the output changes beyond the accepted tolerance.

## Validation checklist

- [ ] Exact GPU, compute capability, driver, Toolkit and library versions recorded.
- [ ] All API and asynchronous errors handled.
- [ ] Bounds, masks, alignment, lifetime and stream dependencies checked.
- [ ] Supported sanitizers and regression tests actually executed.
- [ ] Reference output matches with explicit tolerances.
- [ ] Benchmark excludes setup unless setup is the measured target.
- [ ] Any architecture-specific feature has a documented capability fallback.

## Report

    NVIDIA CUDA STACK: ANALYSIS
    TARGET: GPU / compute capability / OS / driver / Toolkit
    LAYER: runtime / kernel / library / profiler
    REPRODUCER: command, input, first error and revision
    CORRECTNESS: reference, tolerance, sanitizer/test result
    PERFORMANCE: workload, baseline, repeated timing spread
    STATUS: PASS / FAIL / BLOCKED / NOT RUN
    BLOCKERS: unsupported feature or missing evidence

## Boundaries

- Use llm-serving or the engine-specific vLLM, SGLang and TensorRT-LLM skills for model-serving workflow.
- Use graphics-shader-kernels for shader semantics and vulkan-compute-stack for Vulkan APIs.
- Use kernel-tuning or optimization-toolkit for deeper performance search.
