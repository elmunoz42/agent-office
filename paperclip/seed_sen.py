#!/usr/bin/env python3
"""Seed the Space Exploration News company into the local Paperclip instance.

Creates the company, its goals, the agent team and a
starter backlog taken from sen-app's roadmap and strategy doc. Agents run on
OpenAI Codex through the Paperclip Runner. Agents are
created with timers off and are paused straight away, so nothing runs until
you resume them. Refuses to run twice (checks for the company by name).

    python3 seed_sen.py            # against http://localhost:3100
"""
import json
import os
import sys
import urllib.error
import urllib.request

API = os.environ.get("PAPERCLIP_API_URL", "http://localhost:3100") + "/api"
WORKSPACE = os.path.expanduser("~/Desktop/dev/space-exploration-news/sen-app")  # agents work in the real checkout (owner's choice)
COMPANY = "Space Exploration News"


def call(method, path, body=None):
    req = urllib.request.Request(
        API + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {path} -> {e.code}: {e.read().decode()[:600]}")


if any(c["name"] == COMPANY for c in call("GET", "/companies")):
    sys.exit(f'"{COMPANY}" already exists; nothing to do.')

os.makedirs(WORKSPACE, exist_ok=True)

company = call("POST", "/companies", {
    "name": COMPANY,
    "description": (
        "space-exploration.news: an AI engineer's-eye news site on AI/ML applied to solar "
        "system exploration, paired with an interactive 3D solar system experience. "
        "Next.js frontend (sen-app) reading the existing WordPress install as a headless "
        "backend. Side project run on roughly two hours a week of human time."
    ),
    # No monthly budget cap: with a cap, Paperclip refuses all new work until every
    # finished run has a cost receipt, and a run that fails before using any tokens
    # never gets one (this locked the company on 2026-11-12).
})
cid = company["id"]
print("company", cid)

# ---------------------------------------------------------------- goals
top = call("POST", f"/companies/{cid}/goals", {
    "title": "Run Space Exploration News as the go-to outlet for AI/ML in solar system exploration",
    "level": "company", "status": "active",
    "description": (
        "Publish credible, engineer's-perspective coverage of AI/ML applied to solar system "
        "exploration, and serve it through an immersive 3D solar system where every body "
        "opens evergreen content and linked mission news. Audience: technically minded space "
        "and AI enthusiasts, multilingual (EN/ES/PT/DE/FR). Keep the human owner's load near "
        "two hours a week: agents draft and build, the owner curates and approves anything "
        "that publishes or spends."
    ),
})
GOALS = {
    "experience": ("Ship the 3D Solar System Experience",
                   "Roadmap phase 1. The explorer is built; what remains is deploying it and a visual QA pass."),
    "site": ("Build the full content site",
             "Roadmap phase 2. Home/blog listing, category and tag archives, mission archive, search, multilingual routing."),
    "content": ("Keep the content engine and WordPress backend healthy",
                "Roadmap phase 3. Harden the headless WordPress backend and keep celestial-body and mission content flowing."),
    "business": ("Grow audience and revenue",
                 "Roadmap phase 4 plus monetization. Merch store on WooCommerce, podcast/video script reuse, cost discipline."),
}
goal_id = {"top": top["id"]}
for key, (title, desc) in GOALS.items():
    goal_id[key] = call("POST", f"/companies/{cid}/goals", {
        "title": title, "description": desc, "level": "team", "status": "active", "parentId": top["id"],
    })["id"]
print("goals", len(goal_id))

# ---------------------------------------------------------------- agents
# officeId ties each agent to a desk in the 3D office (agent-office/src/data.js).
TEAM = [
    ("hermes", "Hermes", "ceo", "CEO", "crown",
     "Owns the roadmap and priorities for Space Exploration News. Breaks goals into issues, "
     "delegates to the team, and escalates anything that publishes, spends or deploys to the board."),
    ("backend", "Soren Black", "engineer", "Senior Backend Dev", "database",
     "Headless WordPress REST backend (celestial-body and mission post types, ACF), the Next.js "
     "API routes in sen-app that proxy it, and deployment."),
    ("frontend", "Kiran Mehta", "engineer", "Senior Frontend Dev", "telescope",
     "sen-app frontend: Next.js, React Three Fiber solar system, detail sidebar, content pages, "
     "multilingual routing, visual QA."),
    ("marketing", "Ezra Blum", "cmo", "Marketing", "sparkles",
     "Content calendar across the five content pillars, post and newsletter drafts, podcast and "
     "video script reuse. Drafts only; the board approves anything that publishes."),
    ("cfo", "Wendell Park", "cfo", "CFO", "gem",
     "Cost model for hosting, tooling and agent spend; revenue planning for the WooCommerce merch "
     "store, sponsorships and affiliates."),
    ("contractor-1", "Juno", "engineer", "Contract Dev", "code",
     "General implementation tickets handed down by the senior developers."),
    ("contractor-2", "Tabs", "engineer", "Contract Dev", "code",
     "General implementation tickets handed down by the senior developers."),
]
agent_id = {}
for office_id, name, role, title, icon, caps in TEAM:
    body = {
        "name": name, "role": role, "title": title, "icon": icon, "capabilities": caps,
        "adapterType": "codex_local", "runner": "paperclip",
        "adapterConfig": {"cwd": WORKSPACE},
        "runtimeConfig": {"heartbeat": {"enabled": False, "wakeOnDemand": False}},
        "metadata": {"officeId": office_id},
    }
    if office_id != "hermes":
        body["reportsTo"] = agent_id["hermes"]
    a = call("POST", f"/companies/{cid}/agents", body)
    a = a.get("agent", a)
    agent_id[office_id] = a["id"]
    call("POST", f"/agents/{a['id']}/pause")
    print("agent", name, a["id"], "(paused)")

# ---------------------------------------------------------------- backlog
# (assignee, goal, status, priority, title, description) — all from sen-app's roadmap/strategy.
ISSUES = [
    ("hermes", "top", "todo", "high", "Turn the roadmap into a prioritized plan for the next six weeks",
     "Read agent-os/product/roadmap.md and space-exploration-news-strategy.md in sen-app. Propose an ordered plan the team can execute with about two hours a week of owner time."),
    ("backend", "experience", "todo", "high", "Deploy sen-app to Vercel",
     "Roadmap phase 1, still open. Prepare the deployment (env vars, WP_API_BASE_URL) and hand the actual deploy to the board for approval."),
    ("backend", "experience", "todo", "medium", "Verify production WordPress exposes the celestial-body REST type",
     "The app has only been tested against the local sen2.local install. Confirm space-exploration.news exposes celestial-body posts with category terms per body. Read-only check."),
    ("frontend", "experience", "todo", "high", "Visual QA pass on camera fly-to framing and moon click targets",
     "Both were built without a browser to look at them. Review in a real browser and list or fix what is off."),
    ("frontend", "site", "backlog", "medium", "Home and blog listing pages", "Roadmap phase 2."),
    ("frontend", "site", "backlog", "medium", "Category, tag and mission archive pages", "Roadmap phase 2."),
    ("frontend", "site", "backlog", "low", "Multilingual routing (EN/ES/PT/DE/FR)",
     "Mirror WordPress's existing translation setup. Roadmap phase 2."),
    ("contractor-1", "site", "backlog", "low", "Site search", "Roadmap phase 2."),
    ("backend", "content", "backlog", "medium", "Expose ACF fields for celestial bodies over REST",
     "The REST API currently returns acf: [] for celestial-body posts. Roadmap phase 3."),
    ("backend", "content", "backlog", "low", "Evaluate a real Mission to Celestial Body relationship field",
     "Category/title matching misses posts such as '3rd Starship Launch'. Roadmap phase 3."),
    ("contractor-2", "content", "backlog", "medium", "Draft celestial-body posts for the bodies that have none",
     "Content is sparse (3 celestial-body and 3 mission posts as of July). Drafts only, for owner review."),
    ("marketing", "content", "todo", "medium", "Content calendar across the five content pillars",
     "Celestial bodies, regional deep dives, mission news, AI/ML analysis drafts, multilingual versions."),
    ("marketing", "business", "backlog", "low", "Podcast and video script reuse workflow",
     "One script, two channels: posted as blog content and recorded. Strategy doc, parallel track."),
    ("cfo", "business", "todo", "medium", "Monthly cost model: hosting, tooling and agent spend", ""),
    ("cfo", "business", "backlog", "low", "Revenue plan for the WooCommerce merch store",
     "Curated, few products. Store stays on WordPress; the new site links out to it."),
]
for who, goal, status, priority, title, desc in ISSUES:
    call("POST", f"/companies/{cid}/issues", {
        "title": title, "description": desc, "status": status, "priority": priority,
        "assigneeAgentId": agent_id[who], "goalId": goal_id[goal],
    })
print("issues", len(ISSUES))
print(json.dumps({"companyId": cid, "agents": agent_id}, indent=2))
