#!/usr/bin/env python3
"""Small client for ArtCraft's Omni API. Reads the key from ARTCRAFT_API_KEY and
never prints it.

    artcraft.py video request.json --max N   submit a video job
    artcraft.py image request.json --max N   submit an image job
    artcraft.py status TOKEN                 one status check
    artcraft.py wait TOKEN [--timeout 1800]  poll until done; print the result URL
    artcraft.py ledger                       jobs submitted from this folder

Submitting refuses once .artcraft/jobs.jsonl holds N jobs (the approved count).
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid

BASE = os.environ.get("ARTCRAFT_API_URL", "https://api.storyteller.ai")
LEDGER = os.path.join(".artcraft", "jobs.jsonl")
RUNNING = {"pending", "started", "attempt_failed"}
HINTS = {401: "invalid or missing API key", 402: "out of ArtCraft credits", 400: "request rejected"}


def die(msg):
    sys.exit(f"artcraft: {msg}")


def key():
    k = os.environ.get("ARTCRAFT_API_KEY", "").strip()
    if not k:
        die("ARTCRAFT_API_KEY is not set; ask the board to connect the ArtCraft secret")
    return k


def call(method, path, body=None):
    req = urllib.request.Request(
        BASE + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {key()}", "Content-Type": "application/json",
                 "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:500]
        die(f"{method} {path} -> {e.code} ({HINTS.get(e.code, 'error')}): {detail}")
    except urllib.error.URLError as e:
        die(f"{method} {path} failed: {e.reason}")


def ledger():
    if not os.path.exists(LEDGER):
        return []
    with open(LEDGER) as f:
        return [json.loads(line) for line in f if line.strip()]


def submit(kind, request_file, limit):
    jobs = ledger()
    if len(jobs) >= limit:
        die(f"{len(jobs)} job(s) already submitted from this folder; the approved count is {limit}. Ask the board for more.")
    with open(request_file) as f:
        body = json.load(f)
    if "model" not in body:
        die("request needs a model")
    body["idempotency_token"] = str(uuid.uuid4())
    resp = call("POST", f"/v1/omni_api/generate/{kind}", body)
    token = resp.get("inference_job_token")
    if not token:
        die(f"no job token in response: {json.dumps(resp)[:500]}")
    os.makedirs(os.path.dirname(LEDGER), exist_ok=True)
    entry = {"at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "kind": kind,
             "token": token, "all_job_tokens": resp.get("all_job_tokens"),
             "request": {k: v for k, v in body.items() if k != "idempotency_token"}}
    with open(LEDGER, "a") as f:
        f.write(json.dumps(entry) + "\n")
    print(json.dumps({"job": token, "submitted": len(jobs) + 1, "approved": limit}))


def state(token):
    return call("GET", f"/v1/omni_api/job_status/job/{token}").get("state") or {}


def summary(st):
    status = (st.get("status") or {})
    result = st.get("maybe_result") or {}
    links = result.get("media_links") or {}
    previews = links.get("maybe_video_previews") or {}
    return {"job": st.get("job_token"), "status": status.get("status"),
            "progress": status.get("progress_percentage"),
            "failure": status.get("maybe_failure_category"),
            "url": links.get("cdn_url"), "preview": previews.get("still")}


def main(argv):
    if not argv:
        die(__doc__)
    cmd, args = argv[0], argv[1:]
    if cmd in ("video", "image"):
        if len(args) != 3 or args[1] != "--max":
            die(f"usage: artcraft.py {cmd} request.json --max N")
        submit(cmd, args[0], int(args[2]))
    elif cmd == "status" and len(args) == 1:
        print(json.dumps(summary(state(args[0]))))
    elif cmd == "wait" and args:
        timeout = int(args[2]) if len(args) == 3 and args[1] == "--timeout" else 1800
        deadline = time.time() + timeout
        while True:
            s = summary(state(args[0]))
            if s["status"] not in RUNNING:
                print(json.dumps(s))
                sys.exit(0 if s["status"] == "complete_success" else 1)
            if time.time() > deadline:
                print(json.dumps(s))
                die(f"still {s['status']} after {timeout}s; check again later with status")
            time.sleep(10)
    elif cmd == "ledger":
        for j in ledger():
            print(json.dumps({"at": j["at"], "kind": j["kind"], "job": j["token"]}))
    else:
        die(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
