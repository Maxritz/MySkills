---
name: app-engine-deploy
description: Plans and validates Google App Engine deployments, runtime configuration, IAM, secret handling, health, observability and rollback.
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["App Engine", "app.yaml", "dispatch.yaml", "Google Cloud deployment", "Cloud SQL"]
---

# App Engine Deployment

Use current Google Cloud documentation for the chosen runtime, deployment mode and region before assuming a configuration field or runtime version is supported. Examples are templates, not proof that a particular project configuration is valid.

## Pre-deployment contract

Record project and service, runtime/version, region, entry point, scaling model, health checks, resource limits, environment configuration, service account, network access, database dependencies and rollback target. Keep secrets outside source and ordinary configuration files.

## Configuration and identity

- Validate app.yaml, service routing and runtime configuration with the current CLI and documentation.
- Grant the runtime service account only required roles. Separate deploy permissions from application runtime permissions.
- Use Secret Manager or the platform-supported secret mechanism; do not print secret values in logs or CI.
- Bound concurrency, instance count, memory, request duration and background work to avoid resource exhaustion.
- For Cloud SQL, verify connector/socket settings, connectivity, IAM/database identity, connection pooling and failure handling.
- Ensure health checks reflect readiness, not just that the process is alive.

## Deployment sequence

1. Run tests and a clean package/build.
2. Deploy to staging or a non-production version.
3. Inspect startup logs, health checks, real requests, database access, error rate and latency.
4. Promote traffic only after acceptance criteria pass.
5. Keep the previous known-good version and documented rollback command.
6. Verify rollback restores the previous service behaviour; do not infer success only from a successful CLI exit.

## Completion evidence

Report runtime and configuration versions, validation commands, deployment status, smoke-test results, logs inspected and rollback readiness. Redact credentials and private user data. Mark cloud checks NOT RUN if access was unavailable.
