---
name: goli-mat-de
description: Evidence-led audit for fake, skipped, incomplete or misleading implementation and verification. Audits repositories, files, functions, diffs, tests, wiring and performance claims. Produces prioritised fixes; creates tasks only after user acknowledgement.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["goli-mat-de", "goli mat de", "implementation integrity audit", "fake code", "stub audit", "placeholder audit", "skipped implementation", "kaam chalau code", "thook patti code"]
---

# Goli-mat-de

**Goal:** Find work that is missing, superficial, disconnected, falsely reported complete, or inadequately verified. Judge behaviour against requirements and evidence, not coding style or keywords alone.

## Rules

- Evidence first. A search hit is a lead, not proof. Inspect context and the real contract; intentional no-ops and tested fallbacks may be valid.
- Never invent source locations, call paths, tool output, test results, benchmarks or capabilities.
- Separate FACT, HYPOTHESIS, RESULT and CONCLUSION. Mark unverified work honestly.
- Do not claim exhaustive coverage after sampling. Track inspected, validated, excluded and untouched scope.
- Audit only. Do not mutate code, create tasks, commit, push, deploy or delete data unless separately authorised. Task creation has the acknowledgement gate below.

## Scope and coverage

Infer scope from the request: repository, directory, file, function/symbol, feature, diff, test or claim. Read applicable project instructions and acceptance criteria first: AGENTS.md, CLAUDE.md, README/CONTRIBUTING, architecture notes, build/test config and CI.

For a repository, inventory source, headers/APIs, tests, scripts, build/config, packaging, docs and generated boundaries. For a function, trace declaration, callers, callees, state/resources, errors and tests. For a diff, inspect every changed line plus the surrounding call path. Record branch/revision when available.

Maintain a compact ledger: path | role | status | finding IDs. Status: NOT STARTED, INSPECTED, VALIDATED, EXCLUDED (reason). Batch large repos and state exact coverage, gaps and next batch. Never label partial work exhaustive.

## Audit surfaces

Search appropriate language-specific patterns, then inspect implementation and call paths:

- **Stubs/markers:** TODO, FIXME, TBD, XXX, HACK, WIP, placeholder, NotImplemented, todo!, unimplemented!, empty bodies, dummy/demo code, unfinished switch/match cases, missing definitions or executable ellipses.
- **Fake or shallow work:** canned/hard-coded outputs, constant success/default returns, magic values, fake progress/metrics, placeholder maths, toy algorithms presented as production, functions that only log/copy/forward, unconditional fallbacks, test answers in production, mocks/fixtures leaking into production.
- **Missing wiring:** uncalled/unlinked modules, unregistered backends/plugins, ignored config/flags/results, dead branches, incomplete protocol/API/platform paths, dropped async work, unawaited futures, inactive callbacks, incorrect queue/stream/buffer paths, inconsistent CLI/library/service/package/deployment paths.
- **Weak verification:** empty/tautological assertions, tests bypassing the feature, mock-only “integration”, disabled/skipped/filtered tests, weakened assertions, swallowed test failures, stale binaries, wrong build/config/device, useless fuzzing, setup-only benchmarks, invalid timing, unrun checks reported as passed.
- **Reliability:** swallowed errors, ignored return values, missing validation/bounds/overflow handling, races, cleanup gaps, leaks, stale handles, partial writes, unbounded queues, missing cancellation/timeouts/retry/idempotency and incorrect error propagation.
- **Security/portability/operations:** trust-boundary validation, auth/permissions, secrets, injection/deserialisation/path risks, dependency provenance, ABI/calling convention, alignment/endianness, feature probes, unsupported ISA, SDK/runtime version, install/startup/shutdown and rollback.
- **Performance/numerics:** wrong workload or timing boundary, stale baseline, scalar fallback, instruction/layout/stride issues, extra copies/launches/sync, hidden transfers, misleading units, precision/tolerance errors. Check hardware, OS, compiler/flags, driver, workload, configuration, revision and repeated results.
- **Agent shortcuts:** claiming read/run/build/fix/push without evidence; delivering plans/docs/scaffolds instead of working code; invented APIs/paths/output; fixing one occurrence only; suppressing warnings or tests; loosening tolerances; changing scope silently; stopping at compile; validating a stale revision.

Markers are not automatically defects. A deliberate simplification is acceptable when it satisfies the contract, is disclosed where relevant, and has suitable tests.

## Trace the real behaviour

For each material feature or finding, follow:

requirement → entry/API → validation → dispatch → implementation → state/resource effect → output/error → caller → test/evidence

Include feature flags, fallback selection, ownership/lifetime, async completion, GPU/network/storage transfers and measurement boundaries when relevant. Confirm that configuration affects the running path and that the tested binary/revision is the one being claimed.

Evidence status: CONFIRMED, SUPPORTED, SUSPECTED, NEEDS VERIFICATION, NOT A DEFECT, or BLOCKED. A build proves buildability, not runtime correctness.

## Use only useful diagnostics

Choose a method to answer a specific uncertainty: call/data-flow for missing wiring; state model or invariants for corrupt state/contracts; truth table for interacting flags; differential/golden test for correctness; reproduce/reduce for a stable case; minimum distinguishing experiment for competing hypotheses; diff bisection for regressions; fishbone/FTA/5 Whys for multi-cause/systemic issues; sanitizers/fuzz/race/fault-injection for relevant risks; Pareto for many findings. Do not emit every method or fabricate dynamic branch values.

## Rank findings

- **P0 Critical:** severe security exposure, data loss/corruption or catastrophic correctness/release blocker.
- **P1 High:** core promised feature missing/broken/misrepresented; major correctness or reliability failure.
- **P2 Medium:** material integration, edge-case, portability or verification gap with bounded impact.
- **P3 Low:** limited cleanup, documentation mismatch or low-risk improvement.

Rank by impact, likelihood, blast radius, confidence and dependency. Deduplicate symptoms sharing a root cause. Keep severity separate from confidence.

Each finding: ID | priority | confidence | file:line/symbol | expected vs observed | evidence | impact/root cause | concrete fix | test/acceptance criteria | dependency/effort | validation status. Mark commands NOT RUN or BLOCKED. Give a definition of done, not a vague “improve”.

## Installed skills

If a skill catalogue exists, inspect headers first: name, description, triggers, loading and dependencies. Read full instructions only for relevant skills. Check references, triggers, redundancy, conflicts, stale/orphaned skills and loader configuration. State whether each skill was only inspected or actually applied. Report unavailable catalogue access.

## Report

Start with verdict, scope/revision, coverage counts and key risks. Then give deduplicated prioritised findings, actual versus unrun verification, missing wiring/capabilities, recommended specialist skills/methods, task proposals, blockers and residual uncertainty. Separate source inspection from executed validation.

## Acknowledgement gate for tasks

After reporting, present a concrete prioritised task list with IDs, scope, dependencies, effort, implementation steps and acceptance criteria. Ask the user to acknowledge it.

**Before explicit acknowledgement, create no issues, tickets, reminders or task records.** An audit request is not consent to create tasks. After acknowledgement, use the requested authorised task system. For GitHub work, create Issues only when explicitly approved for that destination. Avoid duplicates and report actual IDs/URLs. If unavailable, provide ready-to-copy tasks and say none were created.

This gate applies to task records from findings, not edits the user separately authorised. An audit is complete only when coverage and exclusions are honest, findings are evidenced and prioritised, and the task list is presented. A complete report does not mean the code has been fixed.
