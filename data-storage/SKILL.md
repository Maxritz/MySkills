---
name: data-storage
description: Design persistent data models and storage paths with explicit consistency, transaction, durability, migration, corruption and recovery contracts.
compatibility: opencode
---

# Data Storage

Start from failure semantics and data invariants, not from a preferred database or file format.

## Contract

Define the source of truth, keys and uniqueness, read/write consistency, transaction boundary, durability requirement, concurrency model, retention, privacy, backup and recovery objectives. State what may be lost after process crash, OS crash or power failure.

## Design and implementation

- Choose schema, indexes, partitioning and storage engine from access patterns and scale evidence.
- Make transactions and isolation assumptions explicit. Check lost updates, write skew, lock order, deadlocks and retry behaviour.
- Use atomic replacement or transactional commits for multi-step updates; document fsync/durability guarantees where needed.
- Version schemas and define forward/backward compatibility. Use expand-migrate-contract when several program versions may overlap.
- Bound connections, queues, file sizes and transaction duration. Handle disk full, permission failure and interrupted writes.
- Keep cache invalidation, source-of-truth semantics and stale-read expectations explicit.
- Validate file/database inputs and avoid unsafe deserialisation or unchecked lengths.

## Recovery

Define backup frequency, retention, RPO/RTO and restore validation. A backup is not proven until a restore has been tested. Document repair or replay for partial writes and corrupt records.

## Tests

Exercise concurrent writers, duplicate requests, transaction rollback, process interruption, disk full, failed migration, crash recovery and restore, as relevant. Use a disposable test environment for fault injection and compare persisted state to invariants after restart.

## Output

Report the data model, consistency/durability choices, migration/rollback strategy, failure cases tested, recovery evidence and residual data-loss risks.

## Goli-mat-de integrity gate

Trace an acknowledged write through commit, persistence and restart. An in-memory result or successful SQL return alone does not prove durability or recovery.
