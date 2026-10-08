---
name: python-engineering
description: "Production Python engineering: packaging, typing, async, native extensions, testing, reproducible environments. Modern tooling (ruff, mypy, uv, meson)."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  trigger_keywords: ["Python", "packaging", "typing", "asyncio", "testing", "cffi", "meson", "uv", "ruff", "mypy", "reproducible"]
---

# Python Engineering

**Production-grade Python: packaging, typing, async, native extensions, testing, reproducible environments.**

---

## Package Layout (src-layout)

```
pyproject.toml
README.md
src/
  mypkg/
    __init__.py
    _version.py          # setuptools-scm or manual
    contracts.py         # Public interfaces (TypedDict, Protocol)
    core.py              # Pure Python logic
    native/              # C/C++/Rust extensions (if any)
      __init__.py
      _native.c
      _native.h
      pyproject.toml     # meson.build or setup.py for extension
    async/               # Async services
      __init__.py
      server.py
      client.py
    sync/                # Sync wrappers
      __init__.py
    cli/                 # CLI entry points
      __init__.py
      main.py
tests/
  unit/
  integration/
  contract/              # Differential tests for conversions
benchmarks/
```

## pyproject.toml (Modern)

```toml
[build-system]
requires = ["setuptools>=68", "wheel", "setuptools-scm[toml]>=8"]
build-backend = "setuptools.build_meta"

[project]
name = "mypkg"
version = "0.1.0"
description = "Production Python package"
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
    "numpy>=1.26",
    "pydantic>=2.0",
    "click>=8.0",
]
optional-dependencies = {
    "dev" = ["pytest", "pytest-asyncio", "pytest-cov", "ruff", "mypy", "pyright"],
    "perf" = ["numba", "line-profiler", "memory-profiler"],
    "native" = ["cffi", "meson-python"],
}

[project.entry-points]
console_scripts = ["mypkg = mypkg.cli.main:main"]

[tool.setuptools.packages.find]
where = ["src"]
include = ["mypkg*"]

[tool.ruff]
line-length = 100
target-version = "py311"
select = ["E", "F", "I", "UP", "B", "C4", "PTH", "T20", "SIM", "ARG"]
ignore = ["S101"]

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_ignores = true
disallow_untyped_defs = true
check_untyped_defs = true
```

## Contracts (Public Interfaces)

```python
# contracts.py
from typing import Protocol, TypedDict, Literal, runtime_checkable
from dataclasses import dataclass
from numpy.typing import NDArray

class TensorSpec(TypedDict):
    shape: tuple[int, ...]
    dtype: Literal["float32", "float16", "bfloat16", "int8", "int4"]
    device: Literal["cpu", "cuda", "hip"]

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

@dataclass(frozen=True, slots=True)
class InferenceResponse:
    text: str
    token_ids: list[int]
    logprobs: list[float] | None
    usage: dict[str, int]  # prompt, completion, total
```

## Type Checking & Linting

```bash
# Type check
mypy src/
pyright src/

# Lint
ruff check src/ tests/
ruff format src/ tests/

# Pre-commit (install: pre-commit install)
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.5.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
```

## Testing

```python
# tests/unit/test_core.py
import pytest
from mypkg.core import process_batch
from mypkg.contracts import TensorSpec
import numpy as np

def test_process_batch_shapes():
    input_spec = TensorSpec(shape=(32, 1024), dtype="float32", device="cpu")
    output = process_batch(np.random.randn(*input_spec["shape"]).astype(np.float32))
    assert output.shape == (32, 512)
    assert output.dtype == np.float32

# tests/integration/test_async.py
@pytest.mark.asyncio
async def test_server_throughput():
    from mypkg.async_.server import InferenceServer
    server = InferenceServer()
    await server.start()
    
    async def request():
        return await server.generate("Hello", max_tokens=100)
    
    results = await asyncio.gather(*[request() for _ in range(100)])
    assert all(r.text for r in results)
    
    await server.stop()
```

## Async Engineering

```python
# async/server.py
import asyncio
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import AsyncIterator

@dataclass(slots=True)
class ServerConfig:
    host: str = "0.0.0.0"
    port: int = 8000
    max_concurrent: int = 100
    request_timeout: float = 30.0

class InferenceServer:
    def __init__(self, config: ServerConfig):
        self.config = config
        self._semaphore = asyncio.Semaphore(config.max_concurrent)
        self._server: asyncio.Server | None = None
    
    @asynccontextmanager
    async def lifespan(self) -> AsyncIterator[None]:
        self._server = await asyncio.start_server(
            self._handle_client, self.config.host, self.config.port
        )
        try:
            yield
        finally:
            self._server.close()
            await self._server.wait_closed()
    
    async def start(self) -> None:
        await self.lifespan().__aenter__()
    
    async def stop(self) -> None:
        await self.lifespan().__aexit__(None, None, None)
    
    async def _handle_client(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        async with self._semaphore:
            try:
                data = await asyncio.wait_for(reader.read(65536), timeout=self.config.request_timeout)
                request = parse_request(data)
                
                loop = asyncio.get_running_loop()
                response = await loop.run_in_executor(None, self._generate_sync, request)
                
                writer.write(serialize_response(response))
                await writer.drain()
            except asyncio.TimeoutError:
                writer.write(b"ERROR: timeout")
            finally:
                writer.close()
                await writer.wait_closed()
    
    def _generate_sync(self, request) -> InferenceResponse:
        pass
```

## Cancellation & Cleanup

```python
async def with_timeout(coro, timeout: float):
    try:
        return await asyncio.wait_for(coro, timeout)
    except asyncio.TimeoutError:
        raise TimeoutError(f"Operation timed out after {timeout}s")

# Graceful shutdown
async def shutdown(signal, loop):
    tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
    for task in tasks:
        task.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)
    loop.stop()

loop = asyncio.get_event_loop()
for sig in (signal.SIGTERM, signal.SIGINT):
    loop.add_signal_handler(sig, lambda s=sig: asyncio.create_task(shutdown(s, loop)))
```

## Reproducible Environments

```bash
# uv (fast, reliable)
uv pip compile pyproject.toml -o requirements.lock
uv pip sync requirements.lock

# Or pip-tools
pip-compile pyproject.toml -o requirements.lock
pip-sync requirements.lock
```

## Docker (Reproducible Build)

```dockerfile
# syntax = docker/dockerfile:1.7
FROM python:3.11-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake ninja-build pkg-config \
    libcuda-dev libcurand-dev libcusolver-dev
WORKDIR /build
COPY pyproject.toml requirements.lock ./
RUN pip install --no-cache-dir -r requirements.lock
COPY . .
RUN pip install --no-cache-dir --no-deps .

FROM python:3.11-slim AS runtime
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /build/mypkg /app/mypkg
WORKDIR /app
ENTRYPOINT ["python", "-m", "mypkg.cli.main"]
```

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

## Boundaries

- Does not write kernel code (see `nvidia-cuda-stack`/`amd-gpu-stack`)
- Does not serve models (see `llm-serving`)
- Does not validate model formats (see `model-formats`)
- Does not optimise numerical kernels (see `python-perf`)
- Does not convert to native targets (see `python-conversion`)
- `stop python-engineering`: revert.