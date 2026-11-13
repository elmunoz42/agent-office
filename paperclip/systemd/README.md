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
