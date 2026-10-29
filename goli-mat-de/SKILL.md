---
name: goli-mat-de
description: Evidence-led audit for fake, skipped, incomplete or misleading implementation and verification. Audits code, wiring, tests and claims; prioritises fixes and gates task creation on acknowledgement.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["goli-mat-de", "goli mat de", "implementation integrity audit", "fake code", "stub audit", "placeholder audit", "skipped implementation", "kaam chalau code", "thook patti code"]
---

# Goli-mat-de

Find work that is missing, superficial, disconnected or falsely reported complete. Judge behaviour against requirements and evidence, not keywords or style.

## Operating rules

- Search hits are leads, not findings. Inspect context, callers and contracts; intentional no-ops/fallbacks may be valid.
- Never invent locations, execution paths, tool output or test results. Separate FACT, HYPOTHESIS, RESULT and CONCLUSION.
- Track actual coverage. Never call sampled work exhaustive or an unrun check PASS.
- Audit only. Do not change code or external state unless separately authorised. Task creation follows the gate below.

## Scope and coverage

Infer target: repository, directory, file, function/symbol, feature, diff, test or claim. Read relevant project instructions and acceptance criteria first, including AGENTS.md, CLAUDE.md, README/CONTRIBUTING, architecture notes, build/test config and CI.

For a repository, inventory source, headers/APIs, tests, scripts, build/config, packaging, docs and generated boundaries. For functions, inspect declaration, callers/callees, state/resources, errors and tests. For diffs, inspect every changed line and affected call paths. Record branch/revision when available.

Keep a ledger: path | role | status | finding IDs. Status: NOT STARTED, INSPECTED, VALIDATED, EXCLUDED with reason. For large scopes, batch and report untouched paths, exclusions and next batch.

## Audit

For deep or repository-wide audits, read references/audit-matrix.md. For a narrow audit, check for:
- Placeholders, stubs, empty bodies, fake/default outputs, hard-coded answers and toy algorithms presented as complete.
- Uncalled/unlinked modules, unregistered backends, ignored flags/config/results, dead paths, incomplete API/platform branches and dropped async work.
- Tests that bypass behaviour, empty assertions, disabled/filtered tests, weakened checks, stale binaries, false PASS claims and invalid benchmarks.
- Swallowed errors, missing validation, resource leaks, races, unsafe inputs, portability/ABI gaps and broken cleanup/recovery.
- Performance or numerical claims without matching workload, timing boundary, baseline, target configuration and correctness evidence.
- Agent shortcuts: claims without tool evidence, plans/docs instead of implementation, invented APIs/results, one-site fixes, tests weakened to pass, silent scope changes, stopping at compile or using stale results.

Trace each material behaviour: requirement → entry/API → validation → dispatch → implementation → state/resource effect → output/error → caller → test/evidence. Include flags/fallbacks, ownership/lifetime, async completion and transfer/timing boundaries when relevant. Verify the tested revision matches the claim. A build proves buildability, not runtime correctness.

Classify each claim: CONFIRMED, SUPPORTED, SUSPECTED, NEEDS VERIFICATION, NOT A DEFECT or BLOCKED. Use only useful diagnostics: call/data flow, invariants/state model, truth table, differential test, reproduce/reduce, minimum distinguishing experiment, diff bisection, fishbone/FTA/5 Whys, Pareto, fuzz/sanitizer/race/fault injection. Never invent dynamic values or run every method without purpose.

## Findings and report

Priority: P0 critical security/data/correctness blocker; P1 core feature missing or broken; P2 material integration, edge-case, portability or verification gap; P3 low-risk cleanup/documentation. Rank by impact, likelihood, blast radius, confidence and dependencies. Deduplicate symptoms sharing a cause; keep priority separate from confidence.

Each finding: ID, priority/confidence, file:line or symbol, expected versus observed behaviour, evidence, impact/cause, concrete fix, test/acceptance criteria, dependencies/effort and validation status. Mark NOT RUN/BLOCKED honestly.

Report verdict, scope/revision, coverage, prioritised evidence-backed findings, executed versus unrun checks, missing wiring, useful specialist skills, proposed tasks and residual risks. Inspect skill headers first; read full instructions only for relevant skills. Check skill references, triggers, loading, conflicts, stale/orphaned entries and loader config. State whether each skill was only inspected or actually applied.

## Skill-catalogue maintenance

For catalogue work, inspect every skill path, header, trigger, loader entry and cross-reference; find missing coverage and duplicated scope; optimise core token cost; then validate the final inventory and diff. Use the detailed checklist in `references/audit-matrix.md`. Apply this method throughout catalogue maintenance without loading every skill for routine tasks.

## Acknowledgement gate

Present prioritised tasks with IDs, dependencies, effort, implementation steps and acceptance criteria, then ask the user to acknowledge.

**Before explicit acknowledgement, create no issues, tickets, reminders or task records.** An audit request alone is not consent. After acknowledgement, use the requested authorised task system. For GitHub Issues, require explicit approval of that destination. Avoid duplicates; report actual IDs/URLs. If unavailable, provide ready-to-copy tasks and say none were created.

This gate applies to tasks derived from findings, not separately authorised edits. A report is not a fix; completion requires honest coverage, evidence, explicit limitations and the proposed task list.
