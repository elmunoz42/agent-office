#!/usr/bin/env python3
"""Push the skills in this folder into Paperclip and give them to the agents
listed in skills.json.

Each skill is a folder here (SKILL.md plus any references). skills.json says
where it came from (repository and pinned commit, or agent-os), its licence,
and which agents get it (by office id, e.g. "frontend", "backend", "qa").

    python3 sync_skills.py            # dry run: show what would change
    python3 sync_skills.py --apply    # create or update company skills, then sync agents

Agents keep any skills they already have; this only adds. To take a skill away
from an agent, remove it from the agent in the Paperclip UI as well as here.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
API = os.environ.get("PAPERCLIP_API_URL", "http://localhost:3100") + "/api"
COMPANY = "Space Exploration News"
APPLY = "--apply" in sys.argv


def call(method, path, body=None):
    req = urllib.request.Request(
        API + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{method} {path} -> {e.code}: {e.read().decode()[:400]}")


def frontmatter(md, key):
    m = re.search(rf"^{key}:\s*(\|\s*\n((?:[ \t]+.*\n?)+)|(.*))$", md, re.M)
    if not m:
        return None
    return " ".join(m.group(2).split()) if m.group(2) else m.group(3).strip().strip('"')


def skill_files(folder):
    out = []
    for root, _, files in os.walk(folder):
        for f in sorted(files):
            rel = os.path.relpath(os.path.join(root, f), folder)
            if rel == "SKILL.md" or f.startswith("."):
                continue
            out.append(rel)
    return sorted(out)


manifest = json.load(open(os.path.join(HERE, "skills.json")))
company = next(c for c in call("GET", "/companies") if c["name"] == COMPANY)
cid = company["id"]
existing = call("GET", f"/companies/{cid}/skills")
existing = existing if isinstance(existing, list) else existing.get("skills", [])
by_slug = {(s.get("slug") or s.get("name")): s for s in existing}
agents = call("GET", f"/companies/{cid}/agents")
by_office = {a["metadata"].get("officeId"): a for a in agents if a.get("metadata")}

keys = {}
for slug, meta in manifest["skills"].items():
    folder = os.path.join(HERE, slug)
    md = open(os.path.join(folder, "SKILL.md")).read()
    files = skill_files(folder)
    if slug in by_slug:
        sid = by_slug[slug]["id"]
        keys[slug] = by_slug[slug].get("key")
        action = "update"
    else:
        sid, action = None, "create"
    print(f"{action:6} {slug:28} files={1 + len(files):<3} agents={','.join(meta['agents'])}")
    if not APPLY:
        continue
    if sid is None:
        created = call("POST", f"/companies/{cid}/skills", {
            "idempotencyKey": f"company-skill-{slug}-v1", "name": slug, "slug": slug,
            "description": frontmatter(md, "description"), "markdown": md, "sharingScope": "company",
            "authorName": meta.get("author", "Agent Office"),
        })
        created = created.get("skill", created)
        sid, keys[slug] = created["id"], created.get("key")
    else:
        call("PATCH", f"/companies/{cid}/skills/{sid}/files", {"path": "SKILL.md", "content": md, "encoding": "utf8"})
    for rel in files:
        call("PATCH", f"/companies/{cid}/skills/{sid}/files",
             {"path": rel, "content": open(os.path.join(folder, rel)).read(), "encoding": "utf8"})

wanted = {}
for slug, meta in manifest["skills"].items():
    for office_id in meta["agents"]:
        wanted.setdefault(office_id, []).append(slug)
for office_id, slugs in sorted(wanted.items()):
    agent = by_office.get(office_id)
    if not agent:
        print(f"  ! no Paperclip agent with officeId {office_id}; skipped {', '.join(slugs)}")
        continue
    have = set((agent["adapterConfig"].get("paperclipSkillSync") or {}).get("desiredSkills", []))
    add = [keys.get(s) or f"company/{cid}/{s}" for s in slugs]
    missing = [k for k in add if k not in have]
    print(f"agent  {agent['name']:12} +{len(missing)} {', '.join(k.split('/')[-1] for k in missing) or '(up to date)'}")
    if APPLY and missing:
        call("POST", f"/agents/{agent['id']}/skills/sync", {"mode": "add", "desiredSkills": missing})

if not APPLY:
    print("\nDry run. Re-run with --apply to make these changes.")
