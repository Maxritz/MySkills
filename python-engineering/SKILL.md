---
name: python-engineering
description: "Production Python engineering: packaging, typing, async, native extensions, testing, reproducible environments. Modern tooling (ruff, mypy, uv, meson)."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["Python", "packaging", "typing", "asyncio", "testing", "cffi", "meson", "uv", "ruff", "mypy", "reproducible"]
---
# Python Engineering

Use this skill for production Python packaging, API contracts, typing, tests, async lifecycles and reproducible environments. Keep the core small; load [engineering recipes](references/engineering-recipes.md) for command/configuration examples.

## Workflow

1. **Package:** use an importable package layout, explicit runtime/development dependencies, entry points and tested build/install metadata.
2. **Contracts:** type public APIs; define input validation, error classes, side effects, ownership of mutable state and compatibility.
3. **Quality:** lint, format, static-type-check and run unit/contract tests in a clean environment. Verify packaged installation, not just imports from the working tree.
4. **Async:** define task ownership, timeout, cancellation, backpressure and graceful shutdown. Use structured cleanup and propagate failures; never swallow cancellation without a deliberate policy.
5. **Reproducibility:** pin/lock dependencies and record Python, OS, compiler/native build tools and environment settings. A lock file alone does not prove a clean install is reproducible.
6. **Deployment:** separate configuration and secrets from the artefact; test startup, health, shutdown and required native/runtime dependencies on the target.

## Acceptance

- Build/package/install succeeds in a clean environment.
- Public contracts and failure modes have tests.
- Async cancellation and cleanup are exercised where applicable.
- Tool versions and source revision are recorded.
- Unrun platform or dependency tests remain explicitly unverified.

## Output Report

```
PYTHON ENGINEERING: ANALYSIS
PACKAGE: <name> <version>
TYPING: mypy/pyright clean ✅/❌
LINT: ruff clean ✅/❌
TESTS: unit✅/❌ integration✅/❌ contract✅/❌
ENV: reproducible ✅/❌
BLOCKERS: <missing deps|native build|conversion gap>
```

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Validate from a clean, reproducible environment and include packaging/install/import tests, public API contracts and async cancellation/cleanup. Do not call an environment reproducible merely because a lock file exists.


## Boundaries

- Does not write kernel code (see `nvidia-cuda-stack`/`amd-gpu-stack`)
- Does not serve models (see `llm-serving`)
- Does not validate model formats (see `model-formats`)
- Does not optimise numerical kernels (see `python-perf`)
- Does not convert to native targets (see `python-conversion`)
- `stop python-engineering`: revert.