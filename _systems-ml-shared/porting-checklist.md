# Porting checklist

Freeze observable behavior and ABI first. Build a host/target capability matrix. Isolate platform code behind an adapter or narrow interface. Preserve ownership, alignment, ordering, synchronization, numeric precision, and error semantics. Compile with warnings-as-errors where practical, run differential tests against the reference target, and record unsupported capabilities explicitly instead of silently emulating them.
