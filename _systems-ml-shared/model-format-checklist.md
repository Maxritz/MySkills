# Model artifact checklist

Validate magic/version/header bounds, tensor names and shapes, dtype/device mapping, alignment, offsets, shard completeness, checksums where available, tokenizer/config consistency, and numerical equivalence on a small deterministic fixture. Treat model files as untrusted input: parse with bounds checks and never execute embedded data as code.
