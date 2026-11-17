#!/usr/bin/env python3
"""Client for the company's ArtCraft Craft apps server (PhotoCraft, VectorCraft,
DesignCraft, DeckCraft, PdfCraft) over MCP. Reads the token from
ARTCRAFT_MCP_TOKEN and never prints it. Needs only python3.

    craft.py window                       is the server inside its working hours?
    craft.py apps                         which apps are installed
    craft.py commands APP [FILTER] [--ids ID,ID] [--limit N]   find command IDs / their params
    craft.py help APP [ARGS...]           an app's --help text
    craft.py run request.json             run steps (the artcraft_run arguments as JSON)
    craft.py cli APP ARG [ARG...]         run one CLI subcommand verbatim
    craft.py files                        list exported files on the server
    craft.py get NAME [DEST]              download an export from the server's outputs/

Preview images returned by run/cli are saved under .craft/previews/ and their
paths printed, never dumped as base64.
"""
import base64
import datetime
import json
import os
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

URL = os.environ.get("ARTCRAFT_MCP_URL", "http://172.31.7.218:8811").rstrip("/")
OPEN_HOUR, CLOSE_HOUR = 17, 21          # 5pm to 9pm
ZONE = "America/Los_Angeles"            # weekdays only


def die(msg, code=1):
    print(f"craft: {msg}", file=sys.stderr)
    sys.exit(code)


def token():
    # MCP_ARTCRAFT_API_KEY is where Hermes keeps the same token for its native MCP connection.
    t = (os.environ.get("ARTCRAFT_MCP_TOKEN") or os.environ.get("MCP_ARTCRAFT_API_KEY") or "").strip()
    if not t:
        die("ARTCRAFT_MCP_TOKEN is not set; ask the board to connect the ArtCraft MCP secret")
    return t


def window_state():
    """(is_open, description) for the server's weekday working hours."""
    try:
        from zoneinfo import ZoneInfo
        now = datetime.datetime.now(ZoneInfo(ZONE))
    except Exception:  # no tz database: assume Pacific standard time
        now = datetime.datetime.utcnow() - datetime.timedelta(hours=8)
    is_open = now.weekday() < 5 and OPEN_HOUR <= now.hour < CLOSE_HOUR
    when = now.strftime("%a %H:%M") + " Pacific"
    hours = f"weekdays {OPEN_HOUR - 12}pm to {CLOSE_HOUR - 12}pm Pacific"
    return is_open, f"it is {when}; the server runs {hours}"


def unreachable(reason):
    is_open, desc = window_state()
    if not is_open:
        die(f"the ArtCraft server is not reachable and that is expected: {desc}. "
            "Leave a note in the task and continue when it is up; do not retry in a loop.", 3)
    die(f"the ArtCraft server is not reachable ({reason}) although {desc}. "
        "It needs a few minutes after 5pm to start. Try once more in 5 minutes, then tell the board.", 2)


_checked = False


def check_reachable():
    """Fail within seconds when the server is switched off, instead of hanging on a long read timeout."""
    global _checked
    if _checked:
        return
    u = urllib.parse.urlparse(URL)
    try:
        socket.create_connection((u.hostname, u.port or (443 if u.scheme == "https" else 80)), timeout=6).close()
    except OSError as e:
        unreachable(e)
    _checked = True


def http(path, body=None, headers=None, timeout=200):
    check_reachable()
    h = {"Authorization": f"Bearer {token()}"}
    h.update(headers or {})
    req = urllib.request.Request(URL + path, method="POST" if body is not None else "GET",
                                 data=json.dumps(body).encode() if body is not None else None, headers=h)
    try:
        return urllib.request.urlopen(req, timeout=timeout)
    except urllib.error.HTTPError as e:
        if e.code == 401:
            die("the server refused the token (401); tell the board, do not look for another token")
        if e.code == 404 and body is None:
            die(f"not found on the server: {path}")
        die(f"server returned HTTP {e.code}: {e.read()[:300].decode(errors='replace')}")
    except (urllib.error.URLError, OSError) as e:
        unreachable(e)


class Session:
    def __init__(self):
        self.sid, self.n = None, 0
        self.rpc("initialize", {"protocolVersion": "2025-03-26", "capabilities": {},
                                "clientInfo": {"name": "agent-office-craft", "version": "1"}})
        self.rpc("notifications/initialized", notify=True)

    def rpc(self, method, params=None, notify=False, timeout=200):
        msg = {"jsonrpc": "2.0", "method": method}
        if params is not None:
            msg["params"] = params
        if not notify:
            self.n += 1
            msg["id"] = self.n
        headers = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
        if self.sid:
            headers["Mcp-Session-Id"] = self.sid
        resp = http("/mcp", msg, headers, timeout)
        self.sid = resp.headers.get("Mcp-Session-Id") or self.sid
        raw = resp.read().decode("utf8", "replace")
        if notify:
            return None
        if "text/event-stream" in (resp.headers.get("Content-Type") or ""):
            data = [l[5:].strip() for l in raw.splitlines() if l.startswith("data:")]
            raw = data[-1] if data else "{}"
        out = json.loads(raw or "{}")
        if "error" in out:
            die(f"{method} failed: {json.dumps(out['error'])[:500]}")
        return out.get("result", {})

    def tool(self, name, args, timeout=200):
        res = self.rpc("tools/call", {"name": name, "arguments": args}, timeout=timeout)
        shown = 0
        for part in res.get("content", []):
            if part.get("type") == "text":
                print(part.get("text", ""))
            elif part.get("type") == "image":
                os.makedirs(os.path.join(".craft", "previews"), exist_ok=True)
                ext = (part.get("mimeType") or "image/png").split("/")[-1]
                shown += 1
                path = os.path.join(".craft", "previews", f"preview-{int(time.time())}-{shown}.{ext}")
                with open(path, "wb") as f:
                    f.write(base64.b64decode(part.get("data", "")))
                print(f"[preview saved: {path}]")
        if res.get("isError"):
            sys.exit(1)


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return
    cmd, rest = argv[0], argv[1:]
    if cmd == "window":
        is_open, desc = window_state()
        print(("OPEN: " if is_open else "CLOSED: ") + desc)
        sys.exit(0 if is_open else 3)
    if cmd == "apps":
        Session().tool("artcraft_apps", {})
    elif cmd == "commands":
        if not rest:
            die("usage: craft.py commands APP [FILTER] [--ids ID,ID] [--limit N]")
        args, words, i = {"app": rest[0]}, [], 1
        while i < len(rest):
            if rest[i] == "--ids" and i + 1 < len(rest):
                args["ids"] = [x for x in rest[i + 1].split(",") if x]; i += 2
            elif rest[i] == "--limit" and i + 1 < len(rest):
                args["limit"] = int(rest[i + 1]); i += 2
            else:
                words.append(rest[i]); i += 1
        if words:
            args["filter"] = " ".join(words)
        Session().tool("artcraft_commands", args)
    elif cmd == "help":
        if not rest:
            die("usage: craft.py help APP [ARGS...]")
        args = {"app": rest[0]}
        if rest[1:]:
            args["args"] = rest[1:]
        Session().tool("artcraft_help", args)
    elif cmd == "run":
        if len(rest) != 1:
            die("usage: craft.py run request.json")
        with open(rest[0]) as f:
            args = json.load(f)
        Session().tool("artcraft_run", args, timeout=int(args.get("timeout_ms", 120000)) / 1000 + 60)
    elif cmd == "cli":
        if len(rest) < 2:
            die("usage: craft.py cli APP ARG [ARG...]")
        Session().tool("artcraft_cli", {"app": rest[0], "args": rest[1:]})
    elif cmd == "files":
        resp = http("/files/", headers={"Accept": "application/json"})
        for e in json.loads(resp.read() or "[]"):
            kind = "dir " if e.get("is_dir") else "file"
            print(f"{kind} {e.get('size', 0):>10}  {e.get('mod_time', '')[:19]}  {e.get('name')}")
    elif cmd == "get":
        if not rest:
            die("usage: craft.py get NAME [DEST]")
        name = rest[0].replace("/work/outputs/", "").lstrip("/")
        dest = rest[1] if len(rest) > 1 else os.path.basename(name)
        resp = http("/files/" + urllib.parse.quote(name))
        with open(dest, "wb") as f:
            while True:
                chunk = resp.read(1 << 16)
                if not chunk:
                    break
                f.write(chunk)
        print(f"saved {dest} ({os.path.getsize(dest)} bytes)")
    else:
        die(f"unknown command {cmd!r}; run craft.py --help")


if __name__ == "__main__":
    main(sys.argv[1:])
