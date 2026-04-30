# ADR: Auto Backup

## Status
Accepted — 2026-04-30

## Context
The scoreboard runs as a single binary on a laptop at the venue.
All tournament state — cards, bouts, rounds, scores, fouls,
8-counts, judge identities — lives in one SQLite file
(`scoreboard.db`) plus an `uploads/` directory of fighter photos
and card assets. There is no central server, no replica, and the
operator running the laptop is not a sysadmin. A disk failure, an
accidental delete, a corrupted DB, or a wrong manual edit between
bouts would cost the tournament its entire scoring record with
nothing to fall back on.

We need a backup mechanism that:

- Runs without any operator action during the event.
- Captures both the DB and the uploads, since they are referenced
  from rows in the DB.
- Survives a laptop swap (backups must be writable to an external
  drive of the operator's choice).
- Lets an admin restore from a known-good point without leaving
  the app.
- Does not interrupt scoring or block HTTP requests.

## Decision

### Trigger: bout start
Backups fire on the `not_started → in_progress` transition of a
bout, not on a timer. The rationale is operational:

- Between bouts is the only natural quiet point. During a round,
  judges are submitting scores and any I/O contention is
  user-visible.
- One backup per bout gives a per-bout recovery granularity, which
  matches how disputes are scoped ("redo bout 7"), and bouts are
  the unit of work the operator already thinks in.
- A wall-clock cron would either fire mid-round or require its own
  "is anything happening right now" guard; bout-start already is
  that guard.

Wiring: `internal/bouts/usecase.SetBoutStartHook` registers a
callback that `cmd/main.go` points at
`backup.App.TriggerIfEnabled`. The hook is called via `go` from
inside the bout transition (`internal/bouts/usecase.go` ~195) so
the HTTP response to the admin who started the bout never waits
on zip I/O.

### Opt-in, persisted config
`backup.Config` (`enabled`, `backupDir`) is stored as
`~/.scoreboard/backup_config.json`. Default is **disabled** with a
default `backupDir` inside the data dir; the operator must turn it
on and is encouraged to point it at an external drive.

`TriggerIfEnabled` no-ops when `enabled=false`, so the hook is
always wired but inert until the operator opts in. This means the
feature can ship without changing behaviour for anyone who hasn't
configured it.

### Archive format
Each backup is a single zip:

```
YYYY-MM-DD-HH-MM-SS-scoreboardDB.zip
  scoreboard.db
  uploads/<...>
```

- Zip, not tar.gz: the operator opens these on macOS/Windows from
  Finder/Explorer to verify, and zip is the lowest-friction
  format for that audience.
- Filename embeds a sortable local-time stamp; the suffix
  `-scoreboardDB.zip` is also the validation token used by the
  filename guard (see Guards).
- Uploads are walked and added relative to `datadir.UploadsDir()`.
  Missing uploads dir is tolerated (`_ = filepath.Walk(...)`)
  because a fresh install legitimately has none.

### Retention
`maxBackups = 4`. After every successful `CreateBackup`,
`pruneOldBackups(4)` deletes everything older than the newest
four. Reasoning:

- A tournament card has many bouts, so without a cap the backup
  dir would fill the operator's drive over a single event.
- Four is enough to roll back through the last few bouts, which is
  the realistic dispute window. Anything older than "a few bouts
  ago" is not actionable mid-event anyway.
- Keeping the cap small also keeps the restore picker readable.

### Restore
`POST /api/backup/restore` with a filename:

1. Validate the filename through the same guard used everywhere
   (no `/`, no `..`, must end in `-scoreboardDB.zip`).
2. Open the zip; for each entry:
   - `scoreboard.db` → extract over `dbPath` via temp-file +
     `os.Rename` (atomic on the same filesystem).
   - `uploads/<rel>` → extract under `datadir.UploadsDir()`,
     creating subdirs as needed, also via temp-file + rename.
3. Refuse the restore if `scoreboard.db` was not present in the
   archive — a partial restore would leave uploads referencing
   rows that no longer exist.

Restore does **not** stop the running process. The operator is
expected to quit after restoring (the `POST /api/backup/quit`
endpoint exists for exactly this) and reopen, so GORM picks up the
swapped DB file cleanly. We chose this over an in-process reload
because GORM holds open file handles and the SQLite WAL needs to
be re-opened — a clean process restart is simpler and less
error-prone than orchestrating an in-flight handover.

### Path safety
Three filename guards, all identical, on `BackupFilePath`,
`DeleteBackup`, and `RestoreBackup`:

- reject `/` (no traversal into subdirs of `backupDir`)
- reject `..` (no escape upward)
- require the `-scoreboardDB.zip` suffix (only files we wrote)

Inside the zip, entries containing `..` are skipped, and only
`scoreboard.db` plus paths under `uploads/` are extracted —
anything else in a zip is ignored. This is defence in depth
against a tampered archive being placed in the backup dir.

### Native directory picker
`POST /api/backup/pick-dir` opens the OS-native folder dialog via
`github.com/sqweek/dialog`, build-tagged per-platform
(`pickdir_darwin.go`, `pickdir_other.go`). We do this rather than
typing a path into a text field because:

- Operators are non-technical and do not know what an absolute
  path looks like for an external drive.
- The native picker validates that the path exists and is
  writable, before we try to use it.

The dialog runs in the Go process (which is also the system tray
owner), so it has the right window association on macOS.

### Authorisation
All backup endpoints are `rbac.Admin`-only. Judges cannot list,
create, restore, or delete backups, and the routes are not
reachable without a valid admin JWT. The trigger hook fires from
inside an admin-gated bout transition, so the auto-path is also
implicitly admin-driven.

## Consequences

### Pros
- Zero-config behaviour for users who don't enable it; one toggle
  + one folder pick for users who do.
- Backups happen automatically at the moment the operator is least
  busy, with no separate scheduler to babysit.
- Single zip per backup is trivially copyable to another machine
  or cloud drive by the operator.
- Restore is a single endpoint that handles DB and uploads
  together, so the two cannot drift.
- Goroutine-dispatched trigger means a slow disk on the backup
  target never delays a bout starting.

### Cons / Trade-offs
- **No backup result surfaced to the operator.** The trigger
  ignores errors (`_ = uc.CreateBackup()`). If the external drive
  is unplugged, backups silently stop. A future iteration should
  surface the last-backup status (timestamp + ok/err) to the admin
  UI.
- **Four-backup cap is global, not per-card.** Running a long card
  means earlier bouts on that same card fall out of the window.
  Acceptable because an event laptop is typically copied to
  permanent storage after the event; not acceptable if anyone
  wants days-deep history on the device itself.
- **No backup of `~/.scoreboard/` config files** (login secrets,
  judge device pairings, this very `backup_config.json`). Restore
  brings back the DB and uploads but not operator config.
  Intentional: the config is per-machine and shouldn't ride along
  with a DB moved to a different laptop.
- **Restore requires a process restart** to be safe. The `quit`
  endpoint makes this one click, but it does drop the tray icon
  and the open browser session.
- **No backup integrity check.** We do not store or verify a
  checksum; a corrupted zip will fail at extract time but we do
  not detect rot proactively.
- **Filename-based identity.** Two backups created in the same
  second collide on filename and the second overwrites the first.
  In practice bouts are minutes apart, so this is theoretical, but
  worth noting if the trigger ever moves to round-start.

## Alternatives considered

- **Cron-style timer (every N minutes).** Rejected: fires
  mid-round, ignores whether anything has changed since the last
  backup, and produces a lot of identical archives during quiet
  periods.
- **WAL shipping / continuous replication.** Rejected: massive
  overkill for a single-laptop tournament tool, and the operator
  has no second machine to ship to in the common case. Zip + USB
  drive is the right shape for the deployment.
- **Backup the data dir wholesale, not just DB + uploads.**
  Rejected: pulls in `backup_config.json` itself, the JWT signing
  key, and per-machine session state, all of which actively
  shouldn't move between machines on restore.
- **Trigger on round end instead of bout start.** Considered;
  bout-start wins because the bout's *previous* round is already
  on disk by then, and bout-start is a more visible, less
  frequent event for the operator to reason about.
- **Live in-process restore (swap DB without quitting).**
  Rejected: would require closing GORM, reopening the connection
  pool, and re-priming caches mid-flight. Quit + relaunch is two
  seconds and removes a class of bugs.
- **Encrypt backups at rest.** Not done. Backups contain fighter
  PII (names, photos) but live on a drive the operator already
  controls; key management for a non-technical user would create
  more risk (lost key = lost backup) than the encryption removes.

## References
- `internal/backup/usecase.go` — `Config`, `CreateBackup`,
  `RestoreBackup`, `pruneOldBackups`, filename guards.
- `internal/backup/app.go` — HTTP routes, `TriggerIfEnabled`,
  admin RBAC wiring, `Quit`.
- `internal/backup/pickdir_darwin.go`,
  `internal/backup/pickdir_other.go` — native directory picker.
- `internal/bouts/usecase.go` ~190–197 — bout-start hook
  invocation.
- `cmd/main.go` ~234–240 — usecase construction and hook wiring.
- `internal/datadir` — `Dir()` and `UploadsDir()` resolution.
- `frontend/src/pages/` — admin backup UI (config, list,
  restore, download).
