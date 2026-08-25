---
name: plugin-adapter
description: "Universal plugin pattern. 4-step template."
license: MIT
compatibility: opencode
metadata:
  trigger_keywords: ["backend", "adapter", "vulkan", "cuda", "rocm", "openvino", "gpu", "plugin", "shader", "quant"]
---

# Plugin / Adapter Pattern (Universal)

Applies to ALL programs: LLM engines, renderers, storage, network, codecs.

## 4-Step Template

### 1. Define Interface
```c
/**
 * @brief Plugin interface. TRACE: [P-001] lifecycle, [P-002] alloc/free,
 *        [P-003] execute, [P-004] sync.
 */
typedef struct plugin_ops {
    const char* type_name;
    int  (*init)(void* config);        /* [P-001] */
    void (*deinit)(void);              /* [P-001] */
    void* (*alloc)(size_t bytes);      /* [P-002] */
    void  (*free)(void* ptr);          /* [P-002] */
    int   (*copy_h2p)(void* d, const void* s, size_t n);  /* [P-002] */
    int   (*copy_p2h)(void* d, const void* s, size_t n);  /* [P-002] */
    int (*execute)(const struct cmd* cmd, void* userdata); /* [P-003] */
    int (*sync)(void);                 /* [P-004] */
} plugin_ops_t;
```

### 2. Implement (`plugins/<name>/plugin.c`)
@see debug-core for DBG_TRACE/DBG_ASSERT. Use [P-XXX] markers.
```c
static int myplugin_init(void* config) {
    DBG_TRACE("[P-001] init");
    return 0;}
static void* myplugin_alloc(size_t n) {
    DBG_TRACE("[P-002] alloc %zu", n); return /* your alloc */;
}
static int myplugin_execute(const struct cmd* cmd, void* ud) {
    DBG_TRACE("[P-003] execute cmd=%d", cmd->type);
    return myplugin_sync();
}
static int myplugin_sync(void) { DBG_TRACE("[P-004] sync"); return 0; }

plugin_ops_t* myplugin_get_ops(void) {
    static plugin_ops_t ops = {
        .type_name="myplugin", .init=myplugin_init, .deinit=myplugin_deinit,
        .alloc=myplugin_alloc, .free=myplugin_free,
        .copy_h2p=myplugin_copy_h2p, .copy_p2h=myplugin_copy_p2h,
        .execute=myplugin_execute, .sync=myplugin_sync,
    };
    return &ops;
}
```

### 3. Register (`plugin_registry.c`)
```c
extern plugin_ops_t* myplugin_get_ops(void);
plugin_ops_t* plugin_select(const char* name) {
    DBG_TRACE("[P-001] select: %s", name);
    if (strcmp(name,"myplugin")==0) return myplugin_get_ops();
    return NULL;
}
```

### 4. Integrate
```c
plugin_ops_t* pl = plugin_select("myplugin");
pl->init(config);
struct cmd cmd = { .type = OP_PROCESS, .data = input };
pl->execute(&cmd, userdata);
pl->sync();
pl->deinit();
```

## Domain Variants
- **Compute backend**: `backend_ops`, `matmul/attention` — cuda, vulkan, rocm, cpu
- **Shader backend**: `shader_ops`, `compile/link` — glsl, hlsl, wgsl, msl
- **Quantization**: `quant_ops`, `quantize/dequantize` — q4_0, q5_0, q8_0, f16
- **Renderer**: `renderer_ops`, `draw/draw_indexed` — opengl, dx12, metal
- **Storage**: `storage_ops`, `read/write` — file, s3, sqlite
- **Network**: `net_ops`, `send/recv` — tcp, udp, rdma

## Validation
- [ ] All 4 TRACE IDs in `@brief`
- [ ] `init()`/`deinit()` balanced
- [ ] `alloc()`/`free()` paired
- [ ] `execute()` validates inputs
- [ ] `sync()` before cross-plugin reads
- [ ] type_name registered
