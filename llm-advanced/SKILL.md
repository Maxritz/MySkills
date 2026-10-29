---
name: llm-advanced
description: "MoE execution, speculative decoding, expert routing, distributed inference and numerical validation contracts."
compatibility: opencode
metadata:
  auto_unload: true
  loading: on-demand
  auto_trigger: false
  trigger_keywords: ["MoE", "Mixture of Experts", "speculative decoding", "EAGLE", "Medusa", "expert parallel", "draft model", "acceptance rate"]
---

# LLM Advanced Components

Treat MoE and speculative decoding as correctness-sensitive algorithms. Verify implementation details against the exact model/runtime revision; architecture names do not guarantee identical routing or verification semantics.

## 1. Mixture of Experts (MoE)

### Contract

For each layer, record expert count, expert dimensions, top-k policy, router-score transform, normalisation/scaling, shared experts, capacity/drop policy, expert-parallel topology and tensor layout.

Correct execution must preserve:
- Router logits, top-k tie behaviour and selected expert IDs.
- Token-to-expert assignments and the documented router-weight policy.
- Expert GEMM shapes/layout/dtype, accumulation precision and activation/gating order.
- Gather/scatter positions and the inverse mapping to original token order.
- Padding, capacity overflow, shared-expert contribution and dropped-token policy where defined.
- Distributed rank/group ownership and collective ordering.

Do not assume Mixtral/DeepSeek routing rules are universal. Inspect the exact model configuration and reference implementation. Training auxiliary losses and load-balancing objectives must not be silently inserted into inference.

### Validation

1. Compare router IDs and weights against a trusted reference on small deterministic inputs.
2. Test top-k ties, skewed routing, empty expert assignments, maximum expert load and padded batches.
3. Compare per-expert outputs and scatter results before comparing the full layer.
4. Verify weights cannot be confused across layer/expert indices or quantisation blocks.
5. For distributed execution, test rank agreement, collective order, failed-rank propagation and shutdown. Single-rank success does not validate expert parallelism.
6. Track expert cache misses/transfers separately from compute; do not infer streaming from one-time model-load I/O.

## 2. Speculative Decoding

### Exactness contract

The verifier and algorithm variant define the guarantee. Standard target-verification speculative sampling can preserve the target model's output distribution when the acceptance and residual-sampling rules are implemented correctly. Greedy speculative decoding should match target-only greedy output under the same logits and tie policy. Independently sampled sequences need not match token-for-token even when their distributions match.

Record target/draft revisions, tokenisers, sampling settings, draft length, logits precision, stop handling, EOS rules and algorithm variant. Verify compatible vocabularies/token IDs or the mapping required by the method.

### Validation

- **Greedy mode:** compare output tokens to target-only greedy decoding across fixed and adversarial prompts, including EOS, ties, short output and early rejection.
- **Sampling mode:** verify acceptance/residual probabilities against the selected algorithm; test distribution agreement over repeated draws with a suitable statistical method. Do not assert equality to a separately sampled target run.
- Exercise zero accepted drafts, all accepted drafts, rejection at each draft position, maximum draft length, stop-token handling and cancellation.
- Verify the target scores the correct prefix and rejection samples from the correct residual distribution.
- Check KV-cache rollback and positions after rejection. Compare final logits/cache state against the non-speculative reference where the contract permits.
- Measure useful accepted tokens, verifier work, draft work, memory overhead and end-to-end latency. Acceptance rate alone is not speedup.

## 3. Quantisation and numerical validity

Do not use a global tolerance table for FP16, BF16, INT8 or INT4. Tolerance depends on tensor role, quantiser, scale/block scheme, calibration, backend, accumulation precision and task.

For each comparison:
1. Confirm identical inputs, token IDs, shapes, layout and output semantics.
2. Set absolute/relative tolerances from an explicit criterion and trusted baseline.
3. Report max absolute error, RMS error and top-k agreement or other metrics relevant to the contract.
4. Include edge shapes, tails, extreme/zero values, non-finite behaviour and rounding/accumulation differences.
5. Evaluate task quality separately from elementwise numerical error, especially for quantised language models.

## 4. Performance evaluation

There is no universal 1.3x, 2x or 3x speedup attached to a named algorithm. Results depend on the model pair, accepted draft length, batch/concurrency, context, hardware, memory pressure, scheduler and implementation.

Freeze the workload and report time-to-first-token, inter-token latency, throughput, verifier work, accepted-token rate, peak memory, queueing and failures. Separate model loading/JIT/warm-up from timed work and run repeated trials. Compare against target-only decoding with the same output and correctness requirements. Publish speedup only with a stated timing boundary, baseline and spread.

## Release checklist

- [ ] Exact model/runtime revisions and algorithm variant recorded.
- [ ] Router/expert or acceptance/residual contract checked against source/specification.
- [ ] Edge, failure, rollback and cache-ownership paths exercised.
- [ ] Reference or distribution checks pass within predeclared criteria.
- [ ] Benchmark uses an identical baseline and repeated trials.
- [ ] Unsupported parallel, quantisation or device paths are explicitly marked.

## Report

    LLM ADVANCED: MOE / SPECULATIVE / QUANTISATION
    CONTRACT: model revision, algorithm and numeric policy
    CORRECTNESS: oracle, cases and exactness/statistical method
    CACHE/DISTRIBUTED: ownership, rollback and rank behaviour
    PERFORMANCE: baseline, workload, latency/throughput, memory, spread
    STATUS: PASS / FAIL / BLOCKED / NOT RUN
    BLOCKERS: explicit list

## Boundaries

- Use llm-core for tokenisation, attention, MLP, sampling and base KV-cache contracts.
- Use llm-evaluation for task-quality and release regression gates.
- Use llm-serving or engine-specific skills for deployed scheduler/API behaviour.
- Use goli-mat-de when an implementation or benchmark claim may be incomplete or misrepresented.

## Optional references

- [advanced-recipes.md](references/advanced-recipes.md)
