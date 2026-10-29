---
name: ci-release-engineering
description: Design reproducible CI pipelines and safe release workflows with pinned dependencies, verified artefacts, staged rollout and rollback evidence.
compatibility: opencode
---

# CI and Release Engineering

A green pipeline is useful only when it builds the intended revision, tests the intended artefact and enforces the right release policy.

## Pipeline design

1. Pin toolchain and dependencies where reproducibility matters; record compiler, SDK, base image and build flags.
2. Separate lint/static checks, unit/contract tests, integration tests, packaging, artefact validation and release publication.
3. Make job dependencies explicit. Cache only reproducible intermediates and do not let cached results hide changed inputs.
4. Use least-privilege credentials, short-lived tokens, protected environments and explicit permission boundaries.
5. Preserve logs and test reports without publishing secrets, personal data or untrusted artefacts.
6. Test the built artefact, not only the source tree. Verify hashes, metadata, signatures and required runtime dependencies.
7. Prevent publication when required gates fail, are skipped unexpectedly or refer to a different revision.

## Release safety

- Generate a manifest with source commit, version, build environment, dependencies and artefact digests.
- Sign releases when the trust model requires it and verify signatures at consumption.
- Use staging, canary or phased rollout for material changes; define health signals and stop conditions before promotion.
- Coordinate database or model migrations with compatibility and rollback strategy. Prefer expand-migrate-contract when old and new binaries overlap.
- Define what rollback restores: code, configuration, schema, model files and external state.
- Avoid destructive cleanup before the new release is proven healthy.

## Validation

Test clean builds, cache invalidation, missing credentials, denied permissions, failed tests, interrupted upload, corrupted artefact, failed health checks and rollback where relevant. Record which failure paths were injected and which remain untested.

## Output

Report source revision, pipeline jobs, toolchain pins, artefact identity, test evidence, deployment stage, promotion decision, rollback path and blockers. Distinguish local validation from CI and release execution.

## Goli-mat-de integrity gate

Trace source commit to built artefact to deployed version. Never claim a release, signature, CI pass or rollback succeeded without the corresponding result.
