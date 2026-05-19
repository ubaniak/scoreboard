#!/usr/bin/env bash
# Boot scoreboard against a fresh datadir, run cmd/loadtest, tear down.
# Usage: ./scripts/run-loadtest.sh [-- <loadtest flags>]
#   ./scripts/run-loadtest.sh                       # 100 bouts / 3 judges / 3 rounds
#   ./scripts/run-loadtest.sh -- -bouts=20 -judges=5
#   ./scripts/run-loadtest.sh -- -skip-flow         # seed only, leave server running with KEEP=1
set -euo pipefail

# Strip leading "--" so callers can write: run-loadtest.sh -- -bouts=20
if [[ "${1:-}" == "--" ]]; then shift; fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

KEEP="${KEEP:-0}"
PORT="${PORT:-8080}"
DATADIR="$(mktemp -d -t scoreboard-loadtest-XXXXXX)"
LOG="$DATADIR/server.log"
BIN="$DATADIR/bin"
mkdir -p "$BIN"

echo "==> fresh datadir: $DATADIR"
echo "==> build binaries (using normal GOPATH/HOME)"
go build -o "$BIN/scoreboard" ./cmd
go build -o "$BIN/loadtest" ./cmd/loadtest

# Server reads HOME for its data dir; isolate that only when launching.
export HOME="$DATADIR"

cleanup() {
  local code=$?
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "==> stopping server (pid $SERVER_PID)"
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  if [[ "$KEEP" == "1" ]]; then
    echo "==> KEEP=1; preserved datadir: $DATADIR"
    echo "    logs: $LOG"
  else
    rm -rf "$DATADIR"
  fi
  exit $code
}
trap cleanup EXIT INT TERM

echo "==> start scoreboard (logs: $LOG)"
"$BIN/scoreboard" >"$LOG" 2>&1 &
SERVER_PID=$!

echo "==> wait for server on :$PORT"
for _ in $(seq 1 50); do
  if curl -fsS "http://localhost:$PORT/api/hc" >/dev/null 2>&1 \
     || curl -fsS "http://localhost:$PORT/api/setup/status" >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

if ! curl -fsS "http://localhost:$PORT/api/setup/status" >/dev/null 2>&1; then
  echo "server failed to start; tail of log:" >&2
  tail -n 40 "$LOG" >&2 || true
  exit 1
fi

CREDS="$DATADIR/creds.json"
echo "==> run loadtest (creds: $CREDS)"
"$BIN/loadtest" -base "http://localhost:$PORT" -creds-out "$CREDS" "$@"
echo "==> credentials available at $CREDS"
if [[ "$KEEP" == "1" ]]; then
  echo "    export SCOREBOARD_CREDS=$CREDS  # for Playwright"
fi

if [[ "$KEEP" == "1" ]]; then
  echo "==> KEEP=1; server still running at http://localhost:$PORT (pid $SERVER_PID)"
  echo "    press Ctrl-C to stop"
  wait "$SERVER_PID"
fi
