# MySkills

**74 focused skills** for systems programming, GPU compute, LLM infrastructure, debugging, performance engineering and implementation integrity. Load the smallest relevant set, then bring in another skill only when the work crosses a real technical boundary.

## Core rules
- OpenCode discovers skills natively through `skills: ["./"]`.
- The MySkills runtime plugin provides deterministic keyword routing and returns selected skill cores.
- The router is an extension, not a native keyword trigger or unload feature.
- Skill front matter is descriptive metadata. Do not rely on unsupported `auto_trigger`, `auto_unload`, `loading`, `priority` or `trigger_keywords` fields for execution.
- Goli-mat-de audits implementation completeness and verification claims; it does not make unrun tests pass.

## Catalogue
See [SKILL_CATEGORIES.md](SKILL_CATEGORIES.md) for the complete list of 74 skill directories. Every entry must match an actual `*/SKILL.md` directory.

## Runtime and tests
- Runtime plugin: `.opencode/plugins/myskills-runtime.js`
- Deterministic routing core: `runtime/router-core.mjs`
- Routing and reference regression tests: `node --test tests/runtime-router.test.mjs`
- Fixed evaluation cases and rubric-isolated model prompt: `evals/`

For model-backed evaluation, configure OpenCode credentials and run:

```sh
OPENCODE_EVAL_MODEL=provider/model node evals/run-model-evals.mjs
```

This runner records raw events and token usage only when the CLI exposes them. Model-backed evaluations are not considered executed until a configured run and grading evidence exist.

## Installation
Copy the repository into the OpenCode skills directory. Preserve each skill folder and its `SKILL.md`. Install the pinned runtime package from `.opencode/package.json` if using the router plugin.

## Licence
MIT at repository level. Follow individual skill licence and attribution notes where present.
