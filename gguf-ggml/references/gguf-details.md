# GGUF & GGML: Detailed Format and Kernel Notes

Load for exact metadata/tensor structure and quantisation operation details. Confirm file and quant type against the pinned GGML implementation; do not use a generic layout assumption across types.

## GGUF file structure

The GGUF format starts with the four ASCII bytes \`GGUF\`, followed by a version and counts for tensors and metadata key/value entries. Metadata entries encode a key, a value type and a typed value. Tensor descriptors encode the name, dimensions, tensor type and data offset. Tensor payload data follows the descriptors and is aligned according to the file's alignment metadata or the format default.

Consult the pinned upstream specification and header for exact field widths, byte order, version support and alignment rules:
- https://github.com/ggml-org/ggml/blob/master/docs/gguf.md
- https://github.com/ggml-org/llama.cpp/blob/master/ggml/include/gguf.h
- https://github.com/ggml-org/llama.cpp/wiki/Tensor-Encoding-Schemes

The bytes on disk are authoritative. On a little-endian host the byte sequence \`GGUF\` corresponds to integer value \`0x46554747\` if read as a little-endian 32-bit integer. Prefer comparing the four raw bytes or use a named, endian-explicit helper rather than an ambiguous integer literal.

## Safe parsing

1. Validate the magic bytes and supported version before interpreting later fields.
2. Use checked reads with explicit bounds. Do not advance offsets until the current field has been proven to fit.
3. Validate counts, lengths, ranks, dimension products, string lengths, array lengths and allocation sizes with checked arithmetic.
4. Reject invalid enum/type IDs, impossible dimensions, offsets outside the file, overlapping or misaligned regions when disallowed, and truncated payloads.
5. Verify that every tensor's computed storage requirement fits within its declared data region and file size.
6. Validate UTF-8/ASCII constraints where the format requires them.
7. Treat metadata as untrusted and bound memory, recursion, element counts and parsing time.
8. Map or stream large files only after checking size, lifetime and range semantics.
9. Preserve unknown metadata safely when forward compatibility requires it; do not invent defaults for required model semantics.

## Quantisation and tensor operations

- Look up each quantisation type's enum, block size, encoded byte size, scale/minimum representation and dequantisation formula in the pinned version's source.
- Do not assume the nominal bit width equals storage bits per weight. Block metadata and alignment add overhead.
- Do not assume all formats with a similar name share a layout across revisions.
- For each supported type, test block-size boundaries, zero scales, extreme code values, negative values, tail handling and alignment.
- Compare dequantised values to a trusted implementation, then compare operator outputs and logits where the runtime uses these tensors.
- Keep format parsing separate from numerical kernels so parser failures and numerical mismatches can be localised independently.
