---
name: python-engineering
description: "Production Python engineering: package metadata, typing, async lifetime, native extensions, tests and reproducible builds."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["Python", "packaging", "typing", "asyncio", "testing", "cffi", "meson", "uv", "ruff", "mypy", "reproducible"]
---

# Python Engineering

Use the project’s pinned interpreter and toolchain. A sample dependency version is not a promise that it is current or compatible with every Python release. Keep source, lockfile, build backend and runtime environment aligned.

## 1. Package layout and metadata

Use a src layout so tests do not accidentally import the checkout instead of the installed package.

    pyproject.toml
    src/
      mypkg/
        __init__.py
        contracts.py
        core.py
        cli/
          __init__.py
          main.py
        async_service/
          __init__.py
          server.py
        native/
          __init__.py
    tests/
      unit/
      integration/
      contract/
    benchmarks/

Do not name an importable package directory async: async is a Python keyword, and paths such as mypkg.async.server cannot be written as ordinary dotted imports. Use async_service or another valid package identifier.

A minimal PEP 621 pyproject pattern:

    [build-system]
    requires = ["setuptools>=68", "wheel"]
    build-backend = "setuptools.build_meta"

    [project]
    name = "mypkg"
    version = "0.1.0"
    description = "Example package"
    requires-python = ">=3.11"
    dependencies = ["numpy>=1.26"]

    [project.optional-dependencies]
    dev = ["pytest", "pytest-asyncio", "pytest-cov", "ruff", "mypy", "pyright"]
    native = ["cffi", "meson-python"]

    [project.scripts]
    mypkg = "mypkg.cli.main:main"

    [tool.setuptools.packages.find]
    where = ["src"]
    include = ["mypkg*"]

The versions above are illustrative minimum constraints. For a reproducible application, resolve and commit a platform-appropriate lock file; test installation from a clean environment. If using setuptools-scm, configure dynamic project versioning rather than combining an accidental static version with an unused SCM plugin.

Ruff configuration should use the current configuration schema supported by the locked tool version. Run ruff check and ruff format --check in CI, and keep formatting separate from lint-fix commands so CI does not silently rewrite source.

## 2. Public contracts and typing

- Import every type used in annotations. A module with NDArray[np.float32] needs the relevant NumPy typing import and the np name; an Awaitable annotation needs Awaitable.
- Use Protocol for structural interfaces, TypedDict for dictionary-shaped payloads and dataclasses for value objects when they match the actual contract.
- Type hints do not validate untrusted runtime input. Check shapes, dimensions, enum values, ranges, device/backend support and ownership at public boundaries.
- Use stable public types and translate internal exceptions/errors at module boundaries.
- Avoid misleading cross-framework device labels. PyTorch on ROCm commonly presents the device type as cuda even though the underlying platform is AMD; distinguish framework device strings from the actual GPU backend.
- Document mutability and ownership for NumPy views, native pointers and asynchronous results. Do not return a view whose backing buffer may be freed before the caller uses it.

A coherent typing example:

    from collections.abc import Awaitable
    from dataclasses import dataclass
    from typing import Literal, Protocol, TypedDict, runtime_checkable
    import numpy as np
    from numpy.typing import NDArray

    class TensorSpec(TypedDict):
        shape: tuple[int, ...]
        dtype: Literal["float32", "float16", "bfloat16", "int8"]
        device: str  # Runtime-specific identifier, validated by the package.

    @runtime_checkable
    class EmbeddingProvider(Protocol):
        def encode(self, texts: list[str]) -> NDArray[np.float32]: ...
        def encode_async(self, texts: list[str]) -> Awaitable[NDArray[np.float32]]: ...

    @dataclass(frozen=True, slots=True)
    class InferenceRequest:
        prompt: str
        max_tokens: int = 512
        temperature: float = 1.0
        top_p: float = 1.0
        seed: int | None = None

        def __post_init__(self) -> None:
            if self.max_tokens < 1:
                raise ValueError("max_tokens must be positive")
            if not 0.0 <= self.temperature:
                raise ValueError("temperature must be non-negative")
            if not 0.0 < self.top_p <= 1.0:
                raise ValueError("top_p must be in (0, 1]")

The interfaces are examples of type shape; production code must also implement the provider, cancellation contract, and runtime checks. An ellipsis in a Protocol is a declaration, not a fake implementation.

## 3. Async lifetime and cancellation

Keep the server or client object alive for the whole async context. Do not create a new context manager in start and a different one in stop. Do not cancel all tasks in the process indiscriminately: that can cancel unrelated service work.

A simple server lifecycle:

    import asyncio
    from collections.abc import Awaitable, Callable

    ClientHandler = Callable[
        [asyncio.StreamReader, asyncio.StreamWriter], Awaitable[None]
    ]

    async def serve(host: str, port: int, handler: ClientHandler) -> None:
        server = await asyncio.start_server(handler, host, port)
        async with server:
            await server.serve_forever()

Use this only as a lifecycle pattern. The handler still has to implement a real protocol, framing, authentication, request limits and structured errors. asyncio streams do not automatically implement HTTP or an application wire protocol.

Use bounded concurrency and timeouts at the layer where the deadline is defined. Account for queueing time as well as execution time. Cancelling a coroutine that awaits run_in_executor does not necessarily stop the worker thread; long-running synchronous work needs its own cancellation/cooperative stop contract.

    async def run_with_timeout(operation, timeout_seconds: float):
        try:
            async with asyncio.timeout(timeout_seconds):
                return await operation()
        except TimeoutError as exc:
            raise TimeoutError(
                f"operation exceeded {timeout_seconds} seconds"
            ) from exc

This example requires Python 3.11 or newer. Use platform-specific signal integration: loop.add_signal_handler is not supported on every platform, including common Windows event-loop configurations. On shutdown, stop accepting requests, drain or cancel owned tasks according to contract, wait for workers, release resources and then close the loop.

## 4. Testing

- Use deterministic fixtures for structural tests. Random unseeded input is appropriate for fuzz/property tests, not a fragile golden test.
- Test public import paths after building/installing the package, not only from the repository root.
- Include invalid shapes/types, empty inputs, cancellation, timeout, dependency failure and resource cleanup.
- Use pytest-asyncio or the framework's current supported async mode, and import asyncio in tests that call asyncio.gather.
- Ensure integration tests exercise the real boundary at least once; mocks are for isolating dependencies, not for pretending the entire integration works.
- Do not assert exact timing as a functional guarantee. Keep performance tests separate, repeat them and report variance.

Example shape test:

    import numpy as np
    from mypkg.core import process_batch

    def test_process_batch_shapes():
        source = np.ones((32, 1024), dtype=np.float32)
        output = process_batch(source)
        assert output.shape == (32, 512)
        assert output.dtype == np.float32

This test is valid only if the product contract defines that output shape; change the fixture to the actual contract rather than keeping a fabricated expected value.

## 5. Native extensions and FFI

- Pin the C/C++ compiler, Python ABI, build backend and target architecture. Wheels are platform/ABI-specific unless deliberately built as a compatible manylinux or other supported tag.
- Validate dtype, dimensions, strides, contiguity, alignment, byte size and integer overflow before crossing into native code.
- Define who owns each pointer, how long buffers stay alive, whether calls release the GIL, and how exceptions/errors return to Python.
- Do not let a C++ exception cross a C ABI. Convert errors at the boundary and keep C declarations in a C-compatible header.
- Include a scalar/reference implementation and compare extension output with explicit tolerance, including edge sizes and unsupported CPU-feature fallback.
- Test both a clean wheel build and installation in a fresh environment. An editable install can hide missing package files or extension build inputs.

Use cffi or meson-python when they fit the extension contract. Do not add Numba/CUDA as a generic acceleration path for AMD or Vulkan: the backend support is specific to the installed toolchain and must be proven on the target.

## 6. Reproducible environment and container

Use a lock-generation tool that matches the project metadata and the target platform. A lockfile records resolved dependencies; it does not prove those packages are compatible with the GPU driver or native ABI.

Example with uv, after installing and pinning an appropriate uv version:

    uv pip compile pyproject.toml -o requirements.lock
    uv pip sync requirements.lock

Build native extensions in a builder stage compatible with the runtime Python ABI, OS, libc and architecture. Do not install arbitrary CUDA development packages into a generic image and assume they match the host driver. Separate CPU and accelerator images if their dependencies differ. Run the container as a non-root user, keep credentials out of image layers, pin base images for release builds and test the final image rather than only the builder.

## Completion report

    PYTHON: VERSION / PLATFORM / PACKAGE BUILD
    CONTRACT: inputs, outputs, ownership and error semantics
    CHECKS: lint/type/build/test commands and exit codes
    ASYNC: cancellation, deadlines and shutdown tested
    NATIVE: ABI, wheel compatibility and differential checks
    REPRODUCIBILITY: lockfile, fresh install and image test
    STATUS: PASS / FAIL / BLOCKED / NOT RUN
    LIMITATIONS: explicit list

## Boundaries

- Use python-conversion for language/legacy conversion projects.
- Use python-perf for profiling, vectorisation and native acceleration.
- Use c-systems for native ABI/ownership design.
- Use test-engineering for deeper test architecture and Goli-mat-de for auditing fake or unverified implementation claims.
