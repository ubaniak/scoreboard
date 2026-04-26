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

## Installers

### Building installers

Run the full build script. Installers are created automatically alongside the binaries:

```bash
./build.sh
```

What gets created depends on the host OS:

| Host OS | Installer produced |
|---------|-------------------|
| macOS | `build/scoreboard_darwin_amd64.dmg`, `build/scoreboard_darwin_arm64.dmg` |
| Any | `build/scoreboard_windows_amd64.zip`, `build/scoreboard_windows_arm64.zip` |
| Linux | `build/scoreboard_linux_amd64.deb`, `build/scoreboard_linux_arm64.deb`, `build/scoreboard_linux_armhf.deb` |

> **Linux .deb** requires `dpkg-deb` (installed by default on Debian/Ubuntu). The build script skips it silently on macOS/Windows.

---

### macOS — install from .dmg

1. Open the `.dmg` for your chip (`amd64` = Intel, `arm64` = Apple Silicon).
2. Drag `Scoreboard.app` to your Applications folder.
3. Double-click `Scoreboard` in Applications to launch.
4. On first launch macOS may show a security warning — open **System Settings → Privacy & Security** and click **Open Anyway**.
5. A system tray icon appears. Click **Open UI** or navigate to `http://localhost:8080`.

---

### Windows — install from .zip

1. Extract the `.zip` for your architecture (`amd64` for most machines).
2. Right-click `install.ps1` → **Run with PowerShell**.
   - If prompted about execution policy, run this first in PowerShell as Administrator:
     ```powershell
     Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
     ```
   - To also add Scoreboard to your PATH: `.\install.ps1 -AddToPath`
3. The installer copies `scoreboard.exe` to `%LOCALAPPDATA%\Scoreboard` and creates Desktop + Start Menu shortcuts.
4. Launch from the Desktop shortcut or Start Menu.
5. A system tray icon appears. The app runs at `http://localhost:8080`.

To uninstall:
```powershell
Remove-Item -Recurse "$env:LOCALAPPDATA\Scoreboard"
# Then delete the Desktop / Start Menu shortcuts manually
```

---

### Linux — install from .deb

```bash
sudo dpkg -i scoreboard_linux_amd64.deb
scoreboard
```

The binary is placed at `/usr/local/bin/scoreboard` and a `.desktop` entry is added so it appears in application launchers.

To uninstall:
```bash
sudo dpkg -r scoreboard
```

For `arm64` or `armhf` (Raspberry Pi), use the matching `.deb` file.

---

### First-time setup

On the **first launch** (no admin account exists yet), the app automatically redirects to the setup wizard at `http://localhost:8080/setup`:

1. Click **Initialize Application** — this generates a one-time admin code.
2. The code is displayed on screen. Copy it.
3. Click **Copy Code & Go to Login**.
4. On the login page, select role **admin** and paste the code.

After logging in, use **Devices → Admin Password** (or the system tray **Admin Password** item) to generate new admin codes at any time.

---

## Data

The app stores data in `~/.scoreboard/`:

```
~/.scoreboard/
  scoreboard.db   ← SQLite database
  uploads/        ← uploaded images (athletes, clubs, cards)
```
