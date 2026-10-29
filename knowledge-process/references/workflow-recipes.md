# Workflow Recipes (Optional)

These are templates, not proof that any command, path or test exists in the current project. Use selectively.

## Investigation event

    timestamp:
    task_id:
    source_revision:
    event_type: observation | hypothesis | decision | change | test | blocker
    scope:
    statement:
    evidence: path, command/output excerpt or source link
    confidence:
    follow_up:

Append corrections as new events rather than silently rewriting history.

## Context and handoff

    OBJECTIVE:
    ACCEPTANCE CONDITION:
    CURRENT REVISION:
    CONFIRMED FACTS:
    DECISIONS AND RATIONALE:
    FILES CHANGED:
    CHECKS: command / PASS|FAIL|BLOCKED|NOT RUN / observed result
    OPEN RISKS:
    NOT INSPECTED:
    NEXT ACTION:

Omit secrets, personal data and verbose transcripts that add no useful context.

## Reusable knowledge record

    topic:
    environment/version:
    symptom and reproduction:
    verified cause:
    correction:
    regression test:
    evidence/provenance:
    confidence: verified | probable | hypothesis
    known limitations:
    last verified revision:

Keep private/local stores outside source control unless a sanitised, reviewed fixture is explicitly required. Use atomic write/replace and schema validation for automated updates.

## Risk-based verification plan

| Change/risk | Minimum useful evidence | Add when justified |
|---|---|---|
| Docs or formatting | Link/schema/format checks | Docs render/build |
| Local logic | Targeted unit and boundary test | Property/differential test |
| Public API or module wiring | Clean compile and real entry-point test | Integration, ABI and migration tests |
| Parser/untrusted input | Malformed-input and bounds tests | Fuzzing and sanitizers |
| Concurrent/resource lifecycle | Cancellation, failure cleanup and repeated run | Race detector, stress, fault injection |
| CPU/GPU kernel | Reference comparison on edge shapes | Sanitizer, native target, repeated benchmark |
| Release/deployment | Package/install and smoke test | Canary, rollback and recovery test |

Do not require every row for every patch. Do not skip a high-risk check merely because it is expensive; state what is blocked and what remains unverified.

## Sanitisation

Remove secrets, authorization headers, tokens, private endpoints, prompts containing personal content, account identifiers, machine names and unnecessary local paths. Prefer redacted stable labels. Review the saved record after transformation.

## Example record

    event_type: test
    statement: targeted parser regression passed
    evidence: command: project-test --case malformed_header; exit code: 0
    confidence: verified

This example is illustrative. Replace the command/result with actual evidence before storing it as a real event.
