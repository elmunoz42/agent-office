# Agent Instructions

Single source of truth for agents working on this repo. `CLAUDE.md` is a symlink to this file; edit only `AGENTS.md`.

## About this repo

Fork of [buildermethods/agent-os](https://github.com/buildermethods/agent-os) v3 (version `3.2-paperclip`, branch `paperclip`). It installs Agent OS skills into projects for Claude Code, Codex, and Cursor, adds user stories verified in a real browser and by Playwright tests, and replaces spec folders with slices that link to tasks in a tracker such as Paperclip. In a project it is still just `agent-os/`.

## Layout

- `commands/agent-os/*.md`: upstream commands. Each has Agent Skills frontmatter and installs as `<name>/SKILL.md`. Keep edits to these files small so the fork rebases cleanly on upstream.
- `skills/<name>/SKILL.md`: fork skills (shape-slice, write-user-stories, verify-stories, prd-to-stories, prototype, graduate-prototype, grill-me-with-docs, code-review, diagnose-bug), flat Agent Skills layout. The last four are adapted from mattpocock/skills (MIT, see `THIRD_PARTY.md`); they are rewrites, not pinned externals, so edit them here. `shape-slice` replaces upstream's `shape-spec`, which this branch deletes; `RETIRED_SKILLS` in `scripts/lib/install-lib.sh` removes installed copies.
- `scripts/project-install.sh`: installer (upstream flags preserved). `scripts/migrate.sh`: upgrades, batch scan, rollback. `scripts/lib/install-lib.sh`: shared logic.
- `templates/`: files the installer writes into projects (AGENTS.md block, testing.yml, tracker.yml, story template, stories and slices indexes).
- `examples/sample-app/`: tiny app with stories, a real verification run, and story tagged Playwright tests.
- `tests/run.sh`: test suite. `tests/run.sh --e2e` also runs the sample app's Playwright tests. `tests/compat.sh` checks Claude Code, Codex, and Cursor with their own tooling.

## Rules

- One owner per fact: the tracker owns plan, owner, status and dependencies; a slice file owns what and why and links to the tracker task; user stories own what working means. Skills must never tell agents to mirror tracker state into files. Tracker specifics live only in `skills/shape-slice/references/trackers.md`, and skills defer to the tracker's own skill for API calls.
- Backward compatibility: never change paths or names under `agent-os/standards`, `agent-os/product`, or `agent-os/user-stories`, and migrations must never modify standards or product (migrate.sh checksums them). Spec files may be moved to `agent-os/archive/specs/` but never edited (migrate.sh checksums their contents across the move). Story files are never edited by migrations; `spec:<folder>` sources keep resolving through `legacy_spec:`.
- Skills must work unattended and without sub-agents: an agent in a tracker run has no user to ask and may be sandboxed. Give every interactive step an unattended path (decide and record, or post to the tracker and stop).
- `prototype` is the only sanctioned bypass of slices, stories and tests. Keep its two guarantees intact in any edit: prototype code never ships, and the builder never validates their own prototype.
- Skill names: lowercase, digits, single hyphens; folder name matches frontmatter `name`; frontmatter keys limited to those `scripts/validate-skills.sh` allows, so skills load in all three tools.
- Scripts must run on bash 3.2 (macOS): no associative arrays, no `mapfile`, no `${var,,}`. Under `set -e`, never end a function or loop body with `[[ cond ]] && cmd`; use `if`.
- Every installer write is tracked for rollback (`track_create`, `track_modify`, `backup_move`) and skipped when content is unchanged.
- External skills (PRD Creator from `buildermethods/bm-skills`, security-audit from `cloudflare/security-audit-skill`, both MIT) are dependencies listed in `EXTERNAL_SKILLS` in `scripts/lib/install-lib.sh`, pinned to tested commits. Never vendor or edit them. Bump a pin only after `tests/run.sh` and `tests/compat.sh` pass against the new commit.
- Before committing: `tests/run.sh` must pass. Add a CHANGELOG entry for user visible changes.
