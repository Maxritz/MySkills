---
name: knowledge-process
description: "Sanitised analysis logs, compact context tracking, knowledge retention and risk-sized development validation. Session continuity and evidence capture."
compatibility: opencode
---
# Knowledge & Process

Keep useful, sanitised facts across sessions without treating old notes as ground truth.

## Persistence

- **Analysis log:** append timestamped findings to `.opencode/analysis.md`; never rewrite earlier entries. Record revision, path/symbol, evidence, impact and open questions. Redact personal data, secrets, credentials, private paths and sensitive endpoints.
- **Context tracker:** maintain compact topic summaries (≤500 tokens) with source references and last-checked revision. Use `~/.config/opencode/contexts/` only when the project's tracker is available; otherwise maintain the documented files manually.
- **Knowledge base:** keep cross-project notes outside version control and project notes under `.opencode/knowledge.md`. Save only verified, sanitised patterns with the fix and regression evidence.
- Start with a summary/delta, then re-open current source for any fact that may have changed. Notes and sample output are retrieval hints, not verification.

Detailed templates and example schemas: [workflow templates](references/workflow-templates.md). Script names such as `ctx.py` and `kb.py` are optional interfaces, not guaranteed executables.

## Risk-sized validation

### Ten-check validation catalogue

Use these checks according to risk. Always inspect the diff and run relevant targeted checks for behavioural changes. Add golden/differential, fuzz, sanitizer, state-flow, lifecycle, integration and performance checks when the changed contract justifies them. A check may be NOT APPLICABLE only with a reason. Use PASS, FAIL, BLOCKED, NOT RUN or NOT APPLICABLE honestly; an unrun check is never PASS.

| Gate | Check | Tool |
|------|-------|------|
| **1** | Compile | `cmake --build -Werror` |
| **2** | Format | `clang-format` / `ruff format` |
| **3** | Unit test | `ctest` / `pytest` |
| **4** | Reproduce | Capture repro case before fixing |
| **5** | Golden test | Known input → known output |
| **6** | Fuzz test | Malformed/random → graceful reject |
| **7** | Sanitizer | ASan + UBSan clean |
| **8** | Flow analysis | debug-core: truth table + data trace |
| **9** | Resource audit | Every alloc→free, handle→close |
| **10** | Performance | No >5% regression vs baseline |

**Illustrative log format:**

The following values are examples of the report shape only. Replace every status and measurement with actual observed results; never copy sample PASS claims into a real report.
```
✅ I1: compile clean
✅ I2: format clean
✅ I3: test_gguf ✅ (12/12)
✅ I4: repro captured (test/inputs/corrupt.bin)
✅ I5: golden test_gguf_golden ✅
✅ I6: fuzz 10000 iterations ✅
✅ I7: ASan+UBSan clean
✅ I8: truth table: 3 branches, all resolved
✅ I9: resource audit: 3 alloc/3 free, 0 leaks
✅ I10: perf 12.3ms → 12.1ms (-1.6%)
```

Use only the gates that can validate the changed contract. For every check record PASS, FAIL, BLOCKED, NOT RUN or NOT APPLICABLE with a reason. Never convert an unrun check to PASS. For failure analysis, use truth tables or data traces only when they distinguish live hypotheses. Re-run failed checks and relevant regressions after the fix.

## Session closeout

- [ ] Record exact revision, changed paths and scope.
- [ ] Record commands and observed results; separate unrun checks and assumptions.
- [ ] Update only verified, sanitised knowledge.
- [ ] Mark stale or unverified notes for re-check; do not copy sample PASS claims.
- [ ] Use `deployment-operations` and `ci-release-engineering` for deployment/release work.

## Report

`PHASE | revision | facts recorded | gates passed/failed/blocked/not run | knowledge updated | residual risks`.

## Evidence gate

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly.

## Boundaries

- Maintains knowledge and development continuity; does not perform deployment or provision infrastructure.
- If helper tools are absent, say so and use manual file-based workflow where appropriate.
