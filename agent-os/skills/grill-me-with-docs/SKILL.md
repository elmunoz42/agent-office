---
name: grill-me-with-docs
description: Relentlessly interview the user or the board about a plan, idea or design until every decision is settled, and write down what gets settled as you go (glossary terms and decision records). Use when asked to "grill me", stress-test or pressure-test a plan, before committing to a large or hard-to-reverse piece of work, or when the vocabulary around a feature is fuzzy. Works live in chat and across several rounds on a tracker task.
---

# Grill me, with docs

Interview the requester until you share one understanding of the plan, and leave that understanding written down. Two jobs at once:

1. **Grilling:** find every decision the plan depends on and get each one settled.
2. **Docs:** the moment a term or a decision is settled, record it, so the next agent does not have to ask again.

You ask; they decide. **Finding facts is your job, never theirs.** If a question can be answered from the repository, the product docs, the tracker or the running app, look it up yourself and do not ask.

## The design tree

Treat the plan as a tree: each decision opens the decisions that hang off it. The **frontier** is every question whose prerequisites are already settled, the ones you can ask now without guessing at answers you have not heard.

Work in **rounds**. Each round, ask the whole frontier at once, numbered, each with your recommended answer, worded so that "yes" accepts the recommendation:

```
Q1. {short title}: {the question, with the options if there are several}
Recommended: {your answer and the one line reason}

Q2. ...
```

A question that depends on another question still open in this round belongs to a later round. After the answers come back, recompute the frontier and ask the next round. Push back when an answer conflicts with an earlier one, with the glossary, or with what the code actually does.

Keep rounds answerable: about five questions, ten at most. The session is done when the frontier is empty, every branch visited and nothing silently assumed. Then summarise the settled plan in a few lines and ask for a final confirmation. Do not act on the plan before that.

## Live or across rounds

- **Live** (a person is in the conversation): ask a round, wait, continue.
- **On a tracker task with nobody present** (for example a Paperclip issue): a round is one comment. Post it, keep the full state in the task document `grilling` (settled decisions, open questions, what each open question is waiting on), leave the task in review, and end your turn. When an answer arrives, read `grilling` first, record what was settled, and post the next round. Never answer your own questions to keep moving.

Use the tracker's own skill for comments and documents; see the shape-slice skill's `references/trackers.md`.

## Docs as you go

Read [references/docs-format.md](references/docs-format.md) before writing either file.

- **Glossary:** `agent-os/product/glossary.md`. When a term is settled, add or correct it right then, not at the end. Challenge vague or overloaded words ("you say account: the customer or the login?") and words that conflict with the glossary. It holds meanings only, never implementation.
- **Decision records:** `agent-os/decisions/NNNN-short-slug.md`. Write one only when a decision is hard to reverse, would surprise a future reader, and came from a real trade-off. Most decisions do not qualify; those belong in the slice's Decisions section.

Create each file the first time there is something to put in it.

## Afterwards

If the grilling settled a piece of work, the next step is the shape-slice skill, with the settled decisions as its input. If it showed that the idea needs to be seen or felt before deciding, suggest the prototype skill instead.

Adapted from the `grill-with-docs`, `grilling` and `domain-modeling` skills in mattpocock/skills (MIT), see `THIRD_PARTY.md`.
