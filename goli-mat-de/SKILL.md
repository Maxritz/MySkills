---
name: goli-mat-de
description: Evidence-led audit for fake, skipped, incomplete or misleading implementation and verification. Audits repositories, functions, diffs, wiring, tests and performance claims. Prioritises fixes; creates tasks only after user acknowledgement.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["goli-mat-de", "goli mat de", "implementation integrity audit", "fake code", "stub audit", "placeholder audit", "skipped implementation", "kaam chalau code", "thook patti code"]
---

# Goli-mat-de

Find missing, superficial, disconnected or falsely reported work. Judge behaviour against requirements and evidence, not keywords or style.

## Rules

- Search results are leads, not findings. Inspect context, callers and the real contract; intentional no-ops and tested fallbacks may be valid.
- Never invent code locations, call paths, tool output, test results or capabilities. Separate FACT, HYPOTHESIS, RESULT and CONCLUSION.
- Track actual coverage; never call a sample exhaustive or an unrun check PASS.
- Audit only. Do not modify code or external state unless separately authorised. Task creation follows the gate below.

## Scope and coverage

Infer scope: repository, directory, file, symbol/function, feature, diff, test or claim. Read applicable AGENTS.md, CLAUDE.md, README/CONTRIBUTING, architecture notes, acceptance criteria, build/test config and CI first.

For repositories, inventory source, headers/APIs, tests, scripts, build/config, packaging, docs and generated boundaries. For functions, inspect declaration, callers/callees, state/resources, errors and tests. For diffs, inspect every changed line and the affected call path. Record revision when available.

Maintain ledger: path | role | status | finding IDs. Status = NOT STARTED, INSPECTED, VALIDATED, EXCLUDED (reason). Batch large audits; report coverage, untouched paths, exclusions and next batch.

## What to detect

Search language-appropriate patterns, then inspect the implementation and execution path.

- **Unfinished code:** TODO/FIXME/TBD/XXX/HACK/WIP, placeholder, NotImplemented, todo!/unimplemented!, empty bodies, executable ellipses, missing definitions/cases, skeleton or demo code in production.
- **Fake/shallow work:** canned/hard-coded outputs, constant success/defaults, fake metrics/progress, placeholder maths, toy algorithm presented as real, functions that only log/copy/forward, ignored config/flags/results, unconditional fallback, test answers or mocks leaking into production.
- **Missing wiring:** uncalled/unlinked modules, unregistered backend/plugin, dead branches, incomplete API/protocol/platform paths, dropped async work, unawaited futures, inactive callbacks, wrong queue/stream/buffer, ignored output, inconsistent CLI/library/service/package/deployment paths.
- **Weak proof:** empty/tautological tests, tests bypassing the feature, mock-only integration, disabled/skipped/filtered tests, weakened assertions, swallowed failures, stale/wrong binary or config, meaningless fuzzing, setup-only or invalid benchmarks, unrun checks reported as passed.
- **Reliability:** swallowed errors, ignored return values, bounds/overflow gaps, races, leaks, stale handles, cleanup/resource imbalance, partial writes, unbounded queues, missing cancellation/timeouts/retry/idempotency, invalid state and bad error propagation.
- **Security/portability/operations:** auth/permissions, trust-boundary checks, secrets, injection/deserialisation/path risks, dependency provenance, ABI, alignment/endianness, feature probes, unsupported ISA, OS/SDK/runtime differences, install/startup/shutdown and rollback.
- **Performance/numerics:** wrong workload or timing boundary, stale baseline, scalar fallback, bad instruction/layout/stride, extra copies/launches/sync, hidden transfers, misleading units, precision/tolerance faults. Record hardware, OS, compiler/flags, driver, config, workload, revision and repeated timings.
- **Agent shortcuts:** claims of reading/running/building/fixing/pushing without evidence; plans/docs/scaffolds instead of functioning code; invented APIs/paths/results; one-site-only fixes; weakened tests, suppressed warnings or loosened tolerances; silent scope changes; stopping at compile; stale evidence.

A marker or shortcut is not automatically a defect. Prove the contract is unmet, or classify the concern as unverified.

## Trace and prove

Follow each material behaviour: requirement → entry/API → validation → dispatch → implementation → state/resource effect → output/error → caller → test/evidence. Include ownership/lifetime, flags/fallbacks, async completion and transfer/timing boundaries when relevant. Verify the tested binary/revision matches the claim. A successful build proves buildability, not runtime correctness.

Status: CONFIRMED, SUPPORTED, SUSPECTED, NEEDS VERIFICATION, NOT A DEFECT, BLOCKED.

Choose only the diagnostic that settles the question: call/data-flow, state model/invariants, truth table, differential/golden test, reproduce/reduce, minimum distinguishing experiment, diff bisection, fishbone/FTA/5 Whys, Pareto, fuzz/sanitizer/race/fault injection. Do not emit every method or invent dynamic values.

## Prioritise and report

- **P0 Critical:** severe security exposure, data loss/corruption or catastrophic blocker.
- **P1 High:** core function missing/broken/misrepresented, major correctness/reliability failure.
- **P2 Medium:** material integration, edge-case, portability or verification gap.
- **P3 Low:** limited cleanup, documentation mismatch or low-risk improvement.

Rank by impact, likelihood, blast radius, confidence and dependencies. Deduplicate symptoms with a shared cause; keep priority separate from certainty.

Each finding: ID | priority/confidence | file:line or symbol | expected vs observed | evidence | impact/cause | concrete fix | test and acceptance criteria | dependency/effort | validation status. Mark NOT RUN/BLOCKED honestly; specify “done” conditions.

## Installed skills

Inspect catalogue headers first (name, description, triggers, loading, dependencies); read full instructions only for relevant skills. Check referenced skills, triggers, loader config, conflicts, redundancy and stale/orphaned entries. State if a skill was only inspected or actually applied. Report unavailable access.

Report verdict, scope/revision, coverage, ranked findings, executed versus unrun checks, missing wiring, relevant skills, task proposals and residual risks. Separate source inspection from runtime validation.

## Task acknowledgement gate

Present a prioritised task list with IDs, dependencies, effort, implementation steps and acceptance criteria. Ask the user to acknowledge it.

**Before explicit acknowledgement, create no issues, tickets, reminders or task records.** An audit request alone is not consent. After acknowledgement, use the requested authorised task system; for GitHub Issues, require explicit approval of that destination. Avoid duplicates and report actual IDs/URLs. If unavailable, provide ready-to-copy tasks and say none were created.

This gate covers tasks derived from findings, not edits separately authorised by the user. A report is not a fix; completion requires honest coverage, evidenced findings and the proposed task list.
