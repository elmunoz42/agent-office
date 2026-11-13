#!/usr/bin/env bash
# Host-side app server for the project agents work in, so they can browser-test
# at http://127.0.0.1:3000 (agents cannot start servers inside the sandbox).
#
# It serves whichever checkout was BUILT MOST RECENTLY: the main checkout or any
# task worktree (../worktrees/*). So the flow for an agent is: run `npm run build`
# in your own checkout, wait until the page at 127.0.0.1:3000 contains your
# .next/BUILD_ID, then test. One build is served at a time. Loopback only.
PROJECT="${1:-$HOME/dev/space-exploration-news/sen-app}"
WORKTREES="${2:-$(dirname "$PROJECT")/worktrees}"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export NEXT_TELEMETRY_DISABLED=1
pid=""; current=""
trap '[[ -n "$pid" ]] && kill "$pid" 2>/dev/null; exit 0' INT TERM
newest() {
  local best="" best_t=0 d t
  shopt -s nullglob
  for d in "$PROJECT" "$WORKTREES"/*/; do
    d="${d%/}"
    [[ -f "$d/.next/BUILD_ID" && -d "$d/node_modules" ]] || continue
    t=$(stat -c %Y "$d/.next/BUILD_ID" 2>/dev/null || stat -f %m "$d/.next/BUILD_ID")
    if (( t > best_t )); then best_t=$t; best=$d; fi
  done
  printf "%s\n" "$best"
}
while true; do
  dir=$(newest)
  key=""; [[ -n "$dir" ]] && key="$dir:$(cat "$dir/.next/BUILD_ID")"
  if [[ -n "$key" && "$key" != "$current" ]]; then
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null && wait "$pid" 2>/dev/null
    echo "[app-service] $(date '+%H:%M:%S') serving $key"
    (cd "$dir" && exec node_modules/.bin/next start --hostname 127.0.0.1 --port 3000) &
    pid=$!; current=$key
  elif [[ -n "$pid" ]] && ! kill -0 "$pid" 2>/dev/null; then
    current=""; pid=""
  fi
  sleep 3
done
