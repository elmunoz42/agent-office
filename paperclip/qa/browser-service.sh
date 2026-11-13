#!/usr/bin/env bash
# Host-side headless browser for sandboxed Paperclip agents (QA).
# Agents cannot launch a browser inside the Codex sandbox, but they can reach
# localhost, so they connect to this Playwright server instead:
#   PW_WS_ENDPOINT=ws://127.0.0.1:9323/pw
# Loopback only. Uses the browser installed inside the project's node_modules.
PROJECT="${1:-$HOME/dev/space-exploration-news/sen-app}"
cd "$PROJECT" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export PLAYWRIGHT_BROWSERS_PATH=0
exec node_modules/.bin/playwright run-server --host 127.0.0.1 --port 9323 --path /pw
