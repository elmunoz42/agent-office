# Trackers

A tracker is whatever system owns tasks for the project: who is doing what, in which state, blocked by what. Agent OS does not duplicate it. A slice stores one thing about the tracker: the task ID, in `tracker:`.

## Which tracker applies

1. `type:` in `agent-os/tracker.yml`, if set.
2. Otherwise, if you are running inside Paperclip (the `PAPERCLIP_API_URL` environment variable is set, or the Paperclip skill is loaded): `paperclip`.
3. Otherwise: `none`.

When you detect a tracker and `type:` is empty, save it to `agent-os/tracker.yml` so the next agent does not have to guess.

## paperclip

Paperclip tasks are issues with identifiers such as `SPA-31`. Use the Paperclip skill for every read and write; it documents the API, the injected `PAPERCLIP_*` variables, and the rules for comments and documents. Do not hand write API calls from memory.

| Agent OS | Paperclip |
|---|---|
| slice `tracker:` | issue identifier (`SPA-31`) |
| the slice's task | the issue you were woken for (`PAPERCLIP_TASK_ID`), when shaping inside a run |
| plan | the issue document with key `plan` |
| status, owner | issue status and assignee (never mirrored into the slice) |
| dependencies | `blockedByIssueIds` |
| verification result | a comment on the issue, plus the issue document with key `verification` |
| verification by a QA role | a review issue assigned to that role, self contained, blocked by the build issue; with isolated workspaces it also merges the branch (see below) |

Rules:

- Inside a run, the current issue is the slice's task. Create child or follow up issues only where Paperclip's own guidance on turning plans into tasks says to.
- Put the slice path and story IDs at the top of the `plan` document and in any issue you hand to someone else. Another agent may not be able to read your issue, but it can read the repository.
- When the plan needs approval, leave the issue in review as the Paperclip skill describes. Shaping does not add approval gates of its own.
- Link, do not copy: comments reference `agent-os/slices/SL-###-...md` and story IDs.

### Branches, commits and the QA merge gate

When the Paperclip project has isolated workspaces enabled, code lands in `main` only through QA. One slice, one branch:

- **Every code task belongs to the project** (set `projectId`). The slice's first code task gets its own git worktree and branch (Paperclip names it after the issue, for example `SPA-39-mission-timeline-data`). Later tasks on the same slice, such as the build after a data task or the code review, reuse that workspace (`inheritExecutionWorkspaceFromIssueId` set to the first task), so the whole slice lives on one branch.
- **Browser checks need the right build.** When a host service serves the app, find out which checkout it serves before trusting a browser result (see `agent-os/testing.yml`). If it serves the most recent build, run the build in your own checkout and wait until the served page contains your `.next/BUILD_ID` (or the framework's equivalent) before testing. A browser failure against someone else's build is not a finding. If you cannot get your build served, skip the browser checks and say so; the QA merge gate tests the merged result.
- **Mark a build task done only when its work is committed.** Dependent review and QA tasks start the moment it is done.
- **Reviewers name the commit they reviewed** in their verdict, so QA can tell whether the review covers what is being merged.
- **Builders commit on their branch**: small commits, each message naming the issue and slice (`SPA-40 SL-004: year scrubber under the map`). Use the git command the project's `AGENTS.md` specifies. Never merge into `main`, switch branches, rewrite history or push.
- **The QA task runs in the project's main checkout**: create it with `executionWorkspaceSettings: { mode: "shared_workspace" }` (the setting that counts; `executionWorkspacePreference` alone is overridden by an isolated project default). If a task was already bound to the wrong workspace, schedule the change with `PUT /api/issues/{id}/workspace` (`configured_source`, mode `shared`) and reopen it. The QA task is blocked by the build and review tasks, and names the slice branch in its description. QA is the gate:
  0. Check the review first: the code review task must have approved the commit at the tip of the branch (the reviewer names the commit it reviewed). A missing review, an adverse verdict, or a review of an older commit blocks the merge: do not merge, and send it back.
  1. `git merge --no-ff --no-commit <branch>` into `main`; stop and report if it conflicts (run `git merge --abort` first).
  2. Build and run the verify-stories skill on the merged result.
  3. All in-scope stories verified: commit the merge with a message naming the slice and the verified stories. That commit is the approval.
  4. Anything failing or blocked: `git merge --abort`, so `main` is untouched, and report to the builder as an adverse verdict.
- If the branch name is not in the task, read it from the first task's execution workspace.
- **Nobody pushes.** Publishing and deploying stay with the board.

#### Project setup (once, by whoever runs the instance)

- Turn on isolated workspaces: instance setting `enableIsolatedWorkspaces`, then on the project `executionWorkspacePolicy.enabled: true`, `defaultMode: "isolated_workspace"`, `workspaceStrategy.type: "git_worktree"`.
- Base ref: Paperclip bases worktrees on `origin/<branch>` when given a branch name, so unpushed local work would be missing. If `main` is integrated locally (QA merges without pushing), set `baseRef: "refs/heads/main"`, which is used as is.
- Dependencies: a sandboxed agent cannot read a `node_modules` symlink that points outside its worktree. Use a provision command that gives each worktree real dependencies, for example on macOS (APFS) a copy-on-write clone: `[ -e "$PAPERCLIP_WORKSPACE_CWD/node_modules" ] || cp -cR "$PAPERCLIP_WORKSPACE_BASE_CWD/node_modules" "$PAPERCLIP_WORKSPACE_CWD/node_modules"` (seconds, almost no disk), or an install command elsewhere.
- Agent identity: set `GIT_AUTHOR_NAME` and `GIT_AUTHOR_EMAIL` in each agent's adapter `env` so the history shows which agent wrote each commit.
- Finished worktrees are archived by Paperclip's workspace reaper after its cooldown; merged branches can be deleted.

Without isolated workspaces, every task shares one checkout: do not commit unless the task says to, because a commit would sweep up other agents' unfinished work.

Outside a run (a person at a terminal): ask for the issue identifier, or create the issue with the Paperclip CLI or UI if you have access. If you cannot, leave `tracker:` empty and tell the user the slice is not linked yet.

## none

There is no tracker. The slice file carries a `## Plan` checklist and `status: open | done`. Tick items as you finish them and set `status: done` after the slice's stories are verified.

## Other trackers

For GitHub Issues, Linear, Jira and similar: set `type:` to its name and store that system's task ID or URL in `tracker:`. Keep the same split: plan, status and ownership stay in the tracker; the slice links to it. Use whatever tool or CLI the project already has for that system.
