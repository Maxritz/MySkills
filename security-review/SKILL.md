---
name: security-review
description: Threat-model code and systems, find trust-boundary failures, and prioritise evidence-backed security risks with safe validation guidance.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["security review", "threat model", "attack surface", "secret leak", "authentication", "authorisation", "injection", "dependency vulnerability", "secure coding"]
---

# Security Review

Review the actual attack surface and data flow. Treat suspicious patterns as leads until context, reachability and impact are established.

## Threat model

Record assets, trust boundaries, attacker capabilities, entry points, privileged operations, sensitive data and consequences. Include build, packaging, runtime configuration and update channels where relevant. Do not invent an attacker capability that the deployment does not expose.

## Review sequence

1. Trace external input through parsing, validation, interpretation, storage, execution and output.
2. Check authentication, authorisation and ownership at every boundary. A valid identity is not automatically permitted to perform every action.
3. Review injection, path traversal, deserialisation, command construction, unsafe file access, memory bounds, integer overflow, races and information leaks as applicable.
4. Check secret storage, logging/redaction, key rotation, credential scope and accidental inclusion in source, logs, artefacts or diagnostics.
5. Review dependency provenance, lock files, build scripts, downloaded binaries, signing, update integrity and vulnerable transitive dependencies.
6. Evaluate defaults, least privilege, rate limits, timeouts, resource exhaustion, fail-open behaviour and recovery after partial failure.
7. Use static analysis, unit/contract tests, dependency scanners and safe dynamic tests appropriate to the threat. Never claim a penetration test ran unless it actually ran.

## Finding standard

For each finding record severity, confidence, affected asset, attacker prerequisites, reachable code path, evidence, impact, remediation and regression/verification criteria. Separate a confirmed vulnerability from an exposure, defence-in-depth improvement, missing test or unverified concern. Prioritise exploitability and blast radius, not scary wording.

## Safe validation

Use an owned or explicitly authorised test environment. Prefer harmless proof cases and minimal reproduction. Do not expose real credentials or sensitive data in examples. If testing is blocked, specify the evidence still needed and leave the claim unconfirmed.

## Goli-mat-de integrity gate

Trace risk to reachable behaviour and a concrete security boundary. A scanner alert is not automatically a vulnerability, and the absence of alerts is not proof of security.
