---
name: rocr-core
description: "ROCr: hsa_init, queues, signals, kernel dispatch."
license: MIT
compatibility: opencode
---

# ROCr
# ROCr

## HSA Initialization

- `hsa_init()` — initializes the HSA runtime. Must be called before any other HSA function.
- `hsa_iterate_agents` — enumerate all HSA agents (CPU + GPU).
- `hsa_agent_get_info` — query agent attributes (name, device type, memory pools).
- `hsa_queue_create` — create a queue for kernel dispatch (max 32-bit work dimension).
- Cleanup: `hsa_queue_destroy` → `hsa_shut_down()`.

## Memory Management

- `hsa_memory_pool_allocate` — allocate from specific memory pool (VRAM or host).
- Memory pools: `HSA_AMD_AGENT_MEMORY_POOL_FINE_VRAM` (GPU-local), `HSA_AMD_AGENT_MEMORY_POOL_COARSE_UCP` (uncaptured).
- `hsa_memory_copy` — memcpy between host and device (async version: `hsa_memory_copy_async`).
- `hsa_signal_create` — create a signal (32-bit int) for synchronization.

## Kernel Dispatch

- Load code object: `hsa_code_object_reader_create_from_file` → `hsa_executable_create`.
- `hsa_executable_get_symbol` — get kernel symbol (code handle).
- Kernel dispatch packet: `hsa_kernel_dispatch_packet_t` with `workgroup_size_x/y/z`.
- Submit via `hsa_queue_store_write_index_relaxed` + `hsa_signal_store_relaxed`.

## Synchronization

- Signals: `hsa_signal_t`. `hsa_signal_wait_scacquire` blocks CPU until value matches.
- `hsa_signal_subtract_relaxed` / `hsa_signal_add_relaxed` for atomic signal updates.
- Fence: `hsa_signal_store_scarce` to ensure ordering.
- ROCr queues are MPMC — safe for multi-threaded host code.

## Profiling

- `rocm-smi` CLI: power, temperature, clock, VRAM usage.
- `rocprof` for kernel timing and hardware counters.
- `rcrdump` to inspect code object (ISA) layout.
- Environment: `HSA_ENABLE_SDMA=0` forces CPU dispatch path (debugging).
