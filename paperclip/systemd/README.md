# Running on the EC2 host (Amazon Linux 2023)

User units, all bound to 127.0.0.1. Install with:

    cp systemd/*.service ~/.config/systemd/user/
    systemctl --user daemon-reload
    systemctl --user enable --now paperclip-sen sen-qa-browser sen-qa-app agent-office hermes-dashboard
    loginctl enable-linger ec2-user   # keep them running with nobody logged in

From a laptop, tunnel the UIs (the `senhq` SSH alias):

    ssh -N -L 3100:127.0.0.1:3100 -L 5183:127.0.0.1:5183 -L 9119:127.0.0.1:9119 senhq

then open http://localhost:3100 (Paperclip) , http://localhost:5183 (office) and
http://localhost:9119/chat (Hermes chat; no login, so keep it on the tunnel).
Paperclip runs in local_trusted mode: anything that reaches port 3100 is the
board, so never expose these ports publicly.

## ArtCraft design apps for Richard and Erlich

The Craft apps run on the separate `artcraft-cloud` instance
(github.com/elmunoz42/artcraft-aws-server), weekdays 5pm to 9pm Pacific only.
Its MCP endpoint, `http://<artcraft-cloud private IP>:8811/mcp`, accepts only
this host's private IP and needs its bearer token, which lives in
`/opt/artcraft-cloud/.env` (`MCP_TOKEN`) on that instance. Nothing about it is in
this repo. Three places hold the token on this host:

- **Paperclip runs (Erlich).** Company secret `ARTCRAFT_MCP_TOKEN`, bound in
  Erlich's adapter env together with `ARTCRAFT_MCP_URL`. The `artcraft-apps`
  skill's `craft.py` reads them.
- **Paperclip runs (Richard).** Same skill. Hermes keeps the token as
  `MCP_ARTCRAFT_API_KEY` in `~/.hermes/.env`, and `craft.py` falls back to it.
  His toolsets include `vision` so he can look at the previews. Do not add
  `mcp-artcraft` to his `--toolsets`: Hermes rejects that runtime name there.
- **Hermes web chat (you with Richard).** In `~/.hermes/config.yaml`:

      mcp_servers:
        artcraft:
          url: "http://<artcraft-cloud private IP>:8811/mcp"
          headers:
            Authorization: "Bearer ${MCP_ARTCRAFT_API_KEY}"
          connect_timeout: 8

  then `systemctl --user restart hermes-dashboard`. Check with
  `hermes mcp test artcraft` (it only connects while the instance is up).

If a Paperclip run of Richard's fails with "Cannot reconcile Hermes skill ...
occupied by another installation", a skill sync left a stale symlink in
`~/.hermes/skills/<skill>--<hash>`. Delete the symlink and rerun; Paperclip
recreates it.

## Ubuntu 24.04: allow the agent sandbox

Ubuntu blocks unprivileged user namespaces by default, and the Codex sandbox
(bubblewrap) needs them; without this, agent runs fail with
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Apply the
narrow profile in `apparmor-bwrap` (only bubblewrap gets the permission):

    sudo install -m 644 systemd/apparmor-bwrap /etc/apparmor.d/bwrap-userns
    sudo apparmor_parser -r /etc/apparmor.d/bwrap-userns

The Paperclip unit preloads the runner platform probe (see the comment in
`paperclip-sen.service`); without it Paperclip reports the Paperclip Runner
unavailable on a 2-vCPU instance.

## Tools agents can see

The Paperclip Runner sandbox hides the home folder and `/opt`, so tools agents
call must live under `/usr/local`:

    sudo cp -a ~/.nvm/versions/node/v24.20.0 /usr/local/lib/node-v24.20.0
    for b in node npm npx codex; do sudo ln -sf /usr/local/lib/node-v24.20.0/bin/$b /usr/local/bin/$b; done
    sudo python3 -m venv /usr/local/lib/tavily-cli-venv
    sudo /usr/local/lib/tavily-cli-venv/bin/pip install tavily-cli==0.2.1 tavily-python==0.8.5

plus the `tvly` wrapper in `/usr/local/bin/tvly` (it sets HOME to
`$PWD/.tavily-home` and execs `/usr/local/lib/tavily-cli-venv/bin/tvly`).
Verified with SPA-56 on 13 Nov 2026.
