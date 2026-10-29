---
name: observability-engineering
description: Build useful logs, metrics, traces and alerts with clear timing boundaries, low-cardinality labels, privacy safeguards and SLO-driven diagnosis.
compatibility: opencode
---

# Observability Engineering

Instrumentation must answer a diagnosis or operational decision. More telemetry is not automatically better.

## Define the question

Name the symptom, user impact and decision that telemetry should support. Define request boundaries and units before adding events or metrics. For performance work, separate queue time, host work, device/service execution, transfer time and end-to-end latency when the architecture requires it.

## Signals

- **Metrics:** use counters for events, gauges for current state and histograms for distributions. Define units and monotonicity.
- **Logs:** use structured fields, stable event names, severity and correlation identifiers. Log state transitions and actionable failures, not every loop iteration by default.
- **Traces:** propagate context across process and async boundaries; represent retries, queues and external calls as distinct spans.
- **Alerts:** tie thresholds to user-facing symptoms or SLO burn, add runbook actions and avoid paging on noise.
- **Profilers:** sample or trace the expensive layer; estimate instrumentation overhead and remove or reduce temporary probes after diagnosis.

## Correctness and cost

- Avoid high-cardinality labels such as raw prompts, user IDs, request bodies and arbitrary paths.
- Redact secrets, tokens and personal data before export; set retention and access policy.
- Distinguish missing data from zero, and counter resets from real changes.
- Use histograms with suitable buckets for the latency range and report p50/p95/p99 with sample count.
- Synchronise clocks or record clock source where cross-host timestamps matter.
- Validate that tracing remains correct under concurrency, sampling, retries and cancellation.

## Operational checks

Test telemetry export failure, agent/collector restart, sampling, label cardinality, alert firing and runbook links. State which backend was queried and the exact time window; do not claim an incident or metric trend from fabricated sample data.

## Output

Report the question, signal definitions, units, collection path, overhead, privacy controls, alert condition, observed evidence and known blind spots.

## Goli-mat-de integrity gate

A dashboard is not evidence unless the metric definition, source, time window and query are known. Avoid claims that rely on a chart with no sample count or timing boundary.
