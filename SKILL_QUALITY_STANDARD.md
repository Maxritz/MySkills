# Skill Quality Standard

Apply Goli-mat-de principles as a constant for code, architecture, repository, model-format, deployment and performance work. Load the smallest specialist skill that resolves the current question; use detailed references only when needed.

## Integrity loop

1. Trace the requested behaviour from requirement and entry point through configuration, call chain, implementation, error and cleanup paths, tests and observable result.
2. Treat TODOs, stubs, placeholders, hard-coded returns, disabled branches and success-shaped fallbacks as leads, not verdicts. Inspect context and callers before classifying them.
3. State the contract before changing implementation. Preserve unrelated behaviour and document assumptions that cannot be verified.
4. Run the cheapest decisive check first, then relevant regression, integration, differential, sanitizer, race or target-hardware checks. Never claim a check ran unless it did.
5. Label evidence honestly: PASS, FAIL, BLOCKED, NOT RUN or UNVALIDATED. Include the command, relevant output and environment when they affect the claim.
6. For performance claims, compare the same workload and configuration against a baseline, separate setup from steady-state work, report repeated measurements and spread, and check correctness before speed.
7. For changing APIs, formats, compiler flags or hardware features, verify the exact version and target. Prefer primary specifications and upstream source over memory or copied examples.

## Scope and context

- Audit the requested scope and dependencies, not every unrelated file. State what was inspected and what remains uninspected.
- Keep one authoritative skill for each deep topic. Router and alias skills should select that source rather than copy it.
- Do not invent files, execution, benchmark results, current support or test coverage.
- Do not create issues, tasks or external state changes from an audit proposal until the user acknowledges the task list and authorises the destination.
- When a skill is incomplete, improve its procedure, decision criteria, failure handling and verification, not just its wording.
