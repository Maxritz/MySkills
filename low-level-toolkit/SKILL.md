---
name: low-level-toolkit
description: "Assembly, emulation, toolchains: ISA/ABI analysis, instruction selection, binary interfaces, emulator design, compiler/linker/sysroot reproducibility. For bare-metal, kernel, compiler, and binary-level work."
compatibility: opencode
metadata:
  loading: on-demand
  auto_trigger: true
  trigger_keywords: ["assembly", "emulation", "toolchain", "ISA", "ABI", "calling convention", "binary", "disassembly", "compiler", "linker", "sysroot", "emulator", "simulator", "JIT"]
---

# Low-Level Toolkit

**Unified across assembly, emulation, and toolchains.** For bare-metal, kernel, compiler, and binary-level work.

---

## 1. Assembly & Binary Interfaces

### Pre-Requisites (Before Hand-Coding)
- [ ] ISA, mode, ABI, object format, assembler syntax, toolchain recorded
- [ ] Correct scalar/reference implementation exists
- [ ] Generated assembly inspected (`-S -O2 -march=native`)
- [ ] Flags, masking, alignment, memory ordering, exceptions, ABI-visible state preserved
- [ ] Guarded fallback when target feature unavailable

### Architecture Record Template
```markdown
## Assembly Context

### Target
- Architecture: x86-64 / ARM64 / RISC-V / RDNA2 (gfx1031) / CDNA (gfx942)
- Mode: 64-bit / 32-bit / compat
- ABI: System V AMD64 / Microsoft x64 / AAPCS64 / HSA
- Object format: ELF / Mach-O / COFF / HSA code object
- Assembler: NASM / GAS / LLVM-MC / AMDGCN
- Syntax: Intel / AT&T / AMDGCN

### Register Convention
| Register | Role | Caller-saved | Callee-saved |
|----------|------|--------------|--------------|
| RAX/RDI/RSI/RDX/RCX/R8-R11 | Args/Return | ✅ | |
| RBX/RBP/R12-R15 | Preserved | | ✅ |
| XMM0-XMM15 / YMM0-YMM15 / ZMM0-ZMM31 | FP/Vector args | ✅ | |
| SGPR/VGPR (AMD) | Scalar/Vector | | See ISA |

### Stack
- Alignment: 16-byte (x86-64 System V) / 16-byte (Win64) / 16-byte (AAPCS64)
- Red zone: 128 bytes (System V) / none (Win64)
- Shadow space: 32 bytes (Win64)

### Unwind
- DWARF CFI / Windows x64 unwind codes / HSA unwind
- Frame pointer: optional (omit with `-fomit-frame-pointer`)

### Relocation Model
- PIC/PIE: required for shared libraries
- GOT/PLT: lazy vs eager binding
- TLS: local/exec, initial/exec, local/dynamic
```

### Hand-Coded Assembly Template
```asm
; platform/linux/x86_64/simd.S
; Capability: AVX2-accelerated FP32 dot product
; Fallback: portable/dot.c (scalar)
; Guard: #if defined(__x86_64__) && defined(__AVX2__)

.text
.align 32
.global dot_f32_avx2
.type dot_f32_avx2, @function

; SAFETY: Requires a, b aligned to 32B, n multiple of 8
; Input: rdi=a, rsi=b, rdx=n
; Output: xmm0 = dot product
dot_f32_avx2:
    ; Alignment check
    test dil, 31
    jnz alignment_fault
    test sil, 31
    jnz alignment_fault
    test dl, 7
    jnz alignment_fault

    vxorps ymm0, ymm0, ymm0          ; sum = 0
    xor rax, rax                     ; i = 0

.loop:
    vmovups ymm1, [rdi + rax*4]      ; load 8 floats from a
    vmovups ymm2, [rsi + rax*4]      ; load 8 floats from b
    vfmadd231ps ymm0, ymm1, ymm2     ; sum += a * b (FMA)
    add rax, 8
    cmp rax, rdx
    jl .loop

    ; Horizontal sum of ymm0
    vextractf128 xmm1, ymm0, 1
    vaddps xmm0, xmm0, xmm1
    vhaddps xmm0, xmm0, xmm0
    vhaddps xmm0, xmm0, xmm0
    vperm2f128 ymm1, ymm0, ymm0, 1
    vaddps xmm0, xmm0, xmm1
    ret

alignment_fault:
    vxorps xmm0, xmm0, xmm0
    ret

.size dot_f32_avx2, .-dot_f32_avx2
```

### Validation
```bash
# Disassembly check
objdump -d build/libportable.so | grep -A30 dot_f32_avx2

# Symbol/unwind check
readelf -u build/libportable.so

# Instruction-feature probe
./test_cpu_features --require=avx2 && ./test_dot_avx2

# Functional + bench
./test_dot --impl=avx2 --verify=reference
./bench_dot --impl=avx2 --compare=scalar
```

---

## 2. Emulation & Simulation

### Emulation Boundary Definition
| Fidelity | Use Case | Approach |
|----------|----------|----------|
| **Functional** | Logic correctness | User-mode emulator (qemu-user) |
| **Timing-approximate** | Performance modeling | User-mode + cycle estimates |
| **Cycle-accurate** | Timing-dependent logic | Full-system (qemu-system) |
| **Hardware-accurate** | Device drivers, firmware | FPGA / real hardware |

### Emulator Architecture
```c
// Core emulator loop (interpretation)
typedef struct {
    // Architectural state
    uint64_t regs[32];      // GPRs
    uint64_t pc;            // Program counter
    uint64_t fprs[32];      // FPRs
    uint32_t csr[4096];     // Control/status regs
    
    // Memory
    uint8_t* mem;           // Guest physical memory
    size_t mem_size;
    
    // Devices
    struct device* devices;
    int num_devices;
} emulator_state_t;

// Instruction decode/execute
typedef enum {
    INST_R_TYPE, INST_I_TYPE, INST_S_TYPE, INST_B_TYPE,
    INST_U_TYPE, INST_J_TYPE, INST_SYSTEM
} inst_type_t;

void emulate_instruction(emulator_state_t* state, uint32_t inst) {
    inst_type_t type = decode_type(inst);
    switch (type) {
        case INST_R_TYPE: execute_r_type(state, inst); break;
        case INST_I_TYPE: execute_i_type(state, inst); break;
        // ...
    }
    state->pc += 4;
}

// JIT compilation (for performance)
typedef void (*jit_func_t)(emulator_state_t*);
jit_func_t jit_compile_basic_block(emulator_state_t* state, uint64_t start_pc);
```

### Fidelity Targets
| Feature | Functional | Timing | Cycle-Accurate |
|---------|------------|--------|----------------|
| **Arch state** | ✅ | ✅ | ✅ |
| **Memory map** | ✅ | ✅ | ✅ |
| **Devices** | Basic | Register-level | Cycle-level |
| **Interrupts** | Polling | Immediate | Precise |
| **Timing** | Instruction count | Approximate cycles | Exact cycles |
| **Nondeterminism** | Seeded | Modeled | Exact |

### Differential Testing (Mandatory)
```bash
# Reference implementation (e.g., spike for RISC-V, qemu for x86)
./reference_emulator --trace=ref.trace --max-inst=1000000 program.bin

# Our emulator
./our_emulator --trace=our.trace --max-inst=1000000 program.bin

# Compare
python diff_traces.py ref.trace our.trace
# Must match: PC sequence, register values, memory writes, device outputs
```

### Conformance & Determinism
- **Snapshot/restore**: Save/restore full architectural state
- **Deterministic replay**: Record inputs → replay exactly
- **Fuzzing**: Generate random instruction sequences, compare with reference
- **Invalid input handling**: Undefined instructions, privilege violations, misaligned access

### JIT Considerations
```c
// Block translation cache
typedef struct {
    uint64_t guest_pc;
    void* host_code;
    size_t code_size;
    uint32_t inst_count;
} tb_entry_t;

tb_entry_t* tb_cache_lookup(uint64_t pc) { ... }
void tb_cache_insert(uint64_t pc, void* code, size_t size, uint32_t count) { ... }

// Invalidation (self-modifying code, page table changes)
void tb_cache_invalidate_range(uint64_t start, uint64_t end) { ... }
```

---

## 3. Toolchains (Reproducible Builds)

### Toolchain Lockfile
```yaml
# toolchain.lock.yaml
compiler:
  name: clang
  version: "18.1.8"
  target: aarch64-linux-gnu
  sha256: "abc123..."
linker:
  name: lld
  version: "18.1.8"
libc:
  name: glibc
  version: "2.39"
  sysroot_sha256: "def456..."
flags:
  c: "--target=aarch64-linux-gnu -fPIC -g3 -O2 -ffunction-sections -fdata-sections"
  cxx: "--target=aarch64-linux-gnu -fPIC -g3 -O2 -ffunction-sections -fdata-sections"
  ld: "-static-pie -Wl,--build-id=sha256 -Wl,--gc-sections"
environment:
  CC: clang
  CXX: clang++
  AR: llvm-ar
  RANLIB: llvm-ranlib
  STRIP: llvm-strip
```

### CMake Toolchain File (Explicit, Hermetic)
```cmake
# toolchain-aarch64.cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR aarch64)
set(CMAKE_SYSROOT /opt/sysroots/aarch64)
set(CMAKE_C_COMPILER clang)
set(CMAKE_CXX_COMPILER clang++)
set(CMAKE_ASM_COMPILER clang)
set(CMAKE_AR llvm-ar)
set(CMAKE_RANLIB llvm-ranlib)
set(CMAKE_LINKER lld)
set(CMAKE_C_FLAGS "--target=aarch64-linux-gnu -fPIC -g3" CACHE STRING "")
set(CMAKE_CXX_FLAGS "${CMAKE_C_FLAGS}" CACHE STRING "")
set(CMAKE_EXE_LINKER_FLAGS "-static-pie -Wl,--build-id=sha256" CACHE STRING "")
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)

# Feature tests MUST be target-aware
set(CMAKE_CXX_COMPILE_FEATURES cxx_std_20)
```

### Reproducibility Validation
```bash
# Build twice, compare bit-for-bit (excluding build-id)
cmake -B build1 -DCMAKE_TOOLCHAIN_FILE=toolchain-aarch64.cmake
cmake --build build1
cmake -B build2 -DCMAKE_TOOLCHAIN_FILE=toolchain-aarch64.cmake
cmake --build build2

# Strip build IDs, compare
strip --strip-all build1/app
strip --strip-all build2/app
diff <(sha256sum build1/app) <(sha256sum build2/app) && echo "REPRODUCIBLE"

# Dependency inspection
aarch64-linux-gnu-objdump -p build/app | grep NEEDED
aarch64-linux-gnu-readelf -d build/app | grep -E "(NEEDED|RUNPATH)"
```

### Cross-Compilation Validation
```bash
# 1. Clean rebuild
cmake -B build -DCMAKE_TOOLCHAIN_FILE=toolchain-aarch64.cmake
cmake --build build -Werror

# 2. Dependency inspection
aarch64-linux-gnu-objdump -p build/app | grep NEEDED

# 3. Representative execution
qemu-aarch64-static ./build/app --selftest

# 4. Remote test (if hardware available)
scp build/app target:/tmp/
ssh target /tmp/app --test-suite
```

### Accelerator Toolchains
```cmake
# CUDA
find_package(CUDAToolkit REQUIRED)
set(CMAKE_CUDA_COMPILER ${CUDAToolkit_BIN_DIR}/nvcc)
set(CMAKE_CUDA_FLAGS "-arch=sm_90 -O3 --use_fast_math")

# ROCm/HIP
find_package(ROCM REQUIRED)
set(CMAKE_HIP_COMPILER ${ROCM_PATH}/bin/hipcc)
set(CMAKE_HIP_FLAGS "--offload-arch=gfx942 -O3")

# DirectX/Agility
# Use vcpkg or manual SDK paths
set(DIRECTX_SDK_PATH "C:/Program Files (x86)/Windows Kits/10")
set(DXC_PATH "${DIRECTX_SDK_PATH}/bin/x64/dxc.exe")
```

---

## Cross-Layer Workflows

### Assembly + Toolchain
1. **Toolchain** → Define target ISA, ABI, compiler flags
2. **Assembly** → Write ISA-specific kernels with capability guards
3. **Validate** → Disassembly check, feature probe, functional test

### Emulation + Toolchain
1. **Toolchain** → Build emulator for target architecture
2. **Emulation** → Test kernels/binaries in emulator
3. **Differential** → Compare emulator vs hardware

### Assembly + Emulation
1. **Assembly** → Write kernels
2. **Emulation** → Run in cycle-accurate emulator
3. **Profile** → Identify stalls, optimize scheduling

---

## Output Report

```
LOW-LEVEL TOOLKIT: <layer> ANALYSIS
LAYER: <assembly|emulation|toolchain>
TARGET: <ISA> <ABI> <object format>
TOOLCHAIN: <compiler> <linker> <sysroot> <flags>
ASSEMBLY: <functions> hand-coded, <fallbacks> guarded
EMULATION: <fidelity> <differential test> ✅/❌
TOOLCHAIN: <reproducible> ✅/❌, <clean rebuild> ✅/❌
VALIDATION: functional ✅/❌, performance ✅/❌, reproducibility ✅/❌
BLOCKERS: <missing ISA|unstable ABI|non-determinism>
```

---

## Boundaries

- Does not write high-level code (receives kernels/binaries to validate)
- Does not manage CI/CD pipelines (provides reproducibility)
- Does not optimize algorithms (see `optimization-toolkit`)
- `stop low-level-toolkit`: revert.