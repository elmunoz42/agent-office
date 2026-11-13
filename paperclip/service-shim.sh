#!/bin/zsh
# Launcher used by the macOS background service (launchd) for the Space
# Exploration News Paperclip instance. launchd starts with a bare PATH, so
# this puts the pinned Node 24 first and then the login-shell PATH captured
# at install time (agents need git, npm, etc. when they run).
# Reinstall the service if this folder moves (paperclipai service install with
# PAPERCLIP_HOME and PAPERCLIP_SHIM_PATH set). Must not live under ~/Desktop:
# macOS blocks background services from reading it.
DIR="${0:A:h}"
export PATH="$DIR/node_modules/.bin:/Users/carlosm.kampff/.local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin:/opt/pmk/env/global/bin:/Users/carlosm.kampff/.local/bin:/Users/carlosm.kampff/Library/pnpm"
export PAPERCLIP_HOME="${PAPERCLIP_HOME:-$HOME/.paperclip-sen}"
exec "$DIR/node_modules/.bin/paperclipai" "$@"
