---
name: graduate-prototype
description: Turn a validated prototype into real work that follows the standard development cycle. Confirms the requester approved it, shapes the slice and user stories from what was approved, lists everything the prototype faked or skipped, and creates the tracker tasks to build it properly (build, review, security, QA) with owners and dependencies. Use after a prototype's verdict is Validated, or when asked to productionize, harden, graduate or "make real" a prototype.
---

# Graduate a prototype

A validated prototype proves the idea is worth building. It proves nothing about the code: that was written with no tests, no standards, no error handling and faked data, on purpose. This skill is the bridge back to the normal process. You plan and delegate here; you do not build.

## Guards

- **Only a validated prototype graduates.** `prototypes/<folder>/README.md` must have a Verdict of Validated, given by the person who asked for it, in their words. If it says Pending, Change it or Rejected, or you would be the one validating your own prototype, stop and say what is missing.
- **Prototype code is rewritten, never promoted.** The one exception is a pure logic module the prototype isolated on purpose (see the prototype skill's logic reference); it may be lifted, and then gets tests like any other code.
- **You do not verify the result.** Whoever builds does not review or QA their own work.

## Process

### 1. Read the evidence

Read the prototype's README (question, what to look at, known shortcuts, verdict) and the prototype itself. From the verdict, write down exactly what was approved: which variant or view, which behaviours, and anything the requester said to change or drop. If the verdict approves "the idea" without saying which variant or behaviour, ask one question before going further; with nobody present, post the question to the tracker task and stop.

### 2. Shape the slice and stories

Run the shape-slice skill with the prototype as its input ("From a validated prototype" in that skill). It writes the slice with `prototype: prototypes/<folder>` and the user stories for the behaviour the requester saw and accepted. If the approved scope is too big to demo as one thin piece, shape two or three slices in the order they should ship, and say why.

### 3. List the gaps

The prototype skipped things on purpose. Go through this list and write down, for this prototype, what is missing. Use its Known shortcuts section as the starting point, then check the rest:

- **Data:** what was hard-coded, sampled or invented, and where the real data comes from.
- **Integration:** where it has to live in the real app (routes, navigation, layout, existing state), instead of a standalone page or throwaway route.
- **States:** loading, empty, error, slow network, and anything that should be impossible.
- **Standards:** which entries in `agent-os/standards/index.yml` apply.
- **Accessibility and devices:** keyboard, screen reader labels, reduced motion, small screens.
- **Performance:** anything the prototype did naively that will not survive real data sizes.
- **Security and privacy:** input handling, permissions, secrets, third parties (at production level this becomes a security review task).
- **Tests:** unit tests for the logic, and the story tests verify-stories will harden.
- **Observability and content:** analytics, copy, translations, if the product uses them.
- **Cleanup:** remove the throwaway route, if the prototype added one.

Put the gaps that change what the user gets into the stories as acceptance criteria (edge criteria at production level; see the write-user-stories skill's `references/testing-levels.md`). Put the rest in the plan. Record under the slice's Decisions anything you are deliberately leaving out, and why.

### 4. Create the tasks

Read the shape-slice skill's `references/trackers.md`, and use the tracker's own skill and its guidance on turning plans into tasks. Create a task only where there is a real boundary: a different owner, a real prerequisite, or an independent check. A plan's steps do not each become a task. The standard cycle gives this shape:

| Task | Owner | Depends on |
|---|---|---|
| Build the slice, properly, from the slice and stories | the builder for that area | nothing, or an earlier slice |
| Supply the real data or backend the build needs (only if someone else owns it) | that owner | nothing |
| Code review against standards and the slice (code-review skill) | someone other than the builder | build |
| Security review of the changed code (production level, security-audit skill) | the security role | build |
| QA: verify the slice's stories and merge the slice branch (verify-stories skill, merge gate) | the QA role | build and review |

Rules for every task:

- **Self-contained.** Start with the slice path, the story IDs and the prototype path, then the scope of this task and what done looks like. The reader may not be able to see your task or its documents, but can read the repository.
- **Say it is a rewrite.** The build task states that the prototype is a reference for behaviour only.
- **Real dependencies only**, set through the tracker's dependency mechanism, not in prose. Independent work starts now.
- **One branch per slice** where the tracker supports isolated workspaces: the first code task gets a new workspace, later code and review tasks reuse it, and the QA task runs in the main checkout and names the branch. See `references/trackers.md` in the shape-slice skill, under Branches, commits and the QA merge gate.
- Check which agents or people exist before assigning. If a role is missing, say so instead of giving the work to the builder.
- If the tracker needs the requester's approval before work starts, ask for it there; do not add approval gates of your own.

Without a tracker: write the same items as the slice's `## Plan` checklist, in order, each with its owner.

### 5. Close the loop

- Save the plan where the tracker keeps plans, starting with the slice path and story IDs.
- Set the slice's `tracker:` to the task that owns the slice.
- Fill in the prototype README's Derived work section: slice IDs, story IDs and task IDs.
- Tell the requester in a few lines: what was approved, the slice, the tasks with their owners and order, what you deliberately left out, and that the prototype itself stays in `prototypes/` as the record.

The slice is done when its stories are verified by QA, not when the build task closes.
