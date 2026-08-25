---
name: analysis-log
description: "Log codebase analysis findings to .opencode/analysis.md. Append-only, sanitized, ships with code."
license: MIT
compatibility: opencode
metadata:
  auto_trigger: true
  priority: high
---

# Analysis Log

## Purpose

When a full codebase analysis is done, write findings to
`.opencode/analysis.md` in the project root. This file **ships with the code**
and accumulates analysis incrementally — no re-reading needed.

## File Format

```
# Codebase Analysis Log

## [TIMESTAMP] analysis-start
- scope: src/ include/ tests/
- files_scanned: 127
- findings: 3 issues

## [TIMESTAMP] finding: buffer overflow
- file: src/tensor.c:87
- type: bounds-check-missing
- severity: critical
- description: tensor_load() does not check n < MAX_TENSORS
- @see debug-localize, debug-invariants

## [TIMESTAMP] finding: DBG_TRACE missing
- file: src/quant.c:42
- type: instrumentation-gap
- @see debug-core

## [TIMESTAMP] analysis-complete
- total_findings: 2
- status: open
```

## Rules

1. **Always project-local**: `.opencode/analysis.md` — never personal paths.
2. **Sanitize before write**:
   - Strip `/home/`, `/Users/`, `C:\Users\` paths → replace with `~/project/`
   - Strip API keys: `sk-*`, `ghp_*`, `AKIA*` → `[REDACTED-KEY]`
   - Strip emails: `*@*.*` → `[REDACTED-EMAIL]`
   - Strip phone numbers: `*[0-9]{3}-[0-9]{3}-[0-9]{4}*` → `[REDACTED-PHONE]`
   - Strip `password=`, `secret=`, `token=` → `[REDACTED]`
3. **Append-only**: Never rewrite the file. Append sections with timestamps.
4. **Search, don't read**: Use `grep`/search to find specific findings by tag.
5. **Ship with code**: `.opencode/analysis.md` is committed to the repo.

## Usage

```python
# After full analysis:
log_analysis("analysis-start", scope="src/ include/", files=127, findings=3)
log_analysis("finding", file="src/tensor.c:87", type="bounds-check", severity="critical")
log_analysis("analysis-complete", total=3, status="open")
```

## CLI

```bash
python .opencode/analysis_log.py log "finding: buffer overflow" "file: src/tensor.c:87" "severity: critical"
python .opencode/analysis_log.py search "overflow"
```

## Validation

- [ ] File at `.opencode/analysis.md` (not personal path)
- [ ] No paths outside project root
- [ ] No API keys/emails/phones in output
- [ ] Append-only (never rewrite existing sections)
- [ ] Each entry timestamped
