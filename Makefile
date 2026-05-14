.PHONY: run_frontend run_backend build installer lint help

help:
	@echo "Available targets:"
	@echo "  make run_frontend    - Start frontend dev server (Vite on :5173)"
	@echo "  make run_backend     - Start backend server (Go on :8080)"
	@echo "  make build           - Build full app (frontend + backend binary)"
	@echo "  make installer       - Build all three installers (macOS .dmg, Windows .zip, Linux .deb)"
	@echo "  make lint            - Run frontend linter"

run_frontend:
	cd frontend && npm run dev

run_backend:
	go run ./cmd

build:
	./build.sh

installer:
	./build.sh

lint:
	cd frontend && npm run lint
