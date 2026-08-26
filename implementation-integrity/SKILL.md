---
name: implementation-integrity
description: Ensure generated, repaired, or modified code is real, complete, executable, non-placeholder, and supported by actual validation rather than demo, stub, fake, or unverified behavior.
---

# Implementation integrity

Apply this gate to every code-writing task.

1. Define the requested behavior, inputs, outputs, errors, side effects, integration points, and acceptance tests.
2. Search for TODO, FIXME, placeholder, stub, fake success, empty handlers, dead branches, swallowed errors, and demo-only paths.
3. Implement the smallest complete behavior; do not hide missing functionality behind optimistic defaults or comments.
4. Execute the build, linter, targeted test, original reproducer, and relevant integration check.
5. Report PASS only for executed evidence; label NOT RUN, UNVALIDATED, or known limitations explicitly.

Read `_systems-ml-shared/quality-gates.md`. Load `code-contract-comments` only when contracts/comments are part of the task.
