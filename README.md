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

## Design apps (ArtCraft)

Erlich (marketing) and Richard (CEO) can make marketing and sales material with
the ArtCraft Craft apps (PhotoCraft, VectorCraft, DesignCraft, DeckCraft,
PdfCraft) running headless on a separate EC2 instance, `artcraft-cloud`, set up
from [elmunoz42/artcraft-aws-server](https://github.com/elmunoz42/artcraft-aws-server).

- **Hours.** That instance runs weekdays 5pm to 9pm Pacific and is stopped
  otherwise to save cost. Agents check the window before design work.
- **How agents reach it.** Through the `artcraft-apps` skill
  (`paperclip/company-skills/artcraft-apps`), whose `craft.py` talks to a
  private MCP endpoint on the VPC, open only to this host and protected by a
  bearer token (Paperclip secret `ARTCRAFT_MCP_TOKEN`). In the Hermes web chat,
  Richard also has the apps as native tools (see `paperclip/systemd/README.md`).
- **Where the files go.** The server is shared by several projects, each with
  its own folder. This company's exports land in the instance's
  `outputs/space-exploration-news/` folder and are copied within a minute to
  the private S3 bucket `artcraft-cloud-171824086147-us-east-2` under
  `outputs/space-exploration-news/`, for the board to review. `craft.py` keeps
  every path in that folder (set `ARTCRAFT_PROJECT` to use another one). Agents also save each design's editable project file so it can be
  opened in ArtCraft on a desktop. Nothing there is public.
- **Adding another project.** The server knows nothing about projects: it
  copies everything under `/work/outputs/` to S3 `outputs/`, so the folder is
  a convention set only by the `artcraft-apps` skill. The name
  `space-exploration-news` is written in the skill's `SKILL.md` (four paths,
  which agents read and Hermes chat's ArtCraft tools need in full) and is the
  default in `scripts/craft.py`. `sync_skills.py` installs skills into one
  company only (`COMPANY = "Space Exploration News"`). For a new project, say
  `acme`:
  1. Make a copy of the skill for that company, with the `SKILL.md` paths
     changed to `/work/outputs/acme/`.
  2. Set `ARTCRAFT_PROJECT=acme` on its agents, so `craft.py` writes there.
  3. Install the skill into that company (change `COMPANY` in
     `sync_skills.py`, or install it in the Paperclip UI).
  4. Give those agents the MCP address and `ARTCRAFT_MCP_TOKEN`, as Erlich and
     Richard have.

  Its files then land in S3 under `outputs/acme/`. Copies of the skill must be
  updated separately. The folders are not access control: anyone with the
  token can read or write any project's folder. A project that needs real
  separation needs its own token or its own server.
- **Free.** No credits are spent. AI image and video generation is a separate
  skill, `artcraft-generate`, which uses paid ArtCraft credits.
- Both instances are listed in the server room (the `infrastructure` document
  on SPA-23).

## Running it

The instance runs on a Linux host (Ubuntu 24.04) as systemd user services, all
bound to 127.0.0.1. See `paperclip/systemd/README.md` for setup, the AppArmor
profile the agent sandbox needs, and the SSH tunnel used to reach the UIs.
Paperclip runs in `local_trusted` mode, so never expose its port publicly.

## Licences

Third-party skills under `paperclip/company-skills/` keep their own licences;
`company-skills/skills.json` records each one's source, pinned commit and
licence. `agent-os/` is MIT (see `agent-os/LICENSE`).
