# Goli-mat-de optional audit matrix

Read this file for repository-wide or deep audits. For a narrow function/diff check, load only the relevant categories.

## Implementation shortcuts
Search markers and patterns appropriate to each language: TODO/FIXME/TBD/XXX/HACK/WIP, placeholder, NotImplemented, todo!, unimplemented!, executable ellipses, empty methods, missing definitions/cases and skeletal/demo code in production. Then inspect semantics, contract and callers. Flag canned or hard-coded results, constant success/default returns, fake progress/metrics, placeholder maths, silent toy approximations, functions that only log/copy/forward, test answers in production, mock leakage and unconditional fallback. Check whether parsed configuration/flags are actually consumed and affect the running path.

## Wiring and control flow
Check module linking/registration/instantiation/dispatch, call sites, dead/unreachable branches, ignored outputs, incomplete API/protocol/platform cases, backend selection, callback/event registration, future/promise awaiting, async cancellation/completion, and agreement across CLI, library, server, bindings, packaging and deployment. For GPU/storage/network code, trace queues/streams/buffers, bytes moved, synchronisation, ownership and timing boundaries.

## Tests and claims
Find empty/tautological assertions, tests that never enter the target path, mock-only integration, disabled/skipped/xfail/filtered tests, swallowed test failures, weakened assertions/tolerances, stale generated files/binaries, wrong source revision/config/device and checks falsely reported as passed. For fuzzing inspect input variation and failure detection. For benchmarks inspect warm-up, repeated runs, synchronisation, setup exclusion/inclusion, units, variance, baselines and whether measurements cover the claimed work.

## Reliability, security and portability
Inspect error propagation, ignored return codes, bounds/overflow/input validation, uninitialised state, data truncation, precision/schema drift, resource lifetime/cleanup, double-free/use-after-free, locking/races, unbounded queues, timeouts/cancellation/retry/idempotency, atomic updates and recovery. Where relevant check authentication/authorisation, secret handling, injection/deserialisation/path traversal, trust boundaries, dependencies/provenance and failure-safe defaults. Check OS/compiler/architecture, ABI/calling convention, alignment/endianness, ISA probes, SDK/runtime assumptions, install/start/stop and rollback. A single-platform build does not prove portability.

## Performance and numerical validity
Record hardware, OS, compiler/flags, driver/runtime, model/input, shapes, dtype/precision, configuration, source revision, warm-up, synchronisation, timing boundaries and repeated measurements. Separate load/setup, prefill/decode, host dispatch, device execution, transfers and end-to-end latency where relevant. Check scalar fallback, instruction selection, vectorisation, layout/stride, tiling, memory traffic, copies, launches, sync, cache behaviour, allocation and instrumentation overhead. Compare outputs with a trustworthy reference and explicit justified tolerances; do not infer speed or correctness from source inspection alone.

## AI-agent failure modes
Check for claims of reading/running/building/benchmarking/fixing/pushing without tool evidence; scaffolds or documentation substituted for implementation; invented APIs, paths, capabilities or outputs; partial fixes that ignore parallel call sites/platforms; warnings/tests disabled to make green results; special cases that mask general defects; silent scope changes; early stopping after compile; and stale analysis/results reused after relevant code/config/hardware/model changes.

## Evidence rule
A suspicious pattern is not proof by itself. For each candidate, tie the source to its requirement and live path; test or instrument when needed. Distinguish defect, risk, missing test, deliberate limitation and unverified behaviour.


## Repository and skill-catalogue integrity

For a skills repository, audit the control plane as well as each skill's prose.

- Inventory every skill directory, canonical SKILL.md, optional references, local scripts, tests, fixtures and workflow. Record the exact files inspected.
- Validate YAML front matter, unique name/folder agreement, supported metadata, trigger keywords, line/word budgets and allowed loader settings.
- Compare the actual directory set with README/catalogue/category maps, loader lists, keyword maps, automation rules and CI discovery. Check duplicate entries and stale names in both directions.
- Verify automatic/conditional loading is mutually exclusive, declared per-skill trigger metadata matches loader configuration, and shared instructions exist and are loaded at the intended scope.
- Resolve every internal skill/path/reference link against the actual tree. Do not mistake a keyword in prose or a code identifier for a real skill; inspect the context.
- Keep one authoritative deep guide per topic. Routers should point to specialists, not maintain slightly different copies of their procedures.
- Make CI fail on configuration drift, stale catalogue entries and broken required references. Confirm the workflow's exit code propagates; a workflow file existing in the repository is not evidence that it ran.

## Scripts, generated artefacts and examples

- Inspect build/test scripts for swallowed exit codes, unbounded retries, skipped checks, incorrect working directories, stale build caches and commands that differ from their documentation.
- Check that fixture data, sample IDs, timestamps, paths and benchmark values are explicitly illustrative when they were not observed. Sample output must not look like a real measurement or completed run without a clear label.
- Verify code fragments state language, compiler, platform, ABI and required feature assumptions when those details affect correctness.
- Do not call a fragment a working implementation if key callbacks, lifetimes, build rules, dispatch, error paths or external dependencies are undefined.
- For format/driver/runtime claims, require a pinned specification or versioned source. An example copied from one release may not compile or preserve semantics on another.

## Evidence coverage ledger

For broad audits, create one row per inspected unit and track at least:
unit | expected contract | call/wiring path | failure/cleanup | verification | status | evidence.

Allowed statuses: PASS, FAIL, BLOCKED, NOT RUN, UNVALIDATED. Record the actual command or observation for a claim of execution. Keep a separate list of uninspected files and inaccessible platform-only checks. Do not label a repository-wide audit exhaustive if the ledger has gaps.

For every finding, capture:
- Unique ID and severity.
- Exact file/symbol/line or configuration path.
- Requirement/invariant and why the current behaviour violates it or lacks sufficient evidence.
- Reproduction or supporting observation; mark a hypothesis when it is not reproduced.
- Expected behaviour, minimal corrective action and regression test.
- Scope of any fix and remaining uncertainty.

## Priority and stop criteria

- **P0:** confirmed critical data loss, security compromise, destructive corruption or catastrophic failure that is reachable. Stop unrelated work and establish containment.
- **P1:** high-impact correctness, security, startup/build failure or major functionality gap on a supported path. Fix before release.
- **P2:** material reliability, portability, performance or missing-regression issue with a defined path and impact. Schedule by risk and frequency.
- **P3:** local polish, redundancy, low-risk documentation, or improvements with limited impact.
- Do not promote suspicion alone to P0/P1. Confidence and reachability are separate from severity.
- Retest the actual changed path after the last edit. If a platform or credential is missing, state the precise blocked gate rather than widening a successful check into a blanket claim.
- Do not create issues, tasks or remote state changes from a proposed finding list until the user has acknowledged the list and authorised where tasks should be created.

## Audit completion gate

An audit is ready to report when scope and uninspected areas are explicit; high-severity findings have evidence and corrective actions; tests are separated into executed, failed, blocked and not run; cross-references and loader/catalogue consistency are checked; and the summary does not exceed what the evidence establishes.
