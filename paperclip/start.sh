#!/bin/zsh
# Starts the Space Exploration News Paperclip instance.
#   - runs on the Node 24 pinned in this folder (the system Node is too old)
#   - state lives in ~/.paperclip-sen, separate from any default ~/.paperclip
#   - loopback only: UI + API at http://localhost:3100
set -e
cd "$(dirname "$0")"
export PATH="$PWD/node_modules/.bin:$PATH"
DATA="$HOME/.paperclip-sen"
if [ ! -f "$DATA/instances/default/config.json" ]; then
  # first run: accept the quickstart defaults without the interactive wizard
  exec paperclipai onboard --yes --bind loopback --no-install-service --data-dir "$DATA"
fi
exec paperclipai run --data-dir "$DATA" "$@"
