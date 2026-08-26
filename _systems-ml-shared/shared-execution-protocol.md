# Shared execution protocol

Use this protocol only when the task requires implementation work. First state the target, host, constraints, and acceptance evidence. Then identify the smallest boundary that can be changed, choose the least invasive design, implement the change, and run the narrowest decisive validation before broadening the test. Keep FACT, HYPOTHESIS, RESULT, and CONCLUSION separate. Never claim a build, test, benchmark, conversion, or compatibility result that was not executed or directly verified. Load `implementation-integrity` for code generation or repair; load `code-contract-comments` when public behavior or non-obvious invariants need documentation.

## Conditional references

Read only the named reference when its topic is active. Do not load every reference in this directory. For cross-platform work, add `porting-change-isolation`; for build-target changes, add `cross-compilation` and `toolchains`; for memory/ABI issues, add `memory-management` and `x86-architecture` only when evidence requires them.
