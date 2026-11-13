---
name: code-review
description: Review a set of code changes on two axes, the project's standards and what the slice and its user stories asked for, and report findings by severity. Use when asked to review changes, a branch, uncommitted work or another agent's implementation, and before a slice is handed to QA.
---

# Code review

Review the change, not the author. Two separate questions:

- **Standards:** does the code follow this project's documented standards?
- **Intent:** does it do what the slice and its stories asked for, and nothing else?

You report; you do not fix, unless the task says to. Never review your own work as if it were independent: say so if you wrote it.

## Process

### 1. Pin what is being reviewed

Use the range you were given (a commit, branch or "since X"). If there is none, review the uncommitted changes. Get the file list and the diff with git (`git diff <base>...HEAD`, or `git status --short` and `git diff` for uncommitted work, including new untracked files). If git is unavailable, say so and review the files named in the task.

Stop if the change is empty.

### 2. Find the intent

In this order: the slice named in the task or whose `tracker:` matches the task (`agent-os/slices/`), its user stories (`agent-os/user-stories/`), then the tracker task itself. If there is none, say "no stated intent" and review standards only.

### 3. Find the standards

Read `agent-os/standards/index.yml` and open the standards that match the changed files. Add any contributing guide the repository has. Skip anything a linter or type checker already enforces.

### 4. Review each axis on its own

Do the standards pass, write its findings down, then do the intent pass, so one does not colour the other.

**Standards.** Check the diff against each relevant standard. Where the project documents nothing, apply this baseline as judgement calls, never as hard rules:

- names that do not say what the thing does or holds;
- the same logic shape repeated in the change;
- a function that reaches into another object's data more than its own;
- the same few values always travelling together, wanting to be a type;
- a primitive standing in for a domain concept;
- one logical change scattered across many files, or one file changed for unrelated reasons;
- abstraction, parameters or hooks the intent does not need;
- dead code, leftover debugging, commented-out blocks.

**Intent.** For each acceptance criterion: is it implemented, and where? Then the reverse: what in the diff serves no criterion and no stated scope? Check that out-of-scope items stayed out, that existing tests were not weakened or deleted to pass, and that nothing prototype-grade (`prototypes/`) was promoted into product code.

If you run the app or its browser tests as part of the review, first confirm the served app is built from the commit you are reviewing (see the verify-stories skill's `references/browser-tools.md`); otherwise report the browser result as not run.

At production level, with the security-audit skill installed, note that a focused security review is still due; do not substitute for it.

### 5. Report

```markdown
# Review: {slice or task}

Reviewed: {range or "uncommitted changes"} up to commit {hash}, {n} files. Intent: {slice and stories, or none}.

## Must fix
- `path:line` {what is wrong, why it matters, what would fix it} (standards: api/errors | intent: US-012 AC2)

## Should fix
- ...

## Notes
- ...

## Verdict
{Ready for QA | Changes needed}, in one sentence.
```

If there is nothing to review yet (an empty diff, or the build is not committed), say so and give no verdict rather than "changes needed", so nobody mistakes it for a review of the code.

Order by severity, cite file and line, and separate what you verified from what you suspect. An empty section is fine; do not pad.

With a tracker task, post the report there using the tracker's own skill (see the shape-slice skill's `references/trackers.md`). An adverse verdict goes on your review task, and the owner of the build task is told what to fix. Do not change their task's status.

Adapted from the `code-review` skill in mattpocock/skills (MIT), see `THIRD_PARTY.md`.
