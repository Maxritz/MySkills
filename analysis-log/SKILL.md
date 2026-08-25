---
name: analysis-log
description: "Analysis appended to .opencode/analysis.md. Delta-read, not full."
license: MIT
compatibility: opencode
metadata:
  auto_trigger: true
  priority: high
---

# Analysis Log
@see debug-core:1 (reproduce) for full codebase scan trigger. @see knowledge-base.

## Flow
1. Full analysis -> append to `.opencode/analysis.md`
2. Every change -> **append** (never rewrite) — "@appended {timestamp}: ..."
3. Next analysis -> read only appended delta, never full codebase

## Format (append-only MD)
```
## [T+0s] analysis-start
- scope: src/ include/ tests/
- files: 127 | findings: 3

## [T+5s] finding: bounds-check-missing
- file: src/tensor.c:87 @see c99-standards
- severity: critical
- desc: tensor_load() missing n < MAX_TENSORS check

## [T+5s] finding: DBG_TRACE gap
- file: src/quant.c:42 @see debug-core
- desc: no DBG_TRACE at loop entry

## [T+10s] analysis-complete
- total: 3 | open: 3
```

## Sanitization
@see knowledge-base sanitization rules — same regex, same enforcement,
both tiers. Never write paths/keys/emails/phones.

## Lookup
`grep -n "finding:" .opencode/analysis.md` > `grep "severity: critical"`
Never open full file — grep by tag/pattern.

## Validation
- [ ] File at project root `.opencode/analysis.md`
- [ ] Append-only (no rewrite of prior sections)
- [ ] Sanitized (no secrets)
- [ ] Next session reads delta only
