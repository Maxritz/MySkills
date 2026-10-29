# Full Implementation Quality Checklist

Use this reference for high-risk, multi-module or release-gate reviews. Do not automatically apply every item to every trivial change.

## Contracts

- Document public API preconditions, postconditions, invalid-input behaviour, ownership/lifetime, concurrency and compatibility where relevant.
- For C/C++, use Doxygen or project-standard documentation for public APIs, structs and non-obvious invariants. Avoid boilerplate comments on trivial local code.
- For binary parsers, define exact field widths, endian, offsets, alignment, limits and version policy from the pinned specification.
- For a performance-sensitive function, specify workload, data layout, precision, complexity and baseline before claiming an optimisation.

## Fake or incomplete implementation

Investigate in-scope occurrences of TODO, FIXME, HACK, XXX, pass, TODO macros, unimplemented markers, constant returns, mock-only paths, disabled branches, empty handlers and placeholder outputs. A marker or token alone is not a finding: inspect callers, intent, scope and whether the path can affect the claimed behaviour.

Look for:
- Public interface exists but is not registered, called, linked or dispatched.
- Configuration is parsed but ignored downstream.
- Success status is returned despite failed work or a hard-coded result.
- Errors/exceptions are swallowed or converted to plausible but incorrect defaults.
- Fallback paths are never exercised or silently change semantics.
- Tests use only mocks when the real integration is the purpose of the test.
- Build scripts mask exit codes, skip tests, or permit required checks to fail.
- Completion claims exceed the inspected scope or executed evidence.

## Validation selection

Choose the cheapest decisive check, then expand based on risk:
- Compilation/lint/type checks for the changed target and language mode.
- Unit/contract tests for changed behaviour and boundary conditions.
- Integration test through the real public entry point.
- Differential tests against an independent reference where semantics permit.
- ASan/UBSan/TSan or platform equivalents where supported.
- Fuzzing for complex parsers and untrusted input.
- Stress/repeated trials for concurrency, cancellation and lifetime issues.
- Target-device tests for ISA/GPU/driver-dependent behaviour.
- Build/install/package/rollback checks for release changes.

Do not treat line coverage, a clean linter, or one passing test as proof of correctness. Preserve failing output and the first causal error. Re-run after the last code edit. Separate PASS, FAIL, BLOCKED, NOT RUN and UNVALIDATED.

## Rust-specific review

- Prefer Result for fallible operations and explicit error mapping at boundaries.
- Review every unsafe block against its documented safety invariant.
- Confirm pointer validity, aliasing, lifetime, pinning, thread safety and FFI ABI.
- Avoid unwrap/expect on externally triggered or recoverable production paths unless the invariant is formally guaranteed and documented.
- Validate raw slices, length arithmetic, ownership transfer and callback lifetime at FFI boundaries.
- Use Miri, sanitizers or property testing when applicable; state toolchain/version and unsupported checks.

## Component boundaries

- Keep domain logic independent of transport and infrastructure SDKs.
- Keep platform APIs behind narrow adapters and expose capabilities/unsupported status explicitly.
- Ensure registrations, build targets, manifests, feature flags, test fixtures and packaging reflect the implementation.
- Avoid duplicate authorities: routers point to the specialist skill, they do not copy the full playbook.

## Completion

The report must identify the inspected scope and its limits, the concrete changes, the exact commands/tests performed, the important results and unverified risks. Never turn an unexecuted checklist into a claim of completion.
