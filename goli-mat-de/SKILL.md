---
name: goli-mat-de
description: Evidence-driven implementation-integrity audit for repositories, files, functions, symbols, features, diffs, tests, builds, and performance claims. Finds placeholders, stubs, superficial work, disconnected code, skipped implementation, fake success, weak verification, and AI-agent shortcuts. Produces prioritised fixes and creates task tickets only after explicit user acknowledgement.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["goli-mat-de", "goli mat de", "implementation integrity audit", "fake code", "stub audit", "placeholder audit", "incomplete implementation", "skipped implementation", "kaam chalau code", "thook patti code"]
---

# Goli-mat-de

## Mission

Do not let unfinished work masquerade as complete. Audit code against requirements, contracts, actual call paths, tests, configuration, and execution evidence. The objective is implementation truth, not keyword counting or style policing.

Treat suspicious code as a lead, not proof of bad intent. Distinguish a confirmed defect from a risk, a missing test, and a behaviour that could not be verified.

## Non-negotiable rules

1. Evidence before verdict. Every actionable finding needs a real path and line, symbol, configuration key, test, command output, or traced call path. Never invent evidence.
2. A search hit is not a finding. Inspect surrounding implementation and contract before classifying TODO, mock, fallback, constant return, empty body, or other suspicious pattern.
3. Do not claim exhaustive coverage after sampling. Maintain a file-by-file ledger and clearly mark what was not inspected or executed.
4. Trace the behaviour end to end: entry point, validation, dispatch, core computation, state change, errors, result, caller, configuration, and tests.
5. Separate source facts, documented claims, assumptions, hypotheses, and executed results.
6. Never say build, test, benchmark, integration, fix, or implementation passed unless the relevant command or tool actually ran and the result supports that exact claim.
7. Do not call every shortcut a defect. A deliberate, tested fallback can be correct. Compare it with explicit requirements and expected behaviour.
8. Do not create tickets, commit changes, push, deploy, delete data, or mutate external state during the audit. Ticket creation is allowed only after the user acknowledges the specific proposed task list. Other changes require explicit authorisation.
9. Prefer correctness, completeness, security, data integrity, reliability, interoperability, and truthful performance claims over cosmetic issues.
10. Use the minimum analysis machinery sufficient to prove or falsify a claim. Escalate to deeper methods when simple tracing does not resolve it.

## Scope selection

Infer the scope when the target is explicit. For a repository audit, inspect project instructions, source, headers, tests, build files, feature flags, packaging, scripts, documentation claims, CI and relevant generated-code boundaries. For a function audit, inspect the declaration, implementation, overloads, callers, callees, contracts, state, resources, error paths and tests. For a diff, inspect every changed line and enough surrounding context to understand the impact.

Read applicable AGENTS.md, CLAUDE.md, CONTRIBUTING files, architecture notes, acceptance criteria, build/test guidance and configuration before judging completeness. Record the branch or revision when the tools expose it.

## Coverage ledger

Create an inventory and classify each file as source, header/interface, test, build/configuration, script, generated, vendored, fixture, documentation, or binary. Track each in-scope file as NOT STARTED, INSPECTED, EXECUTED/VALIDATED, or EXCLUDED WITH REASON. Do not silently exclude project-owned code.

For large codebases, process batches and preserve the ledger. If limits stop the audit, report exact coverage, untouched paths and the next batch. Never label a partial audit exhaustive.

## Search and inspect implementation avoidance

Search language-appropriate variants of the following groups. Search is discovery only; inspect each hit in context.

### 1. Explicit unfinished markers

TODO, FIXME, TBD, XXX, HACK, WIP, stub, placeholder, temporary, later, not implemented, unfinished, dummy, example only, future work, NotImplemented, NotImplementedError, todo!, unimplemented!, pass, panic!, assert(false), ellipses inside executable bodies, empty methods, missing switch cases, unimplemented virtual methods, skeletal files and declarations without required definitions.

### 2. Kaam-chalau, thook-patti, superficial or fake implementation

- Hard-coded outputs, canned responses, fixed indices, magic values, fake progress, synthetic metrics, fabricated scores or sample data used as production data.
- Functions returning constant success, zero, null, an empty collection, a default object or a plausible answer without doing the promised work.
- Branches that accept every input, skip validation, bypass the main algorithm, or return a test-specific expected answer.
- Toy or approximate algorithms silently substituted for the requested algorithm; placeholder mathematics; fallback paths selected unconditionally.
- Functions that only log, rename, copy, forward or wrap values where real computation or a required side effect is missing.
- Demo adapters, fake providers, mocks or fixtures leaking into production builds.
- Configuration knobs that parse but are ignored, values that are overwritten later, flags with no consumer, and settings that have no observable effect.
- Comments, documentation or progress reports claiming functionality that the implementation does not provide.

### 3. Missing or disconnected wiring

- Modules that compile but are never linked, registered, instantiated, dispatched, called, or exposed through the intended API.
- Backend implementations not selected by the runtime, dead feature flags, unregistered plugins, unhandled protocol messages, missing platform cases and incomplete fallback chains.
- Missing caller-to-callee flow, dead code, unreachable branches, placeholder dispatch tables and functions whose outputs are ignored.
- Async calls that are not awaited, futures/promises dropped, callbacks never registered, event subscriptions never activated, cancellation ignored, and completion returned before work finishes.
- Host/device data paths that never reach the intended queue, stream, buffer or output; transfers counted outside the timed region; stale caches; incorrect ownership or lifetime.
- CLI, library, service, bindings, packaging and deployment paths that disagree or do not exercise the same implementation.

### 4. Fake or weak tests and verification

- Empty assertions, tautological assertions, tests that never exercise the intended branch, test-only expected answers hard-coded into implementation, mocks used to claim real integration, and tests that pass when the feature is disabled.
- Disabled, skipped, quarantined, xfail, ignored or silently filtered tests; reduced coverage; weakened assertions; swallowed test exceptions; success exit codes despite failure.
- Build success presented as runtime correctness; stale executable or stale generated files; a test run against the wrong binary, configuration, device, backend or source revision.
- Fuzzers with no meaningful input variation, benchmarks measuring setup instead of the target, timing windows that exclude the work claimed, single noisy runs, invalid warm-up, missing synchronisation, or incompatible baselines.
- Claimed tests, sanitizers, benchmarks, hardware runs, golden comparisons or end-to-end tests for which no actual execution evidence exists.

### 5. Error handling and reliability gaps

- Swallowed exceptions, empty catch blocks, ignored return values, fabricated success, generic recovery that hides the first failure, partial cleanup and missing rollback.
- Missing input/range/overflow checks, malformed-input handling, timeouts, cancellation, retries, idempotency, race handling, backpressure, resource limits and failure propagation.
- Resource leaks, double free, use-after-free, stale handles, lock imbalance, unbounded queues, invalid state transitions, partial writes and non-atomic updates.
- Silent data truncation, lossy conversions, precision assumptions, schema drift, uninitialised state and incorrect error codes.

### 6. Security, portability and operational omissions

Check authentication and authorisation, validation at trust boundaries, secrets, unsafe deserialisation, path traversal, injection, permission assumptions, cryptographic misuse, dependency provenance and failure-safe defaults when relevant.

Check OS/compiler/architecture support, ABI, calling conventions, alignment, endianness, feature probes, unsupported instructions, SDK/runtime versions, packaging, install/uninstall, startup/shutdown, configuration and deployment rollback. Do not infer portability from compiling one platform.

### 7. Performance and numerical claims

Confirm what was measured, for which workload, model, input sizes, precision, hardware, driver, compiler, flags, configuration and source revision. Separate setup, model load, prefill, decode, transfers, synchronisation, host dispatch and device execution. Check that counters and units mean what the report claims.

Check scalar fallback, missed vectorisation, wrong instruction family, layout/stride errors, poor tiling, excess launches, memory traffic, synchronisation, cache behaviour, allocation and hidden copies. Verify numerical correctness against a suitable reference and explicit tolerance before accepting speedups.

### 8. AI coding-agent avoidance patterns

- Claiming to have read, run, built, benchmarked, fixed, pushed or integrated something without tool evidence.
- Writing a plan, interface, documentation or scaffold instead of the requested working implementation.
- Inventing APIs, compiler flags, file paths, device capabilities, test output or repository contents.
- Editing one occurrence while ignoring parallel implementations, callers, related tests or platform variants.
- Suppressing warnings, deleting failing tests, broadening exception handlers, loosening tolerances or disabling checks to make a run appear green.
- Solving a symptom with a hard-coded special case while leaving the general contract broken.
- Changing the requested scope without saying so, stopping after the first successful build, or reporting only positive tests while hiding skipped checks.
- Generating a large patch without tracing dependencies, reviewing the diff, checking regressions or validating the exact final revision.
- Reusing stale analysis or benchmark output after relevant source, configuration, hardware or model changes.
- Asking the user to perform investigation that available tools can perform, while implying the investigation was completed.

## End-to-end tracing protocol

For every material feature or defect, map:

REQUIREMENT → PUBLIC ENTRY → VALIDATION → DISPATCH → IMPLEMENTATION → STATE/RESOURCE EFFECT → OUTPUT/ERROR → CALLER → TEST/EVIDENCE.

For GPU, inference, storage, network and asynchronous code, include queue/stream submission, synchronisation, byte movement, ownership/lifetime, fallback selection and measurement boundaries where relevant.

Use the following evidence states:

- CONFIRMED: directly observed in source or reproduced with a reliable test.
- SUPPORTED: multiple facts support the conclusion, but one proof step is missing.
- SUSPECTED: credible indicator requiring a discriminating test.
- NEEDS VERIFICATION: behaviour cannot be established with current access.
- NOT A DEFECT: investigated and justified by the actual contract.
- BLOCKED: required source, dependency, hardware or permission is unavailable.

## Diagnostic methods

Choose the technique that resolves the uncertainty:
- Data/state model for variable, tensor, resource or cache state.
- Control/data-flow diagram for routing, skipped branches or disconnected execution.
- Logic table or truth table for combined flags, feature gates and boundary cases.
- Invariants/contracts for preconditions, postconditions, ownership, shape, range and numerical properties.
- Call graph and symbol-reference map for missing wiring and dead paths.
- Fishbone for interacting causes across code, build, environment, input and toolchain.
- Fault-tree analysis for multi-condition failures.
- Five Whys for systemic causes rooted in requirements, dependencies or configuration.
- Change analysis and diff bisection for regressions.
- Pareto ranking when many issues compete for attention.
- Differential testing, golden reference, fuzzing, sanitizers, race detection, fault injection or controlled experiments when they can settle an uncertainty.

Do not print every method by default. Explain why a method was selected and what evidence it produced. Never fabricate a truth table value, call path or measurement.

## Prioritisation

Assign each finding a unique ID and one severity:

- P0 CRITICAL: active security exposure, data corruption/loss, catastrophic correctness issue or a release blocker with immediate severe impact.
- P1 HIGH: core promised functionality is missing or misleading, primary execution is broken, severe reliability issue, or major correctness/performance claim is unsupported.
- P2 MEDIUM: substantial edge-case, integration, portability, test-coverage or maintainability gap with bounded impact.
- P3 LOW: limited-scope cleanup, documentation mismatch or low-risk improvement.

Prioritise by impact, likelihood, blast radius, user-visible effect, confidence and dependency order. Do not inflate priority to get attention. Mark urgency separately from certainty. Deduplicate findings that share one root cause and order tasks by blocking dependency.

## Finding format

For each finding provide:

- ID, title, priority, confidence and status.
- Exact file/path and line range or symbol. Link evidence when available.
- Claim/requirement versus observed behaviour.
- Why it is a real defect or risk, including the affected execution path.
- Root cause, or clearly labelled hypotheses if not proven.
- Concrete implementation change, not merely “improve” or “fix”.
- Tests and commands needed, acceptance criteria and definition of done.
- Dependencies, estimated effort/risk and expected user impact.
- Validation actually run and its result. Clearly mark NOT RUN or BLOCKED.

Group duplicate symptoms under their shared root cause, but preserve separate acceptance criteria where fixes differ.

## Installed-skill discovery

When a skill catalogue is available:
1. Enumerate installed skills and inspect their headers first: name, description, scope, trigger keywords, loading rules and declared dependencies.
2. Map the current task to relevant skills and state briefly why each applies.
3. Read the complete instructions for selected skills, not every unrelated skill body.
4. Check the referenced skills actually exist and that their interfaces, names and triggers agree.
5. Identify redundant, contradictory, stale, orphaned or unreachable skills and recommend a precise change.
6. Do not claim a skill was loaded or executed when only its header was read. If catalogue access is unavailable, report that limitation.

## Final audit report

Lead with a one-line verdict and summary counts. Then provide:
1. Scope, repository/revision and coverage ledger summary.
2. Ranked findings with evidence.
3. False-completion and implementation-integrity risks.
4. Testing/build/performance claims verified versus unverified.
5. Missing capabilities and integration gaps.
6. Recommended relevant skills/methods and why.
7. A prioritised remediation checklist in dependency order.
8. Exclusions, blockers, assumptions and residual risk.

Do not use a green status without evidence. Distinguish “source inspection completed” from “runtime validation completed”.

## Acknowledgement and task-creation gate

After the audit, show the proposed task list with IDs, priorities, scopes, dependencies, effort, concrete actions and definitions of done. Ask the user to acknowledge that list.

Before explicit acknowledgement, do not create issues, tickets, tasks, reminders or other task records. An instruction to perform an audit is not by itself acknowledgement of the resulting task list. Do not treat silence or an ambiguous response as consent.

After explicit acknowledgement:
1. Use the user's specified task system when available and authorised.
2. If auditing a GitHub repository and no other destination is specified, ask or use GitHub Issues only when the user has explicitly approved task creation there.
3. Create tasks in priority/dependency order. Each task must include evidence, implementation steps and acceptance criteria.
4. Link related tasks and avoid duplicate tickets.
5. Report the actual created IDs and URLs. If task integration is unavailable, provide ready-to-copy tasks and state that no external tasks were created.

This acknowledgement gate does not prohibit edits or commits that the user separately and explicitly requested. It specifically governs creation of task records based on audit findings.

## Completion criteria

An audit is complete only when the coverage report reflects the actual inspected scope, each reported finding has traceable evidence, uncertainties and exclusions are explicit, findings are ranked and deduplicated, recommended validation is actionable, and the task list has been presented for acknowledgement. Never equate a completed report with repaired code.
