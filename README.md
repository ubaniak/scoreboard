# Scoreboard

A boxing tournament scoreboard that runs as a single self-contained binary. Judges score bouts in real time via a web UI; admins manage cards, bouts, and rounds. The React frontend is embedded in the Go binary at build time.

## Requirements

- Go 1.25+
- Node.js 20.19+ or 22.12+
- npm

## Quick start

```bash
./build.sh
./scoreboard
```

Opens a browser at `http://localhost:8080` and creates a system tray icon.

## Build

### Production binary (all platforms)

```bash
./build.sh
```

Builds the React frontend, embeds it into the Go binary, then cross-compiles for all supported platforms. Output goes to `build/`:

```
build/
  darwin_amd64/scoreboard
  darwin_arm64/scoreboard
  linux_amd64/scoreboard
  linux_arm64/scoreboard
  linux_arm/scoreboard
  windows_amd64/scoreboard.exe
  windows_arm64/scoreboard.exe
```

### Backend only

```bash
go build -o scoreboard ./cmd
```

### Frontend only

```bash
cd frontend && npm run build
```

## Development

Run the backend and frontend separately for hot reload:

```bash
# Terminal 1 — Go backend
go build -o scoreboard ./cmd && ./scoreboard

# Terminal 2 — Vite dev server (proxies /api/* and /uploads to :8080)
cd frontend && npm run dev
```

The Vite dev server starts at `http://localhost:5173`.

## Seeding

To reset the database and populate it with sample data:

```bash
./reset.sh
```

This removes the existing database and runs the seed command, which creates clubs, athletes, a card, and 100 bouts with generated images.

## Testing

```bash
# All packages
go test ./...

# Single package
go test ./internal/bouts/...

# Verbose with Ginkgo runner
go run github.com/onsi/ginkgo/v2/ginkgo ./internal/bouts/...
```

## Data

The app stores data in `~/.scoreboard/`:

```
~/.scoreboard/
  scoreboard.db   ← SQLite database
  uploads/        ← uploaded images (athletes, clubs, cards)
```
