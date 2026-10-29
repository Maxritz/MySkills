---
name: llm-evaluation
description: "Evaluation and regression testing for LLMs and inference engines: task quality, logits, tokenisation, safety, latency, throughput and release gates."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  auto_trigger: false
  trigger_keywords: ["LLM evaluation", "model eval", "perplexity", "quality regression", "eval dataset", "token accuracy", "logits comparison", "LLM benchmark"]
---

# LLM Evaluation

Use this skill to decide whether a model, conversion, kernel, quantisation change or serving release preserves the intended behaviour. Evaluation is a set of complementary tests, not a single score. Use model-formats for file validity and sherlock-it/kernel-tuning for performance root-cause analysis.

## Define the claim first

Write a testable objective and acceptance rule before running the model. Separate:
- **Functional correctness:** output schema, stopping rules, special tokens, prompt construction, tool-call format, batching and request isolation.
- **Numerical fidelity:** logits or intermediate tensor deviations against a trusted baseline.
- **Task quality:** correctness/helpfulness on a representative, held-out task set.
- **Safety and policy:** refusal and boundary behaviour for the stated product requirements.
- **Performance:** time-to-first-token, inter-token latency, throughput, tail latency, memory, power/cost and failure rate.

Do not substitute one dimension for another. Matching text on a few prompts does not prove numerical equivalence; matching logits does not establish that the model is useful or safe; high tokens/sec does not prove output correctness.

## Evaluation set design

- Store immutable case IDs, prompts, expected properties/references, tags, provenance and dataset version in a reproducible manifest.
- Cover typical requests, long context, short/empty inputs, multilingual/domain cases, structured output, tool calls, refusals/safety boundaries, long generations, malformed requests and adversarial cases relevant to the application.
- Keep a holdout set for release decisions. Avoid tuning a model or prompt repeatedly against the only evaluation set.
- Prevent leakage between training/tuning and holdout data where relevant. Record source dates, licence/privacy constraints and deduplication policy.
- Include the exact system prompt, chat template, tokenizer revision, stop sequences, sampling settings, context window and output token budget. For inference-engine tests, these are part of the workload contract.

## Build a reliable harness

1. Pin model and tokenizer hashes/revisions, runtime build, quantisation, backend, driver, hardware and configuration.
2. Seed stochastic sampling where supported. For deterministic numerical comparisons, use fixed tokens and disable sampling when the engine permits.
3. Record raw outputs, token IDs, token counts, finish reason, latency, memory and errors. Redact secrets and personal data.
4. Validate response structure and completion status before scoring content. Treat timeouts, empty outputs, NaNs and crashes as explicit failures, not missing values to discard.
5. Support reruns by immutable case ID. Preserve failed cases and reduced reproducers in the regression suite.
6. Verify that every expected case executed. Report passed/failed/skipped/errored totals and distinguish BLOCKED from PASS.

## Numerical and format tests

- Compare logits or selected intermediate tensors before sampling when possible. Check shape, token alignment, vocabulary mapping and special-token conventions first.
- Report max absolute error, RMS error, cosine similarity only with zero-norm handling, top-k agreement and an explicit tolerance policy.
- Use precision-appropriate tolerances established for the reference/model/runtime. Do not use one fixed threshold for all dtypes or quantisers.
- For quantised models, measure quality and size/speed changes against the original higher-precision weights. A converter loading successfully does not establish numerical or task equivalence.
- For speculative decoding, compare accepted tokens and final output distribution against the target decoder under the documented algorithm's exactness contract.
- For KV cache, batching, prefix reuse and paged attention, compare per-request output to the uncached/single-request reference and include mixed sequence lengths, cancellation and cache eviction.

## Task-quality scoring

Use exact match for genuinely exact tasks, unit tests for generated code, reference-based metrics when references are meaningful, and rubric-based human evaluation for open-ended output. Automated judge models can help scale review but require calibration against human-labelled examples, position/baseline controls and agreement reporting.

- Report each key slice, not just one aggregate average.
- Define acceptable thresholds and critical regression rules before release.
- Use confidence intervals or repeated samples when variance is material.
- Investigate examples where automated metrics disagree with human review.
- Perplexity measures token prediction under a specific tokenizer/data protocol; it is not a universal proxy for instruction following, code correctness or safety.

## Performance evaluation contract

Freeze prompt/input sizes, generated token counts, concurrency, batch policy, quantisation, cache settings, thermal/power state and software versions. Separate loading/JIT/warm-up, prefill, decode, copies and readback. Report:
- time-to-first-token and inter-token latency distributions;
- aggregate and per-request throughput;
- peak host/VRAM memory and load/eviction behaviour;
- failures, retries and queueing delay;
- correctness/task-quality deltas relative to the baseline.

Compare identical workloads and output requirements. Include median and spread across repeated trials. Do not infer weight streaming from model load bytes included in the decode window; inspect marginal I/O as output length changes.

## Release gate

A release passes only when mandatory correctness tests pass, no critical task-quality or safety slice regresses beyond the agreed threshold, and the expected performance target is measured under the release workload. Record exceptions and sign-off explicitly. If hardware or credentials are unavailable, mark that gate BLOCKED or NOT RUN.

## Report

    LLM EVALUATION: MODEL / ENGINE / CHANGE
    BASELINE: revision, tokenizer, runtime, precision
    DATASET: version, cases, slices and provenance
    CORRECTNESS: pass/fail/skip/error and golden comparisons
    NUMERICAL: tolerance policy, max/RMS error and top-k agreement
    QUALITY: per-slice scores, judge calibration and human review
    PERFORMANCE: TTFT, inter-token latency, throughput, memory, spread
    SAFETY: test coverage and regressions
    STATUS: PASS / FAIL / BLOCKED / NOT RUN
    BLOCKERS: explicit list

## Boundaries

- Use test-engineering for general software test design and harness quality.
- Use model-formats for container integrity/conversion correctness.
- Use llm-serving for production scheduler and API behaviour.
- Use sherlock-it or kernel-tuning to diagnose a measured performance bottleneck.
