#!/bin/bash
set -e
cd frontend && rm -rf dist && npm run build && cd ..
rm -rf cmd/frontend/dist
mkdir -p cmd/frontend
cp -r frontend/dist cmd/frontend/dist
go build -o scoreboard ./cmd