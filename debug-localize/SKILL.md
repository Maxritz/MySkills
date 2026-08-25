---
name: debug-localize
description: "Earliest boundary where behavior goes wrong."
compatibility: opencode
metadata:
  role: debugging
  loading: on-demand
---

## Model
`INPUT -> STATE -> TRANSFORMATION -> OUTPUT`

Probe coarse boundaries first, then bisect the failing region.

Track separately:
- failure boundary: first visible wrong result;
- causal boundary: earliest operation that caused corruption;
- first bad write: earliest invalid mutation when memory/state corruption is suspected.

For pipelines, checkpoint and compare intermediate outputs. For stateful systems, compare state before/after transitions.
