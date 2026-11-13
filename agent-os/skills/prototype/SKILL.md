---
name: prototype
description: Build a throwaway prototype to answer a product or design question fast, skipping the normal Agent OS process (no slice, stories, standards or tests first). Use when the product lead or the user wants a first pass at an idea, wants to feel whether a flow, state model or screen is right, or says "prototype", "spike" or "just try it". Slices and stories are derived afterwards, only if the prototype is validated.
---

# Prototype

A prototype is **throwaway code that answers a question**. It is the one sanctioned way to skip the Agent OS process: no slice, no user stories, no standards pass, no tests, no QA. That is safe only because of two rules:

1. **Nothing in a prototype ships.** It lives in `prototypes/`, never in the product's real code paths.
2. **You do not validate your own prototype.** The person who asked (the board or the user) decides. Until they do, the idea is unproven.

Use this for a first pass at an idea. If the work is already understood and just needs building, use the shape-slice skill instead.

## Process

### 1. State the question

Write one paragraph: the idea, the question the prototype must answer, and what would count as "yes" and "no". If you cannot name a question, ask one clarifying question, or pick the most likely one and say so. A prototype that answers the wrong question is pure waste.

### 2. Pick the shape

- **"Does this flow, logic or state model feel right?"** Read [references/logic.md](references/logic.md): one self-contained HTML file that anyone can open and click through.
- **"What should this look like?"** Read [references/ui.md](references/ui.md): a few radically different variants on a throwaway route.

If it is ambiguous and nobody is around to ask, choose the shape that fits the question best and state the assumption at the top of the prototype.

### 3. Build it in `prototypes/`

Create `prototypes/YYYY-MM-DD-short-slug/` at the project root with:

- the prototype itself;
- `README.md` using the template below.

Rules:

- **Do not edit existing application code, routes, tests, stories or slices.** A UI prototype may add one throwaway route whose path contains `prototype` (see the UI reference); it changes nothing else.
- **Trivial to run.** One file to open, or one command. Say exactly how in the README.
- **No persistence, no real mutations.** State lives in memory; stub anything that would write.
- **Skip the polish.** No tests, no abstractions, no error handling beyond what makes it run.
- **Surface the state.** After every action or variant switch, show what changed.
- Do not commit prototype code to the main branch unless asked. If the project uses git and you were asked to keep it, commit `prototypes/` only.

### 4. Hand it over for validation

Tell the requester, in a few lines: the question, how to open or run it, what to look for, and what you are unsure about. Then stop and wait for their verdict.

- With a tracker task (see the shape-slice skill's `references/trackers.md`): post that as a comment, leave the task in review, and where the tracker supports a confirmation request, ask for one. Do not mark the task done.
- Without a tracker: say it in chat.

### 5. Record the verdict

When the requester answers, fill in the README's Verdict section with their decision in their words, and the date. Three outcomes:

- **Validated:** go to step 6.
- **Change it:** adjust the prototype (prototypes evolve) and hand it over again.
- **Rejected:** record why. Leave the folder in place; a rejected idea with its reasons is worth keeping. Nothing else changes.

### 6. Derive the real work (validated only)

Now, and only now, the normal process starts. Run the graduate-prototype skill: it shapes the slice (`prototype: prototypes/<folder>`) and user stories from what the requester actually approved, lists everything the prototype faked or skipped, and creates the build, review and QA tasks. If that skill is not available to you, run shape-slice with the prototype as its input and hand the slice to whoever plans the work.

**Never promote prototype code.** It was written without tests, standards or error handling. The build may lift a pure logic module that the prototype isolated on purpose, and must rewrite everything else.

## README template

```markdown
# Prototype: {idea in a few words}

- Date: 2026-11-12
- Asked by: {who}
- Built by: {who}
- Tracker: {task ID, or none}

## Question

{What this prototype is meant to answer, and what yes and no look like.}

## How to run

{One file to open or one command.}

## What to look at

- {the two or three things worth trying}

## Known shortcuts

- {what is faked, stubbed or missing}

## Verdict

Pending. {Replace with: Validated | Change it | Rejected, by whom, date, and their reasons in their words.}

## Derived work

{After validation: slice ID and story IDs.}
```

Adapted from the `prototype` skill in mattpocock/skills (MIT), see `THIRD_PARTY.md`.
