---
name: git-workflow
description: Make safe, reviewable repository changes with explicit branch bases, scoped diffs, traceable commits and honest pull-request status.
compatibility: opencode
---

# Git Workflow

Keep changes isolated, inspectable and reversible. Never infer repository state from a command that was not executed or from a stale snapshot.

## Before editing

1. Inspect repository root, branch, working-tree status, target revision and project instructions.
2. Identify user changes and generated/untracked files. Do not overwrite or discard unrelated work.
3. Create or select an authorised working branch from the intended base; record the base commit.
4. Limit scope to the requested change and its required tests, docs, configuration and registration.

## During editing

- Inspect the diff after each coherent batch and search for duplicate implementations, stale references and accidental generated artefacts.
- Preserve line endings, file modes, submodules and symlink semantics when relevant.
- Resolve conflicts by understanding both sides. Never choose theirs/ours wholesale without comparing intent.
- Avoid destructive reset, clean, force-push or history rewrite unless explicitly authorised and the exact target is known.
- Ensure secrets, local paths, build outputs and credentials are not committed.
- Commit messages should describe observable intent; split unrelated changes.

## Before publishing

- Check diff against the base, changed-file list, whitespace, tests, generated registration and untracked paths.
- Verify the commit SHA and branch ref actually advanced.
- For a pull request, confirm base/head, open/merged state, checks and changed-file scope from the remote result.
- Do not claim push, CI pass, review or merge until the remote system reports that state.
- If tools or permissions block publication, provide the exact local changes and state the blocker.

## Output

Report branch/base, files changed, validation performed, commit/PR URLs and unresolved issues. Keep source-reviewed, locally tested, CI-tested and merged states distinct.

## Goli-mat-de integrity gate

Compare requested scope to the final diff and remote branch head. A commit created locally or a plan to publish is not evidence that changes reached the remote repository.
