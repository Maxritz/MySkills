# MySkills runtime instructions

For each new substantive user task, call the `myskills_route` tool before using repository tools. Pass the current request as `task`. The tool deterministically selects a small set of specialist skills and returns their full core instructions, plus an explicitly approximate context-size estimate.

Use the selected skill instructions. Read linked `references/` files only when a selected procedure needs the added detail. The router output reports selected core bytes and a rough tokens estimate, not actual provider token usage.

For a task that changes source code or implementation, the router must select and return `code-quality-gate`. The runtime blocks common source-mutation tools unless that skill was selected. This is a workflow guard, not a security boundary: shell commands and external tools can still mutate files in ways a static detector cannot recognise.

Native OpenCode skill discovery is configured through `skills: ["./"]` in `opencode.jsonc`. Do not treat custom front-matter metadata as automatic routing, automatic loading or unloading. OpenCode keeps loaded skill content in conversation context; there is no guarantee that an earlier skill body can be removed on demand. Keep context lean by routing only a few cores and reading references on demand.

Do not claim diagnosis, test execution, token usage or code correctness without corresponding evidence. Distinguish observed facts, hypotheses, executed results and unresolved questions. When evidence does not establish a defect, say so plainly.
