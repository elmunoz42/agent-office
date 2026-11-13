---
name: shape-slice
description: Shape a piece of work into a slice, a short file in agent-os/slices/ that says what a user gets and why, links its user stories, and points to the task in the project tracker (such as a Paperclip issue) where the plan and status live. Use when the user runs /shape-slice, asks to plan or scope a feature before building it, or when a tracker task needs shaping.
---

# Shape Slice

A **slice** is one thin, end to end piece of user value. Its file in `agent-os/slices/` is deliberately short. It answers what and why, and links to everything else:

| Fact | Lives in | Not in |
|---|---|---|
| What the user gets, scope, decisions | the slice file | the tracker |
| Plan, owner, status, dependencies, review | the tracker task | the slice file |
| What "working" means | user stories (`agent-os/user-stories/`) | either |

One owner per fact. Never copy the plan, task list, or status from the tracker into the slice file; link to it.

## Important Guidelines

- **Ask with your structured question tool** (AskUserQuestion in Claude Code; the ask or question tool in Cursor and Codex), or in chat if none is available. When you run unattended (for example inside a tracker run with no user present), do not ask: decide from the task text, record your assumptions under Decisions, and continue.
- **Keep it small.** If the slice needs more than about five stories or cannot be demoed on its own, split it into two slices.
- **Stay light.** A slice file is usually under 40 lines. Shaping is not documentation.
- Read `references/trackers.md` before Step 2.
- **From a validated prototype:** if the work started with the prototype skill, shape only after the requester has validated it (the Verdict in `prototypes/<folder>/README.md` says so, in their words). Take outcome, scope and decisions from what they approved, write stories for the behaviour they saw and accepted, set `prototype: prototypes/<folder>` in the slice, and note in the plan that prototype code is rewritten, not promoted. If the verdict is still pending, stop and say so.

## Process

### Step 1: Understand the work

From the request or the tracker task, establish in a sentence or two: who it is for, what they can do afterward, and what is out of scope. Ask one or two questions only if that cannot be inferred. If visuals or reference code are given, note their paths.

If `agent-os/product/` exists, skim `mission.md` and `roadmap.md` and note which goal this serves.

### Step 2: Resolve the tracker task

Follow `references/trackers.md` to find out which tracker this project uses and which task this slice belongs to:

- Already working on a tracker task (for example a Paperclip issue): that task is the slice's task. Do not create another.
- A tracker is configured but there is no task yet: create one if you can, otherwise leave `tracker:` empty and say so.
- No tracker: the slice file carries the plan itself (Step 5).

If a slice already exists for that task (search `agent-os/slices/index.yml` for the task ID), update it instead of creating a new one.

### Step 3: Pick standards

Read `agent-os/standards/index.yml` if it exists and choose the standards that apply. List their IDs in the slice; do not paste their content. Read the chosen ones so the plan respects them.

### Step 4: Link user stories

Read `agent-os/user-stories/index.yml`. Find stories this slice changes, and draft the new ones it needs, following the write-user-stories skill (`references/story-format.md`, and `references/testing-levels.md` for demo or production depth). Set `source: slice:SL-###` on new stories. Confirm the list with the user when one is present.

Every slice that changes what a user sees or does has at least one story. Pure refactors and chores may have none; say so under Decisions.

### Step 5: Write the slice and the plan

1. Next ID: highest `SL-###` in `agent-os/slices/index.yml` plus one, zero padded to three digits. IDs are never reused.
2. Write `agent-os/slices/SL-###-short-slug.md` using the format below, and add its entry to `agent-os/slices/index.yml`.
3. Write new story files and index entries.
4. The plan:
   - **With a tracker task:** save the plan where that tracker keeps plans (see `references/trackers.md`). Start the plan with the slice path and story IDs so whoever picks it up finds them. Split into separate tracker tasks only where the tracker's own guidance says to (another owner, real prerequisite, independent review), not one task per step.
   - **Without a tracker:** add a `## Plan` section with a short checklist to the slice file, and set `status: open`.
5. The plan always ends with: **verify the slice's stories** (`/verify-stories slice:SL-###`). At production level with the security-audit skill installed, a focused security review of the changed code comes before that.

Do not change application code while shaping unless the task you were given is to build the slice as well.

### Step 6: Hand off

Say in a few lines: the slice ID and path, its tracker task, the stories, and what happens next. If someone else verifies (a QA role), say that the verification step is theirs.

## Slice file format

```markdown
---
id: SL-007
title: Invite teammates by email
tracker: SPA-31            # task ID in the project tracker; empty if none
stories: [US-011, US-012]
standards: [api/response-format]
created: 2026-11-12
---

## Outcome

An owner can invite a teammate by email, and the invitee can join from the link.

## Scope

- Invite form on /team, invite email, accept flow.
- Out: bulk invites, roles other than member.

## Decisions

- Invites expire after 7 days (security review).

## References

- `src/features/password-reset/` for the emailed link pattern.
- `visuals/invite-form.png`
```

Optional frontmatter: `prototype: prototypes/<folder>` (the validated prototype this slice was derived from), `status: open | done` (only when `tracker` is empty; with a tracker task the tracker is the source of truth and this key is omitted) and `legacy_spec:` (set by the migration for slices converted from old specs).

Visuals, if any, go in `agent-os/slices/SL-###-short-slug/` next to the file.

## Index entry

```yaml
SL-007:
  file: SL-007-invite-teammates-by-email.md
  title: "Invite teammates by email"
  tracker: SPA-31
  stories: [US-011, US-012]
```

Agents read the index first and open only the slices they need.

## Legacy specs

Projects upgraded from older Agent OS versions keep their old spec folders in `agent-os/archive/specs/` (or `agent-os/specs/` if the upgrade kept them in place). Each has a slice with `status: legacy` and a `legacy_spec:` path. Read them for history; do not write new specs. To continue old work, shape a new slice and reference the legacy one.
