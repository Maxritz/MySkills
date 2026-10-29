---
name: code-quality-gate
description: "Implementation review checklist for behavioural contracts, placeholder detection, risk-sized verification, traceability, Rust safety and component boundaries. Invoke for code changes."
compatibility: opencode
metadata:
  loading: on-demand
  priority: critical
---
# Code Quality Gate

Invoke for implementation changes. Run the smallest complete quality pass that covers the changed contracts; deepen it for risk, not by ritual.

## Pipeline

`DIFF → CONTRACTS → IMPLEMENTATION INTEGRITY → RISK-SIZED VALIDATION → TRACEABILITY → BOUNDARIES → REPORT`

## Required checks

1. **Contracts:** for public or non-trivial interfaces, document only material guarantees: purpose, ownership/lifetime, preconditions, postconditions, errors, side effects, threading/async safety and relevant performance constraints. Use [detailed contract recipes](references/quality-recipes.md) for examples.
2. **Implementation integrity:** inspect TODO/FIXME/HACK markers, empty bodies, canned outputs, constant success, test-only mocks, unimplemented branches and fake metrics. Verify the live call path and contract before calling a pattern defective. Deliberate no-ops and explicit unsupported-operation errors can be valid.
3. **Validation:** select applicable checks below. Keep each result as PASS, FAIL, BLOCKED, NOT RUN or NOT APPLICABLE with a reason; never treat unrun or skipped checks as PASS.
4. **Traceability:** add low-overhead markers at diagnostic boundaries only when they answer a concrete question. Cover important error exits without leaking secrets. See [traceability](../traceability/SKILL.md).
5. **Rust:** when Rust is touched, apply ownership, unsafe-boundary, error and async rules from [rust-safety](../rust-safety/SKILL.md).
6. **Architecture:** check real imports, registration, dispatch, ownership and failure handling against [architecture-boundaries](../architecture-boundaries/SKILL.md); do not rely on directory names alone.

## Risk-sized validation

| Check | Use when |
|---|---|
| Diff, static analysis, format and build | Every relevant code change; run only tools supported by the project |
| Focused unit/contract test | Behaviour or interface changed |
| Original reproducer and regression test | Bug fix or regression |
| Golden/differential test | Binary formats, numerical code, conversion or a reference exists |
| Fuzz/property testing | Untrusted parsers, broad input domains or complex state |
| Sanitizers | Native memory/concurrency risk and tooling supports it |
| Flow, state and resource lifecycle audit | Branching, async, ownership, GPU/OS resources or cleanup changed |
| Integration/real target | Cross-module, platform, runtime or device behaviour changed |
| Repeatable benchmark | Performance-sensitive code changed |

Repeat failed checks after the fix and rerun linked regression gates. A compile proves buildability, not runtime correctness. Do not force irrelevant checks onto documentation-only edits; record why they are not applicable.

## Report

Return scope/revision, findings with evidence and locations, each check's actual status, untested paths, residual risks and next action. Never claim a build, test, trace, benchmark or security check ran without its output.

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

## Boundaries

- Use [quality recipes](references/quality-recipes.md) for detailed examples.
- This gate does not replace domain testing, security review or deployment validation.
