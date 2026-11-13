<!-- agent-os:start -->
## Agent OS

This project uses [Agent OS](https://github.com/elmunoz42/agent-os) (3.2, slices). This block is managed by the installer; edit outside the markers.

- `agent-os/standards/`: coding standards. Use the inject-standards skill to pull relevant ones into context (index in `agent-os/standards/index.yml`).
- `agent-os/product/`: mission, roadmap, tech stack.
- `agent-os/slices/`: one short file per slice of work: what a user gets and why, its user stories, and the ID of its task in the project tracker (index in `agent-os/slices/index.yml`). The plan, owner and status live in the tracker (`agent-os/tracker.yml` says which, for example Paperclip), not in the repository. Old specs, if any, are in `agent-os/archive/specs/` for reference only.
- `agent-os/user-stories/`: long lived user stories with acceptance criteria (index in `agent-os/user-stories/index.yml`). Status page: `python3 .agents/skills/verify-stories/scripts/stories_report.py` writes `agent-os/user-stories/report.html`.
- `agent-os/product/glossary.md` and `agent-os/decisions/`: the product's vocabulary and its few hard-to-reverse decisions, written by the grill-me-with-docs skill. Use the glossary's terms.
- `prototypes/`: throwaway prototypes that answer a question before any slice exists (prototype skill). Nothing in there is product code.
- `agent-os/testing.yml`: testing level (demo or production), how to start the app, and how to run unit and e2e tests.

Skills (in `.agents/skills/`, linked into `.claude/skills/`): plan-product, shape-slice, prototype, graduate-prototype, grill-me-with-docs, code-review, diagnose-bug, discover-standards, inject-standards, index-standards, write-user-stories, verify-stories, prd-to-stories, plus bm-prd-creator and security-audit if installed.

Rules for agents:
- When a change affects user-facing behavior, find the related stories in `agent-os/user-stories/index.yml` and keep them accurate.
- Do not copy plans, task lists or status from the tracker into files, or the other way round. Link by ID: slices name their tracker task, tracker tasks name the slice path and story IDs.
- Prototype first, process after: a prototype (prototype skill) deliberately skips slices, stories, standards and tests, and none of the rules below apply to code under `prototypes/`. In exchange, prototype code never ships, and only the person who asked can validate it. Once validated, the graduate-prototype skill turns it into a slice, stories and tasks, and it is built properly from those.
- The builder does not verify their own work: story status is set by whoever runs verify-stories as QA.
- Commits: when you work in your own task workspace (a git worktree on a task branch), commit your work there, with messages naming the task and slice. Never merge into main, switch branches or push. Code reaches main only when QA verifies the slice's stories and commits the merge. When you share the main checkout with other agents, do not commit unless your task says to.
- Before declaring a feature, slice, or milestone done, run the verify-stories skill for its stories. A story counts as verified only when its acceptance criteria passed in a real browser and are covered by committed tests. If the work has a tracker task, post the verification result there.
- When building from a PRD milestone (`_build_plan/milestones/*/prompt.md`), run verify-stories for that milestone before writing `milestone-log.md`, and include the verification result in the log.
- Security: if the security-audit skill is installed and the level is production, run a focused security review (its guidance mode) of the changed code before declaring work done, and turn each fixed finding into an `(edge)` acceptance criterion. Run its full audit only when the user asks. At any level, never commit secrets or keys. Details: `.agents/skills/write-user-stories/references/testing-levels.md`.
- Testing level: read `level:` in `agent-os/testing.yml`. Demo means happy path stories and tests, fast, moderate checks. Production means edge cases and full regression tests. If it is empty, ask the user once which applies and save the answer there before writing stories or tests.
- Never edit a story to match a bug. Report the failure instead.
<!-- agent-os:end -->
