.PHONY: run_frontend run_backend build installers installer lint help loadtest loadtest_seed e2e seed seed_scored seed_reset

help:
	@echo "Available targets:"
	@echo "  make run_frontend    - Start frontend dev server (Vite on :5173)"
	@echo "  make run_backend     - Start backend server (Go on :8080)"
	@echo "  make build           - Build full app (frontend + backend binary)"
	@echo "  make installers      - Build all three installers (macOS .dmg, Windows .zip, Linux .deb)"
	@echo "  make lint            - Run frontend linter"
	@echo "  make loadtest        - Run full e2e load test (fresh DB, 100 bouts, 3 judges)"
	@echo "  make loadtest_seed   - Seed only (no scoring); leaves server up. Use Ctrl-C to stop."
	@echo "  make e2e             - Seed + run Playwright spot-check"
	@echo "  make seed            - Seed default DB with 100 bouts / 3 judges (no scoring)"
	@echo "  make seed_scored     - Seed and fully score+complete every bout"
	@echo "  make seed_reset      - Wipe default DB then reseed 100 bouts"

run_frontend:
	cd frontend && npm run dev

run_backend:
	go run ./cmd

build:
	./build.sh

installers:
	./build.sh

installer: installers

lint:
	cd frontend && npm run lint

loadtest:
	./scripts/run-loadtest.sh

loadtest_seed:
	KEEP=1 ./scripts/run-loadtest.sh -- -skip-flow

e2e:
	./scripts/run-e2e.sh

seed:
	go run ./cmd/seed

seed_scored:
	go run ./cmd/seed -scored

seed_reset:
	rm -f $$HOME/.scoreboard/scoreboard.db
	go run ./cmd/seed
