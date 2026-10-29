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

## Skill-catalogue audit

For each skill, track path, purpose, status, overlapping skills, specialised acceptance gate, loader state, references and validation. Read front matter first; inspect full bodies when auditing detail. Compare skill names across folders, metadata, trigger keyword maps, auto-trigger/conditional-load lists, README and category catalogue. Every configured name must resolve; every shipped skill must be registered exactly once; trigger and metadata states must agree. Check relative Markdown links, stale skill names, contradictory routing rules and references to absent capabilities.

Assess quality by observable behaviour: clear trigger/scope, actionable steps, decision criteria, failure and recovery paths, relevant safety constraints, measurable acceptance criteria and honest reporting. Separate source review from executed checks. Do not add generic boilerplate just to make files longer, and do not remove detailed rules without relocating them to a clearly signposted optional reference. For token efficiency, keep the core focused on routing and the main workflow; load platform-, engine- or version-specific recipes only when needed. Keep `goli-mat-de/SKILL.md` below 750 words and enforce the limit in CI.
