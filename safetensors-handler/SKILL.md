---
name: safetensors-handler
description: "SafeTensors: JSON header, mmap, dtype validation."
license: MIT
compatibility: opencode
---

# SafeTensors Development

## Format Specification

- File layout: `header_size (8 bytes, little-endian u64)` + `header_json (header_size bytes)` + `tensor_data`.
- Header JSON: `{"tensor_name": {"dtype": "F32", "shape": [1024, 768], "data_offsets": [0, 3145728]}, ...}`.
- `data_offsets[0]` = offset from first byte after header. `data_offsets[1]` = end of tensor.
- **No arbitrary code execution** — unlike PyTorch pickle files.

## Security (untrusted files)

```python
# NEVER execute or eval header content
# Header is JSON string, parse with json.loads — never pickle

# Validate offsets
assert data_offsets[0] < data_offsets[1]  # monotonic
assert data_offsets[1] <= file_size - header_size  # within file
assert data_offsets[0] % alignment == 0  # aligned

# Validate dtype
VALID_DTYPES = {"F64", "F32", "F16", "BF16", "I64", "I32", "I16", "I8", "BOOL", "UINT1B"}
assert dtype in VALID_DTYPES
```

## Memory Mapping

```python
import numpy as np
import json

def load_safetensors(fn):
    with open(fn, 'rb') as f:
        header_size = int.from_bytes(f.read(8), 'little')
        header = json.loads(f.read(header_size))
        offset = header_size + 8
        for name, info in header.items():
            start = offset + info['data_offsets'][0]
            end = offset + info['data_offsets'][1]
            tensor = np.memmap(fn, dtype=info['dtype'].lower(),
                              mode='r', offset=start,
                              shape=tuple(info['shape']))
            yield name, tensor
```

## Tensor Validation

- Shape: product of dims must match `(offset_end - offset_start) / bytes_per_element`.
- Dtype to bytes: F32=4, F16=2, BF16=2, I32=4, I64=8, BOOL=1, UINT1B=1.
- No negative dimensions. No dimension product overflow (`size_t` check).
- Shared tensors: same `data_offsets` — reference counted, only load once.

## Safe Loading Checklist

- [ ] Parse header size as `uint64_t`, check `header_size <= file_size - 8`.
- [ ] Parse header JSON with strict parser (no comments, no eval).
- [ ] Validate all `data_offsets` are within `[0, total_data_size]`.
- [ ] Validate all dtypes against known set.
- [ ] Validate all shapes produce correct tensor sizes.
- [ ] Check for duplicate or overlapping data regions.
- [ ] Memory-map (read-only) — never write back to model files.
