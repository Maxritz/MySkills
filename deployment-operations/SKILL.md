---
name: deployment-operations
description: Plan and operate application deployment across environments with reproducible configuration, health checks, migrations, secrets, rollout controls and recovery.
compatibility: opencode
---

# Deployment Operations

Treat deployment as a state transition with explicit prerequisites, health signals, blast radius and rollback conditions.

## Before deployment

Record application revision, artefact digest, target environment, runtime/OS, configuration source, required services, permissions, resource budgets and migration plan. Verify dependencies and platform features against the actual target. Keep secrets in a managed secret store and use least-privilege identity.

## Package and configure

- Make builds and runtime dependencies reproducible; separate environment config from the immutable artefact.
- Validate startup configuration early and fail clearly on missing required values.
- Define liveness and readiness separately. Readiness should reflect whether the instance can serve its promised workload.
- Set resource limits, request deadlines, graceful shutdown, retry policy and bounded queues.
- Do not expose administrative/debug endpoints publicly by default.

## Rollout and rollback

1. Deploy to a disposable or staging environment and run smoke/contract checks.
2. Promote in stages when risk warrants it, using health criteria defined before rollout.
3. Observe errors, saturation, latency and capacity after each stage.
4. Stop promotion on a stated failure threshold and preserve diagnostic evidence.
5. Roll back code and configuration when safe. For stateful schema or data changes, follow the documented backward-compatibility and recovery plan rather than assuming binary rollback is sufficient.

## Operational verification

Exercise restart, crash, dependency outage, secret rotation, failed health check, disk or memory pressure and graceful termination as relevant. Verify logs, metrics, trace access, backup/restore and operator permissions. Document commands and access limitations; do not claim a live deployment without a recorded result.

## Output

Report artefact/revision, environment, config version, rollout status, health evidence, migration state, rollback trigger, operator actions and known gaps.

## Goli-mat-de integrity gate

Follow one request from deployment start through health check and real workload. A successful deployment command does not prove readiness, correctness, recoverability or user-visible availability.
