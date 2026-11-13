---
name: diagnose-bug
description: Disciplined loop for hard, intermittent or unexplained bugs and failing or flaky tests. Builds a fast pass or fail signal for the exact symptom before forming any theory, then reproduces, isolates, fixes and guards. Use when something is broken, failing, flaky or slow and the cause is not obvious, or when a first fix did not hold.
---

# Diagnose a bug

Skip phases only when you can say why.

Never show secrets. Replace them with `<REDACTED>` in any command, output or artifact you quote.

## Phase 1: build a feedback loop

**This is the skill.** With a tight pass or fail signal for this bug, you will find the cause. Without one, reading code will not save you.

Ways to build one, roughly in this order:

1. A failing test at whatever level reaches the bug: unit, integration, end to end.
2. An HTTP request or script against the running app.
3. A command with a fixed input, compared with a known good output.
4. A headless browser script that drives the UI and asserts on what is rendered (see the verify-stories skill's `references/browser-tools.md`, including the note on sandboxed runs).
5. Replaying a captured request, payload or log through the code path.
6. A minimal harness that calls the suspect code directly.
7. A loop over many inputs or repetitions, when the bug is "sometimes".
8. An old against new comparison, when it worked before.

Then tighten it: faster, sharper (assert the exact symptom, not "did not crash"), more deterministic (pin time, seed randomness, wait on real conditions instead of fixed delays).

**Intermittent bugs:** the goal is a higher reproduction rate, not a clean repro. Repeat the trigger, add load, narrow the timing. Record the rate as a count (for example 2 of 3 runs). A pass that happens some of the time is a failure.

Phase 1 is done when you can name **one command you have already run** that goes red on this bug, gives the same verdict each run (or a stated rate), and takes seconds. If you catch yourself building a theory before that command exists, stop. If you cannot build a loop, say so, list what you tried, and ask for what would make one possible.

## Phase 2: reproduce and minimise

Run the loop and watch it fail with the reported symptom, not a different one. Shrink the input, the steps and the code path until removing anything else makes it pass.

## Phase 3: hypothesise and test

Write down up to three candidate causes, each with a prediction that would prove it wrong. Test the cheapest first. Change one thing at a time. Add temporary logging at the boundaries you are unsure of, and remove it afterwards.

## Phase 4: fix the cause

Fix the cause, not the symptom. If the honest fix is larger than the task, say so rather than papering over it. Never weaken or delete a test, an assertion or a story to get to green; if the expected behaviour is wrong, that is a decision for whoever owns the story.

## Phase 5: prove it and guard it

- Run the loop: it is green. For an intermittent bug, run it enough times that the old rate would have shown.
- Run the wider tests to check nothing else broke.
- Keep the loop as a regression test when it is cheap to keep. If a user story covers the behaviour, tag the test with its ID.

## Phase 6: report

Symptom, cause, fix, how it was proven (the command and its result), and what is still unknown. You do not mark a user story verified for your own fix: that is the verify-stories skill's call, made by whoever does QA.

Adapted from the `diagnosing-bugs` skill in mattpocock/skills (MIT), see `THIRD_PARTY.md`.
