---
name: ponytail-diag
description: Diagnose reported behaviour by tracing code and data flow, testing competing hypotheses, and calibrating the verdict to evidence, including when no defect is established.
compatibility: opencode
metadata:
  role: debugging
---

# Ponytail Diag

Find out what actually happened, why it happened, and what evidence would distinguish the remaining explanations. Do not force a root-cause verdict merely because the user reported a problem.

## Diagnostic procedure

1. **Define the contract.** Write the expected behaviour, observed behaviour, relevant input, environment/revision and source of each fact. If expected behaviour is unspecified, identify that gap.
2. **Inspect the real path.** Start at the entry point and relevant callers. Follow branch conditions, state mutations, errors, resource lifetime, synchronisation and the final observable result. Read implementations and call sites, not just names or comments.
3. **Reproduce or localise.** If tools and permissions are available, run the smallest relevant reproducer or test. Compare expected and actual intermediate values. Find the earliest evidenced divergence, then investigate whether an earlier operation caused it. If execution is unavailable, state that clearly.
4. **Keep live hypotheses.** Maintain up to four plausible explanations. For each, list supporting evidence, contradictory evidence, and one observation that would distinguish it. Remove a hypothesis when evidence falsifies it.
5. **Choose a discriminating probe.** Predict the outcomes before running it. Prefer a safe, reversible, low-cost experiment that separates the leading hypotheses. Run it when possible. A repeated symptom is not necessarily a causal test.
6. **Calibrate the verdict.** Use the strongest status justified by evidence. Do not upgrade static suspicion to an executed result or turn absence of evidence into proof of absence.

## Verdict rules

- **CONFIRMED:** a reproducer plus a discriminating test, controlled intervention, or equivalent direct evidence establishes the causal explanation.
- **SUPPORTED:** source, contract or runtime evidence strongly supports the explanation, but a causal experiment or necessary validation remains unavailable.
- **UNRESOLVED:** multiple explanations remain viable, evidence conflicts, or the first divergence is not yet localised.
- **NO DEFECT ESTABLISHED:** the supplied evidence does not show a violated requirement. State what evidence or contract would be needed next.
- **FALSIFIED:** the specific allegation is contradicted by reliable evidence. Do not generalise this into proof that the whole system is defect-free.
- **BLOCKED:** a required file, target, permission, reproduction or environment is unavailable.

Use ROOT CAUSE only for CONFIRMED. For SUPPORTED or UNRESOLVED, use LEADING EXPLANATION or LIVE HYPOTHESES. Never invent file/line references, branch outcomes, command output, test results or benchmark numbers.

## Default output

Keep the answer compact, but diagnostically useful:

~~~text
VERDICT: <status>
OBSERVED: <facts and source>
EXPLANATION: <confirmed cause, supported explanation, or ranked live hypotheses>
EVIDENCE: <tests/commands actually run and their result, or NOT RUN with reason>
NEXT PROBE: <exact experiment and predicted outcomes>
FIX: <only if justified; otherwise NONE or candidate only>
~~~

Omit empty fields. For a one-line request, compress the same information without changing the verdict status. When asked to show work, include the call/data flow, contract, branch values that are actually known, hypothesis table, distinguishing test and result. Use a truth table only when interacting conditions matter; use fault trees, fishbone or 5 Whys only when they address a specific unresolved question. Load [conditional diagnostic methods](references/deep-diagnostic-templates.md) only when the selected method needs a template or extended procedure.

## Handoff and boundaries

Do not modify code in diagnostic mode. When a cause is confirmed, hand the reproducer, causal evidence, violated contract and smallest fix direction to debug-fix, then ask debug-verify to validate any patch. A candidate fix is not a confirmed cause until evidence supports it.

Evidence gate: tie claims to source/runtime evidence; mark unrun checks honestly. Distinguish expected from observed behaviour, static analysis from execution, correlation from causation, and estimated values from measurements. Do not claim that hidden reasoning costs zero tokens; keep the visible report concise instead.
