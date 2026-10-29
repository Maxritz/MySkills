---
name: networking-systems
description: Engineer and debug socket, protocol and distributed I/O paths with explicit framing, timeouts, cancellation, backpressure and security boundaries.
compatibility: opencode
---

# Networking Systems

Treat the network as a byte stream or datagram service with partial completion and failure, not as a reliable message pipe.

## Contract first

Specify protocol framing, maximum message sizes, encoding, connection lifecycle, timeouts, retry policy, ordering, idempotency, authentication, error mapping and compatibility. Identify which side owns each buffer and connection.

## I/O and lifecycle

- Handle short reads/writes, interrupted calls, EOF, half-close, reset, timeout and cancellation.
- Bound buffers, in-flight requests, connection pools and queued work. Define backpressure rather than allowing unbounded growth.
- Distinguish connect, handshake, first-byte, per-operation and total deadlines.
- Retry only operations whose semantics make retry safe; use idempotency keys or deduplication when required.
- Ensure cancellation stops work and releases sockets, buffers, tasks and request state.
- For asynchronous I/O, trace submission, completion, cancellation races and shutdown draining.

## Security

Validate framing and lengths before allocation. Verify TLS certificate and hostname validation, trust roots and protocol settings. Enforce authentication and authorisation at the service boundary. Protect against request smuggling, parser disagreement, resource exhaustion, replay and sensitive-data leakage where relevant.

## Diagnosis and validation

Capture the exact endpoint, protocol/version, request shape, relevant timeouts and observed result while redacting credentials. Use packet traces or structured logs only when needed and account for clock skew and capture loss. Test fragmentation/coalescing, slow peers, disconnects, duplicate requests, malformed messages and overload in a controlled environment.

## Output

Report the first failing boundary, client/server side, transport versus application error, reproduction conditions, instrumentation used, actual results and untested cases.

## Goli-mat-de integrity gate

Prove the complete request/response and cancellation path. A successful connection or local mock does not prove protocol correctness, delivery, ordering or recovery under failure.
