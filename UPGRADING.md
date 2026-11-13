# Upgrading to Agent OS 3.2 (slices)

## What never changes

- `agent-os/standards/` and `standards/index.yml`
- `agent-os/product/`
- `agent-os/user-stories/` (story files are not edited; `source: spec:<folder>` keeps resolving)
- The content of every spec file (folders move, files are not edited)
- Command names: /discover-standards, /inject-standards, /index-standards, /plan-product

`migrate.sh` checksums standards, product, and the contents of all spec files before and after, and rolls back automatically if anything differs.

## Specs become slices

From 3.2, plans and task status live in the project tracker (for example Paperclip), not in spec folders. For each folder in `agent-os/specs/`, `migrate.sh`:

1. writes a short legacy slice `agent-os/slices/SL-###-<slug>.md` (title from the spec, `created:` from the folder date, `stories:` from its `stories.md`, `status: legacy`, `legacy_spec:` pointing at the old folder) and adds it to `agent-os/slices/index.yml`;
2. moves the folder, unedited, to `agent-os/archive/specs/`.

It does not create tracker tasks for old specs. Pass `--keep-specs` to leave the folders in `agent-os/specs/` (slices are still added). `/shape-spec` is replaced by `/shape-slice`; installed copies of the old skill and command go to the session backup. Set the tracker with `--tracker paperclip` (or `none`), or leave it and agents detect it.

## What gets added

| Path | Purpose |
|---|---|
| `.agents/skills/<name>/` | Skills for Codex and Cursor (canonical copy) |
| `.claude/skills/<name>` | Links to the above for Claude Code (`--copy` for real folders) |
| `AGENTS.md` | Managed block between `<!-- agent-os:start -->` and `<!-- agent-os:end -->`; your content outside it is kept |
| `CLAUDE.md` | One `@AGENTS.md` import line appended (skipped if CLAUDE.md already links to AGENTS.md) |
| `agent-os/user-stories/index.yml` | Story index |
| `agent-os/testing.yml` | App start command, URLs, test commands, browser tool order |
| `agent-os/slices/index.yml`, `agent-os/slices/SL-*.md` | Slice index and one legacy slice per old spec |
| `agent-os/tracker.yml` | Which tracker owns tasks (`paperclip`, `none`, ...) |
| `agent-os/archive/specs/` | Old spec folders, moved unedited |
| `agent-os/.version` | `3.2-paperclip`, for future migrations |
| `.gitignore` | Backups and run screenshots and logs |

Skills that already exist with the same name and were not installed by Agent OS are never overwritten (a warning is printed).

## What moves

`.claude/commands/agent-os/<name>.md` files whose names match a skill are moved to `agent-os/.backups/<session>/moved/`, so Claude Code does not show a skill twice. Other legacy commands (for example v2 `write-spec`) stay where they are. Use `--keep-legacy-commands` with project-install.sh to keep everything.

## From v3

```bash
cd your-project
~/agent-os/scripts/migrate.sh            # dry run: lists every planned change
~/agent-os/scripts/migrate.sh --apply
```

`project-install.sh --commands-only --yes` refreshes skills too, but only `migrate.sh` converts specs to slices.

## From fork 3.1

Same command. Stories, testing config and run reports are kept as they are.

## From v2

Same command. v2 is detected by `agent-os/instructions/`, `.claude/agents/agent-os/`, or v2 style specs (`spec.md`, `tasks.md`) without a standards index. v2 folders are left in place; delete them when you no longer use them. Old specs become legacy slices like any others. To turn them into stories: `/write-user-stories backfill`.

## Many projects at once

```bash
~/agent-os/scripts/migrate.sh --scan ~/code                                   # report only
~/agent-os/scripts/migrate.sh --scan ~/code --apply --branch agent-os-3.1     # upgrade all
```

- Finds every folder with `agent-os/` up to depth 4 (`--depth n` to change), skipping node_modules, vendor, and the Agent OS repo itself.
- Refuses repos with uncommitted changes (`--force` to override).
- With `--branch`: checks out or creates the branch, upgrades, and commits. Never pushes. Review and merge per repo.
- Add `--with prd,security` to also install the PRD Creator and Cloudflare's security-audit skill everywhere (pinned to tested commits; `--prd-ref` or `--security-ref` to override).

## Rollback

```bash
~/agent-os/scripts/migrate.sh --rollback [project]
```

Undoes the most recent install or migration from its manifest in `agent-os/.backups/`: removes added skills and files, restores modified files, and moves retired commands back. Story files you created after migrating are kept. If you used `--branch`, you can also just delete the branch.

## After upgrading

1. Check `agent-os/testing.yml` (or let `/verify-stories` detect and fill it in). Set `level: demo` for customer demos or `level: production` for code that ships, or pass `--level` to migrate.sh; if you leave it empty, agents ask once and save the answer.
   Existing stories without `sets` count as part of both the demo and production sets.
2. `/write-user-stories backfill` for existing features, or let `/shape-spec` add stories as you go.
3. `/verify-stories` to run the first browser pass and generate story tests.
