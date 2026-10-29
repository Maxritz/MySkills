# Sherlock-It: Run Log Template

Use this template with actual data. It is structural guidance only; never copy example measurements or PASS labels as if they were collected.

```markdown
## [RUN-<id>] <ISO-8601 timestamp> — MODE: <LOW|FULL|DEEP> — TARGET: <project/component>
### BASELINE
- revision/environment/workload:
- command and timing boundary:
- repetitions, median, spread, correctness reference:
### FINDINGS
- ID | observed evidence | impact | confidence
### HYPOTHESES
- hypothesis | supporting/contradicting evidence | distinguishing test
### ACTIONS
- change | predicted effect | measured outcome | validation status
### DELTA
- what changed since previous run and why prior conclusions still apply
```

## Example trace shape

- **Expected:** named contract and boundary.
- **Observed:** exact captured result with tool/source and run identifier.
- **Divergence:** first measured boundary where they differ.
- **Next experiment:** one discriminating change and predicted result.
- **Status:** PASS / FAIL / BLOCKED / NOT RUN, backed by observed output.
