# Debug Domain Router: Specialist Profiles

Read a specialist's front-matter first; then load only the specialist whose uncertainty is unresolved. These descriptions summarise routing intent, not replacements for the full specialist instructions.

## Specialization Skills (Minimal Profiles)

### debug-localize (C/C++/Systems)
- **Model:** `INPUT → STATE → TRANSFORMATION → OUTPUT`
- **Probe:** Coarse boundaries first, bisect failing region
- **Track:** Failure boundary / Causal boundary / First bad write
- **Checkpoint:** Compare intermediate outputs (pipelines) or state before/after transitions (stateful)

### debug-reference (Reference Comparison)
- **Ladder:** 0: Spec/math → 1: Known-good I/O → 2: Known-good component → 3: Trusted impl → 4: Trusted E2E
- **Normalize:** Inputs, config, precision, ordering, seeds, versions, tolerances
- **Compare:** Intermediate states, not just final output

### debug-invariants (Contract Checking)
- **Ask:** What must always be true of inputs/state/outputs?
- **Rules:** Ownership, lifetime, bounds, type
- **Use only if:** Eliminates a live hypothesis. Reference comparison preferred if cheaper.

### debug-mde (Minimum Distinguishing Experiment)
- **Prefer:** Safe, reversible, cheap, deterministic, minimally invasive, predictive
- **Typical:** Disable one transform, replace dep with controlled value, compare to reference, reduce input dimension, repeat for nondeterminism

### debug-reproduce (Minimal Reproducer)
- **Capture:** Exact input/invocation, expected vs actual
- **Determine:** Deterministic vs intermittent
- **Reduce:** Preserve failure while shrinking input/state/deps

### debug-root-cause (Causal Chain)
- **Chain:** `failure → first bad state → triggering operation → violated expectation → defect`
- **Confidence:** suspected → supported → confirmed → regression-confirmed
- **Confirmed only when:** Fix demonstrably removes failure under relevant tests
