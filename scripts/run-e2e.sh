#!/usr/bin/env bash
# Seed a fresh scoreboard instance, run Playwright e2e specs against it, tear down.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-8080}"
DATADIR="$(mktemp -d -t scoreboard-e2e-XXXXXX)"
LOG="$DATADIR/server.log"
CREDS="$DATADIR/creds.json"
BIN="$DATADIR/bin"
mkdir -p "$BIN"

echo "==> fresh datadir: $DATADIR"
echo "==> build binaries"
go build -o "$BIN/scoreboard" ./cmd
go build -o "$BIN/loadtest" ./cmd/loadtest

export HOME="$DATADIR"

cleanup() {
  local code=$?
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -rf "$DATADIR"
  exit $code
}
trap cleanup EXIT INT TERM

echo "==> start scoreboard"
"$BIN/scoreboard" >"$LOG" 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 50); do
  curl -fsS "http://localhost:$PORT/api/setup/status" >/dev/null 2>&1 && break
  sleep 0.2
done

if ! curl -fsS "http://localhost:$PORT/api/setup/status" >/dev/null 2>&1; then
  echo "server failed to start; log tail:" >&2
  tail -n 40 "$LOG" >&2
  exit 1
fi

echo "==> seed (5 bouts, no scoring)"
"$BIN/loadtest" -base "http://localhost:$PORT" -bouts=5 -judges=3 -skip-flow -creds-out "$CREDS"

echo "==> playwright"
cd frontend
if [[ ! -d node_modules/@playwright/test ]]; then
  echo "    installing @playwright/test"
  npm install --no-save --silent @playwright/test
  npx playwright install --with-deps chromium >/dev/null
fi
SCOREBOARD_CREDS="$CREDS" SCOREBOARD_URL="http://localhost:$PORT" npx playwright test
