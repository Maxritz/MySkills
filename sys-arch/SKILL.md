---
name: sys-arch
description: "System architecture (platform-agnostic): architecture decomposition, component contracts, non-functional budgets, dependency direction, cross-platform patterns, validation gates. Platform-agnostic architecture design and review."
compatibility: opencode
---

# System Architecture

**Platform-agnostic architecture design and review.** Covers decomposition, component contracts, budgets, dependency direction, cross-platform patterns, and validation.

---

## Architecture Decomposition

```
Requirements → Actors & Trust Boundaries → Data/Control Flow → Component Contracts → Non-Functional Budgets → Testable Architecture
```

## Component contract essentials

For each component define: responsibility, owned state/resources, public interfaces, data/schema, pre/postconditions, error mapping, dependencies, failure domains, telemetry, SLOs and rollback. Keep each fact testable.

Detailed template and platform examples: [component recipes](references/architecture-recipes.md).

## Non-Functional Budgets

| Budget | Target | Measurement |
|--------|--------|-------------|
| **Latency (p99)** | < 200ms | HTTP server metrics |
| **Throughput** | 10K req/s | Load test |
| **Availability** | 99.95% | Uptime monitor |
| **Memory** | < 2GB RSS | Process metrics |
| **CPU** | < 70% avg | Container metrics |
| **Cold start** | < 5s | Deploy metrics |
| **Recovery** | < 30s | Chaos test |

## Dependency Direction (Enforced)

```
Transport (HTTP/gRPC) 
  → Application (orchestration, validation, auth)
  → Domain (pure business rules)
  → Persistence (repos, SQL)
  → Infrastructure (cloud SDK, FS, clock)
  → Workers (background jobs)
  → Config (feature flags, secrets)
```

**Rule:** Inner layers never import outer layers. Domain has zero external deps.

---

## Validation Gates

| Gate | Linux | Windows | Architecture |
|------|-------|---------|--------------|
| **Build** | `cmake --build -Werror` | MSVC `/W4 /WX` | N/A |
| **Static** | `clang-tidy`, `cppcheck` | `/analyze`, `PREfast` | Dependency check |
| **Sanitizers** | ASan/TSan/UBSan/MSan | ASan (experimental) | N/A |
| **Unit Tests** | `ctest` | `ctest` / GoogleTest | Contract tests |
| **Integration** | `pytest` / custom | `pytest` / custom | E2E path |
| **Chaos** | `chaos-mesh` | `chaos-mesh` | Failure injection |
| **Load** | `wrk` / `locust` | `wrk` / `locust` | Budget check |

---

## Output Report

```
SYS-ARCH: <phase> ANALYSIS
PHASE: <decomposition|contracts|budgets|validation>
COMPONENTS: <defined>/<total>
DEPENDENCY: direction enforced ✅/❌
CONTRACTS: versioned/validated ✅/❌
BUDGETS: <met>/<total>
BLOCKERS: <circular dep|missing interface|budget breach>
```

## Goli-mat-de integrity gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

- Translate each requirement into an owner, interface contract, resource/SLO budget and failure mode. Check dependency direction, startup/shutdown and rollback paths against the real wiring; mark estimates and untested assumptions explicitly.


## Boundaries

- Does not write platform-specific code (see `linux-user` / `windows-user`)
- Does not write kernel code (see `os-kernel-systems`)
- Does not manage C/C++ ownership (see `c-systems`)
- `stop sys-arch`: revert.