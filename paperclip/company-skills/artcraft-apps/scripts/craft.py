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
    craft.py files                        list this project's exported files on the server
    craft.py get NAME [DEST]              download an export from this project's folder
    craft.py preview NAME [--page N]      small image of an exported PNG/JPG/PDF, to look at your work

The server is shared by several projects. Each keeps its files in
/work/outputs/<project>/ (ARTCRAFT_PROJECT, default space-exploration-news), and
the S3 copy lands in outputs/<project>/. craft.py puts every /work/outputs/ path
it sends (run input/output, cli args, get, preview, files) into that folder, so
"/work/outputs/SPA-70-banner.png" is saved as
"/work/outputs/space-exploration-news/SPA-70-banner.png".

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
PROJECT = (os.environ.get("ARTCRAFT_PROJECT") or "space-exploration-news").strip().strip("/")
OUT = "/work/outputs/"


def rel(name):
    """Path relative to the server's outputs/, inside this project's folder."""
    name = name[len(OUT):] if name.startswith(OUT) else name.lstrip("/")
    if name == PROJECT or name.startswith(PROJECT + "/"):
        return name
    return f"{PROJECT}/{name}"


def server_path(p):
    """Move a /work/outputs/ path into this project's folder; leave other paths alone."""
    if isinstance(p, str) and (p.startswith(OUT) or p == OUT.rstrip("/")):
        return OUT + rel(p[len(OUT):] if p.startswith(OUT) else "")
    return p


def server_arg(a):
    """Same for one CLI argument, including the --flag=/work/outputs/... form."""
    if isinstance(a, str) and "=" + OUT in a and not a.startswith(OUT):
        k, v = a.split("=", 1)
        return f"{k}={server_path(v)}"
    return server_path(a)


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

    def tool(self, name, args, timeout=200, quiet=False):
        """Call a tool and print its result. With quiet=True, return the text instead of printing."""
        res = self.rpc("tools/call", {"name": name, "arguments": args}, timeout=timeout)
        shown, texts = 0, []
        for part in res.get("content", []):
            if part.get("type") == "text":
                texts.append(part.get("text", ""))
                if not quiet:
                    print(part.get("text", ""))
            elif quiet:
                continue
            elif part.get("type") == "image":
                os.makedirs(os.path.join(".craft", "previews"), exist_ok=True)
                ext = (part.get("mimeType") or "image/png").split("/")[-1]
                shown += 1
                path = os.path.join(".craft", "previews", f"preview-{int(time.time())}-{shown}.{ext}")
                with open(path, "wb") as f:
                    f.write(base64.b64decode(part.get("data", "")))
                print(f"[preview saved: {path}]")
        if quiet:
            return "\n".join(texts), bool(res.get("isError"))
        if res.get("isError"):
            sys.exit(1)


def download(name, dest):
    resp = http("/files/" + urllib.parse.quote(name))
    os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
    with open(dest, "wb") as f:
        while True:
            chunk = resp.read(1 << 16)
            if not chunk:
                break
            f.write(chunk)
    return dest


PREVIEW_MAX = 1024
IMAGE_EXTS = (".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".gif", ".bmp")


def preview(name, page=1):
    """Make a small image of an exported file and download it, so the result can be looked at."""
    name = rel(name)
    stem, ext = os.path.splitext(os.path.basename(name))
    ext = ext.lower()
    server = OUT + name
    sess = Session()
    if ext == ".pdf":
        small = f"{PROJECT}/.previews/{stem}-p{page}.png"
        out, err = sess.tool("artcraft_cli", {"app": "pdfcraft", "args": [
            "render", server, "--page", str(page), "--dpi", "72", "--out", "/work/outputs/" + small]}, quiet=True)
        if err or '"exit_code":0' not in out.replace(" ", ""):
            die(f"could not render page {page} of {name}: {out[:400]}")
    elif ext in IMAGE_EXTS:
        out, err = sess.tool("artcraft_cli", {"app": "photocraft", "args": ["info", server]}, quiet=True)
        try:
            info = json.loads(out).get("result", {})
            longest = max(int(info["width"]), int(info["height"]))
        except Exception:
            die(f"could not read the size of {name}: {out[:400]}")
        if longest <= PREVIEW_MAX:
            small = name
        else:
            small = f"{PROJECT}/.previews/{stem}-preview.png"
            pct = max(1, int(PREVIEW_MAX * 100 / longest))
            out, err = sess.tool("artcraft_run", {"app": "photocraft", "input": server,
                                                  "steps": [{"id": "image.imageSize", "params": {"percent": pct}}],
                                                  "output": "/work/outputs/" + small}, quiet=True)
            if err or '"exit_code":0' not in out.replace(" ", ""):
                die(f"could not shrink {name}: {out[:400]}")
        print(f"{name} is {info['width']} x {info['height']} px")
    else:
        die(f"cannot preview {ext or 'this'} files directly. Export a PDF or PNG of the same document "
            "(for a deck, export PDF and preview each page), then preview that.")
    dest = download(small, os.path.join(".craft", "previews", os.path.basename(small)))
    print(f"preview saved: {dest}")
    print("Open that image and look at it before reporting. If you cannot view images, say so in the task.")


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
        for k in ("input", "output"):
            if k in args:
                args[k] = server_path(args[k])
        Session().tool("artcraft_run", args, timeout=int(args.get("timeout_ms", 120000)) / 1000 + 60)
    elif cmd == "cli":
        if len(rest) < 2:
            die("usage: craft.py cli APP ARG [ARG...]")
        Session().tool("artcraft_cli", {"app": rest[0], "args": [server_arg(a) for a in rest[1:]]})
    elif cmd == "files":
        resp = http(f"/files/{urllib.parse.quote(PROJECT)}/", headers={"Accept": "application/json"})
        for e in json.loads(resp.read() or "[]"):
            kind = "dir " if e.get("is_dir") else "file"
            print(f"{kind} {e.get('size', 0):>10}  {e.get('mod_time', '')[:19]}  {e.get('name')}")
    elif cmd == "get":
        if not rest:
            die("usage: craft.py get NAME [DEST]")
        name = rel(rest[0])
        # default under .craft/ (git-ignored in sen-app) so downloads never get committed
        dest = rest[1] if len(rest) > 1 else os.path.join(".craft", "downloads", os.path.basename(name))
        download(name, dest)
        print(f"saved {dest} ({os.path.getsize(dest)} bytes)")
    elif cmd == "preview":
        if not rest:
            die("usage: craft.py preview NAME [--page N]")
        page = int(rest[rest.index("--page") + 1]) if "--page" in rest and rest.index("--page") + 1 < len(rest) else 1
        preview(rest[0], page)
    else:
        die(f"unknown command {cmd!r}; run craft.py --help")


if __name__ == "__main__":
    main(sys.argv[1:])
