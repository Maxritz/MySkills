# Debug Core: Instrumentation and Escalation

Load only when the default loop stalls or the evidence needs richer instrumentation. Do not use every technique on every issue.

## Instrumentation (When Needed)

Instrument the relevant failure path only when existing observations cannot distinguish the live hypotheses. Trace the entry, branch decisions, state transitions and exits needed to answer the diagnostic question; do not add logging mechanically to every function.
```c
#define DBG_TRACE(fmt, ...) fprintf(stderr, "[T] %s:%d %s: " fmt "\n", __FILE__, __LINE__, __func__, ##__VA_ARGS__)
#define DBG_ASSERT(cond) do { if(!(cond)) { DBG_TRACE("ASSERT: %s", #cond); abort(); } } while(0)
```
Mark branches: `DBG_TRACE("path=A: n<32 -> skip quant")`.

## Truth Table Escalation (When Fast Loop Stalls)

Tag every conditional branch with [T] or [F] based on DBG_TRACE:

```
FUNCTION: parse_token()
  if (!buf)            [F] -> ERR_NULL   (trace: buf=NULL)
  if (len < 4)         [T] -> continue    (trace: len=1024)
  if (buf[0]!=MAGIC)   [F] -> ERR_BAD    (trace: buf[0]=0x00, expected 0x46)
```

| Branch | Cond | T | F | Observed | Result |
|--------|------|---|---|----------|--------|
| buf    |!buf  |   | X | NULL     | FAIL   |
| len    |<4    | X |   | 1024     | PASS   |
| magic  |!=M   |   | X | 0x00     | FAIL   |

First [F] = root cause candidate. @see debug-deep to validate.
