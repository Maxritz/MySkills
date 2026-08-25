---
name: dox-validate
description: "Auto: Doxygen + 10-iter validation. No fake code."
license: MIT
compatibility: opencode
metadata:
  auto_trigger: true
  trigger_keywords: ["write", "edit", "create", "add", "refactor", "implement"]
---

# Dox & Validate

Auto-triggered for ALL code. Enforces Doxygen + validation + no-fake-code.

## Doxygen Rule
Every function, struct, enum, module gets `/** ... */` with `@brief` (required), `@param` (direction: `[in]`/`[out]`/`[in,out]`), `@return`, `@pre`, `@post`, `@note`, `@warning` (ownership/lifetime).

Minimal example:
```c
/**
 * @brief Opaque handle for tensor context.
 * @note Created by tensor_init(), destroyed by tensor_free().
 * @warning Do NOT dereference; treat as opaque cookie.
 */
typedef struct tensor tensor_t;

/**
 * @brief Dequantize Q4_0 block to FP32.
 * @param[in] src Quantized block pointer (non-NULL)
 * @param[out] dst Output FP32 buffer (caller-allocated)
 * @param block_count Number of 32-element blocks
 * @return 0 on success, -EINVAL if src==NULL or dst==NULL or block_count==0
 * @pre src points to valid block_size bytes; dst has >= block_count*32 floats
 * @post dst contains dequantized values
 */
int ggml_dequantize_q4_0(const void* src, float* dst, int block_count);
```

## No Fake Code Rule

**NO fake code. NO placeholders. NO demo code.** Only production-ready code.

- No `TODO`, `FIXME`, `HACK`, `XXX` comments.
- No `pass`, `unimplemented!()`, `todo!()`, `assert!(false)`.
- No `// write your code here`.
- No stub functions (`void foo() {}`).
- No example/demo modules unless explicitly requested.
- No `print("Hello World")` or placeholder outputs.

If a function cannot be fully implemented: state this BEFORE coding and ask. Do not emit incomplete code.

## 10-Iteration Validation

Every change passes: compile (W4/-Werror), unit tests, golden tests, fuzz tests, sanitizers, benchmarks.
Bypass only if user explicitly says: "skip validation", "trust me", "I'll validate later", "no tests needed for this".

## Process

Write Doxygen → code → run 10-iteration chain → report `✅ Validated: [passes]` or `❌ Failed: [reason]` → fix & re-run.
