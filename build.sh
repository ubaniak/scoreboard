#!/bin/bash
set -e
cd frontend && npm run build && cd ..
rm -rf cmd/frontend/out
mkdir -p cmd/frontend
cp -r frontend/out cmd/frontend/out
go build -o scoreboard ./cmd