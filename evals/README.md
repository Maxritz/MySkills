# MySkills behavioural evaluations

The suite has two layers.

## Deterministic CI layer

`node --test tests/runtime-router.test.mjs` checks that each task routes to its required specialists, out-of-domain prompts do not load an arbitrary skill, context loading remains capped, mutation detection catches common paths, and all optional reference links resolve. It reports selected-core bytes and a rough token estimate. The CI smoke test also executes the real route tool and checks that the pre-tool gate blocks an unrouted session. These tests do **not** claim that a language model found the seeded defect.

## Model-backed layer

`cases.json` contains nine fixed fixtures, including two negative controls. Use the same configured OpenCode model and branch revision across runs:

```bash
OPENCODE_EVAL_MODEL=provider/model node evals/run-model-evals.mjs
```

The script runs every case with `opencode run --format json`, stores raw events in `evals/results/latest.json` (or the directory in `MYSKILLS_EVAL_OUT`) and records token-usage objects when the CLI exposes them. `evals/prompt.mjs` excludes the case ID, expected findings, target skill list, required tests and expected verdict from model input to prevent rubric leakage. It does not auto-grade findings: the saved record carries the rubric for manual or separate-judge grading. Model and provider credentials must already be configured in OpenCode.

For each case, grade:
- **Skill selection:** compare IDs returned by the `myskills_route` tool with `required_skills`.
- **Findings:** compare the answer with `expected_findings`, allowing equivalent wording and domain-correct caveats.
- **Unsupported claims:** flag root-cause claims without causal evidence, invented line numbers, fabricated tool output or tests that were only suggested.
- **Tests:** check whether each `required_tests` item was genuinely executed and inspect its output/exit status. Mark unrun tests NOT RUN, not PASS.
- **Token consumption:** use actual input/output usage exposed in raw OpenCode events. Missing usage must be recorded as unavailable, not inferred from response length. The router's `ceil(UTF-8 bytes / 4)` is only a rough selected-core estimate, not actual model usage.

Use verdict labels CONFIRMED, SUPPORTED, UNRESOLVED, NO DEFECT ESTABLISHED, FALSIFIED or BLOCKED. For negative controls, an asserted root cause without new evidence is a false positive.

## What CI can and cannot say

Deterministic CI proves the router follows configured keyword rules and that reference paths are connected. It does not establish model diagnostic accuracy, factual reliability or actual token savings. A model-backed run is meaningful only when the model, prompt, plugin revision and provider usage data are retained alongside the raw response; manual rubric grading remains required unless a separately validated judge is added.
