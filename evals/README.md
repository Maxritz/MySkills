# MySkills behavioural evaluations

The suite has two layers.

## Deterministic CI layer

`node --test tests/runtime-router.test.mjs` checks that each task routes to its required specialists, out-of-domain prompts do not load an arbitrary skill, context loading remains capped, mutation detection catches common paths, and all optional reference links resolve. It reports selected-core bytes and a rough token estimate. This layer does **not** claim that a language model actually found the seeded defect.

## Model-backed layer

`cases.json` contains fixed fixtures, expected findings, required tests and a verdict requirement for each prompt. Run each task against the same configured OpenCode model and MySkills revision, expose the fixture as task context, and record:

- routed skill IDs and route-tool returned bytes;
- actual input/output token usage from the provider or OpenCode session metadata when available;
- whether each expected finding was stated and correctly scoped;
- unsupported claims, especially a root-cause claim without a reproduced failure or discriminating evidence;
- whether required tests were actually run and their exit status;
- final verdict category: CONFIRMED, SUPPORTED, UNRESOLVED, NO DEFECT ESTABLISHED, FALSIFIED or BLOCKED.

Grade findings against `expected_findings`, not exact wording. Do not count a suggested command as an executed test. For negative controls, any asserted root cause without new evidence is a false positive.

## Limitations

The deterministic tests can run without model credentials. Model discovery, diagnostic accuracy and actual provider-token usage cannot be honestly claimed from a static CI run. Capture actual token counts from model usage metadata; do not convert bytes to tokens and label that actual usage. The router's `ceil(UTF-8 bytes / 4)` figure is only an estimate of selected core text and excludes the prompt, history, system instructions and tool overhead.
