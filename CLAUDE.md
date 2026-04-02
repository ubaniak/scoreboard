# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

A boxing tournament scoreboard application that runs as a single self-contained binary. Judges score bouts in real time via a web UI; admins manage cards, bouts, and rounds. The frontend is embedded in the Go binary at build time.

## Commands

### Full Build (frontend + backend)
```bash
./build.sh
```
This builds the React frontend, copies the dist to `cmd/frontend/dist`, then compiles the Go binary as `./scoreboard`.

### Backend only
```bash
go build -o scoreboard ./cmd
```

### Frontend (dev server with hot reload)
```bash
cd frontend && npm run dev
```
The Vite dev server proxies API calls to the Go backend running on port 8080.

### Frontend lint
```bash
cd frontend && npm run lint
```

### Run the app
```bash
./scoreboard
```
Starts an HTTP server on port 8080 and opens the browser. Also creates a system tray icon.

### Go tests (Ginkgo BDD)
```bash
go test ./...
# Single package:
go test ./internal/bouts/...
# Verbose with Ginkgo runner:
go run github.com/onsi/ginkgo/v2/ginkgo ./internal/bouts/...
```

### Regenerate mocks
```bash
go generate ./...
```

## Architecture

### Request Lifecycle
```
Browser (React SPA)
  → HTTP request to :8080
  → Gorilla Mux router (cmd/main.go)
  → CORS middleware → RBAC middleware (JWT validation)
  → App handler (internal/<domain>/app.go)
  → UseCase (internal/<domain>/usecase.go)
  → Storage (internal/<domain>/storage/)
  → SQLite via GORM (scoreboard.db)
```

### Backend Package Layout

Each domain under `internal/` follows the same three-layer pattern:
- `app.go` — HTTP handlers, route registration, request parsing
- `usecase.go` — business logic, orchestrates storage calls
- `storage/` — GORM models and DB queries

Domains: `auth`, `bouts`, `cards`, `comment`, `current`, `devices`, `login`, `officials`, `rbac`, `round`, `scores`.

`internal/current/` is special — it exposes a single unauthenticated endpoint that returns the active card/bout/round state. This is what the public scoreboard and judge pages poll.

**App registration:** every domain implements `app.Register` and wires itself into the mux in `cmd/main.go`.

**RBAC:** roles are `admin`, `judge1`–`judge5`. Admin inherits all judge permissions. Routes are protected via `rbac.Service` middleware that validates JWT claims. Public routes: healthcheck, login, `/api/current`, `/api/scoreboard`.

### Frontend Layout

- `src/pages/` — one file per route (judge, card, bout, scoreboard, home)
- `src/components/` — reusable UI components, organized by domain (`judge/`, `bouts/`, etc.)
- `src/api/` — TanStack React Query hooks wrapping a `fetchClient` (handles auth headers + error parsing)
- `src/entities/` — TypeScript interfaces mirroring backend response shapes
- `src/providers/` — React context for login state and timer
- `src/hooks/` — shared custom hooks

**Routing:** TanStack React Router (file-based, defined in `App.tsx`).
**Server state:** TanStack React Query — all API calls go through `useQuery`/`useMutation` hooks in `src/api/`.
**UI library:** Ant Design v6.

### Embedded Frontend

`cmd/main.go` embeds `frontend/dist` via `//go:embed`. When running the production binary, the Go server serves the React SPA directly. In development, run the Vite dev server separately and it proxies `/api/*` to the Go server.

### Data Model (simplified)
```
Cards → Bouts → Rounds → Scores (per judge per round)
                       → RoundFouls
                       → EightCounts
```
`current/` tracks which Card, Bout, and Round are currently active and exposes that state to unauthenticated clients.
