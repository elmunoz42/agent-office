# Agent Office

A small AI company for the Space Exploration News project, run on
[Paperclip](https://github.com/paperclipai/paperclip), and a walkable 3D office
(three.js + Vite) where you can see the agents at their desks and talk to them.

| Folder | What it is |
| --- | --- |
| `src/`, `index.html` | The office UI. `npm install && npm run dev`; it talks to Paperclip through the `/paperclip` proxy in `vite.config.js`. |
| `paperclip/` | Paperclip tooling: the pinned CLI (`package.json`), seed script, QA host services (`qa/`), Linux service units (`systemd/`), host migration scripts (`migrate/`) and the per-agent skills (`company-skills/`, synced with `sync_skills.py`). |
| `agent-os/` | Agent OS 3.2 (Builder Methods, MIT) with the Paperclip changes: slices linked to tasks, one branch per slice with a QA merge gate, and the prototype, grill-me and graduate-prototype skills. Install it into a project with its `scripts/`. |
| `docs/` | Walkthrough video and notes. |

## Running it

The instance runs on a Linux host (Ubuntu 24.04) as systemd user services, all
bound to 127.0.0.1. See `paperclip/systemd/README.md` for setup, the AppArmor
profile the agent sandbox needs, and the SSH tunnel used to reach the UIs.
Paperclip runs in `local_trusted` mode, so never expose its port publicly.

## Licences

Third-party skills under `paperclip/company-skills/` keep their own licences;
`company-skills/skills.json` records each one's source, pinned commit and
licence. `agent-os/` is MIT (see `agent-os/LICENSE`).
