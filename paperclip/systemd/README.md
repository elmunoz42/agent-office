# Running on the EC2 host (Amazon Linux 2023)

User units, all bound to 127.0.0.1. Install with:

    cp systemd/*.service ~/.config/systemd/user/
    systemctl --user daemon-reload
    systemctl --user enable --now paperclip-sen sen-qa-browser sen-qa-app agent-office
    loginctl enable-linger ec2-user   # keep them running with nobody logged in

From a laptop, tunnel the UIs (the `senhq` SSH alias):

    ssh -N -L 3100:127.0.0.1:3100 -L 5183:127.0.0.1:5183 senhq

then open http://localhost:3100 (Paperclip) and http://localhost:5183 (office).
Paperclip runs in local_trusted mode: anything that reaches port 3100 is the
board, so never expose these ports publicly.

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
