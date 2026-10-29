---
name: api-contracts
description: Define and evolve API contracts with explicit schemas, errors, authentication, idempotency, compatibility and executable contract tests.
compatibility: opencode
---

# API Contracts

An API contract includes observable behaviour, failures and evolution, not merely a request/response schema.

## Specify

Define endpoints or RPC methods, types, required/optional fields, validation constraints, units, defaults, error codes, authentication/authorisation, rate limits, idempotency, timeouts, pagination, ordering and streaming semantics. Distinguish omitted, null, empty and default values.

## Compatibility

- Classify changes as additive, breaking or behaviour-changing; check both source and wire compatibility.
- Define versioning and deprecation policy. Test old clients against new servers and, where required, new clients against old servers.
- Make error envelopes stable and actionable without leaking implementation details.
- Specify retry and idempotency semantics before adding automatic retries.
- Bound payload sizes, page sizes, stream duration and resource use.
- Keep business rules independent of transport-specific DTOs where architecture calls for it.

## Implementation and tests

Generate schemas and clients from a canonical source only when generation is reproducible. Validate generated artefacts are current. Add contract tests for success, validation, unauthorised access, missing resources, conflicts, rate limits, timeout, cancellation and version mismatch. Test that the real routing/registration path exposes the operation.

## Review checklist

Check authentication versus authorisation, error mapping, partial updates, optimistic concurrency, duplicate submissions, clock/time-zone and numeric-unit ambiguity. Document what an operation guarantees about side effects and completion.

## Output

Report schema/version, compatibility impact, changed behaviour, generated files, contract-test results, migration plan and client/server rollout constraints.

## Goli-mat-de integrity gate

Trace the public operation from router through validation and business logic to its wire response. A handler function existing in source does not prove the API is registered or externally reachable.
