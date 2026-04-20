#!/bin/bash
set -e

rm -f "$HOME/.scoreboard/scoreboard.db"
echo "Removed database."

go run ./cmd/seed
