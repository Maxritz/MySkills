---
name: debug-verify
description: "Verify with executed tests. Never claim unrun PASS."
compatibility: opencode
metadata:
  role: debugging
  loading: on-demand
---

## Verification ladder
1. Static checks
2. Build/link/load
3. Targeted test
4. Original reproducer
5. Differential/reference test
6. Regression suite
7. Broader integration/performance checks when risk warrants them

Use only the minimum sufficient levels, escalating with risk.

Status:
- PASS: executed and passed
- FAIL: executed and failed
- NOT RUN: not executed
- UNVALIDATED: execution/evidence unavailable

Never convert NOT RUN or UNVALIDATED to PASS.
