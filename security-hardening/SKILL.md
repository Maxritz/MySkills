---
name: security-hardening
description: Reviews trust boundaries, unsafe parsing, resource exhaustion, secrets, dependencies and least-privilege controls in systems and ML infrastructure.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["security review", "threat model", "untrusted input", "model file parser", "secret leakage", "sandboxing"]
---

# Security Hardening

Start with assets, trust boundaries and attacker-controlled inputs. Prioritise exploitable paths and impact, not the number of findings. Use the relevant platform skill for API-specific mitigations.

## Threat model

Record assets, trust boundaries, attacker capabilities, exposed entry points, privileges, sensitive data and failure impact. Distinguish reachable attack paths from theoretical concerns.

## Review surfaces

- **Input and binary parsers:** length/offset overflow, integer truncation, unbounded allocation, recursion depth, malformed metadata, decompression bombs, duplicate fields and invalid cross-references.
- **Memory and concurrency:** lifetime errors, races, unsafe FFI, double free, use-after-free, buffer overruns and privilege-boundary confusion.
- **Process and service:** authentication versus authorisation, path traversal, command injection, unsafe deserialisation, temporary files, inherited handles and overbroad permissions.
- **GPU and model execution:** treat model files and plugin kernels as untrusted when sourced externally; validate metadata and sizes before allocation; bound work, memory and execution time; never assume GPU execution prevents host-side attacks.
- **Secrets and telemetry:** never hard-code credentials or log tokens, API keys, private prompts, raw user data or secret-bearing environment variables. Redact error reports and CI artefacts.
- **Dependencies and updates:** pin and audit critical dependencies, verify artefact provenance, minimise optional components and document update/rollback procedure.
- **Deployment:** default-deny network and filesystem access, least privilege, isolated workloads, explicit resource limits and safe shutdown.

## Validation

Use targeted negative tests, fuzzing, sanitizers, static analysis and dependency scans where applicable. Confirm the mitigation closes the real path and does not merely hide the alert. Test denial of service, malformed inputs, oversized files, permission failures and resource cleanup.

## Severity and reporting

Rate findings by reachability, required privilege, exploitability, impact and confidence. Include affected path, preconditions, evidence, mitigation and regression test. Separate confirmed defects from hypotheses; do not claim a system is secure because one scan passed.
