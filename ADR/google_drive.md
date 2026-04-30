# ADR: Google Drive Import / Export

## Status
Accepted — 2026-04-30

## Context
The scoreboard runs on a single laptop at the venue. Operators need
to (a) get tournament data **into** the app — athletes, clubs,
provinces, nations, officials, and a card's bouts — and (b) get
results **out** at the end so they can be filed, shared with the
sanctioning body, or archived.

Operators are not technical. They are tournament administrators who
already use Google Sheets for entry lists and brackets. Asking them
to hand-edit JSON, paste CSVs into endpoints, or run a CLI is not
realistic.

We need a data flow that:

- Lets non-technical users prepare a card before the event in a
  tool they already know (Google Sheets).
- Imports many entities at once — affiliations, athletes,
  officials, and the bout list — in one click, idempotently.
- Re-imports cleanly when the operator fixes a typo and runs it
  again, without producing duplicates.
- Exports the final per-card report bundle (PDFs, CSVs) somewhere
  the operator and the federation can both reach, without the
  operator manually attaching files to email.
- Authenticates per-laptop, with no shared service account.

## Decision

### Google Sheets as the import format
Operators author one Sheet per card with named tabs:
`Affiliations`, `Clubs`, `Provinces`, `Nations`, `Athletes`,
`Officials`, `Cards`. The importer pulls each tab via the Sheets
API and upserts.

Reasons over CSV upload or JSON:
- Multiple sheets/relationships in one document, with column
  validation possible via Sheets data validation.
- Operators already share Sheets with each other; CSV exports lose
  the multi-tab structure.
- Live editing — the federation can fix a name in the source of
  truth and re-import, no file shuffle.

### Per-tab semantics
- **Affiliations** is the canonical sheet: `Name`, `Type`
  (`club` / `province` / `nation`). One row per organisation, type
  decides which "find or create" path runs.
- **Clubs / Provinces / Nations** are legacy single-type tabs kept
  for backward compatibility with older operator templates. Both
  paths route to the same `clubs.FindOrCreate*` upserts.
- **Athletes** has `Name, Age Category, Nationality, Club,
  Province`. Club and Province are looked up by name (auto-created
  if missing) and linked via `ClubAffiliationID` /
  `ProvinceAffiliationID`. Age Category and Nationality are
  ignored on import today (athletes get those at bout time); the
  columns exist so the operator can keep that data alongside.
- **Officials** has `Name, Nationality, Year of Birth,
  Registration Number`. Identity is `(name, registration number)`.
- **Cards** has one row per bout: `Card Name, Date, Bout Number,
  Bout Type, Red Athlete, Blue Athlete, Age Category, Experience,
  Gender, Round Length, Glove Size`. Athletes are resolved by name
  only; their club/province come from the Athletes tab. The card
  is `FindOrCreateByName(name, date)` so re-running the import
  reattaches bouts to the existing card.

Club/Province columns were intentionally **removed** from the
Cards tab. Earlier templates duplicated club info there, which led
to the same athlete being created twice when the operator typed
the club name slightly differently between sheets. Athletes-tab is
now the sole source for athlete affiliation, which keeps
disambiguation in one place.

### Idempotent upserts
Every import path is `FindOrCreate*`, never a blind insert. The
operator is expected to run an import multiple times during card
prep — adding a missing fighter, fixing a typo, swapping a bout
order — and each run must converge on the same DB state, not pile
up duplicates.

For athletes specifically, `FindOrCreateByNameClubProvince` will
**back-fill** a missing province on an existing athlete. This
exists because an operator's first import often predates the
Provinces tab being filled in; a second run should enrich the row,
not be a no-op.

### Auth: per-laptop OAuth, not service account
The operator pastes their own Google OAuth Client ID and Secret
into the admin UI; the app drives the OAuth code flow with
RedirectURL `http://localhost:8080/api/gdrive/callback`. The
refresh token is persisted to `~/.scoreboard/gdrive_token.json`.

Reasons:
- A shared service account would require us to ship a secret in
  the binary, and any single org's quota or revocation would break
  every install.
- Per-laptop credentials mean each federation owns its own Drive
  scope; we never see their data.
- Localhost redirect is allowed by Google for desktop apps and
  works without a public callback URL.

Tokens live next to the backup config in `~/.scoreboard/`,
excluded from auto-backup zips by the same reasoning as the
backup ADR — credentials are per-machine state.

### Multi-sheet config
`gdrive_config.json` stores `[]Sheet { CardName, SheetID }`.
`ImportAll` iterates the configured sheets so a federation running
several cards over a weekend can register each Sheet once and
re-import any of them on demand. Per-sheet import (`Import(id)`)
is also exposed for the case where only one card needs refreshing.

### Template generator
`POST /gdrive/template` calls the Sheets API to create a new
spreadsheet pre-populated with the expected tab structure, header
rows, and one example row per tab. The operator clicks "create
template", gets a Drive URL back, edits in place, and feeds the
sheet ID back to the app.

We chose generating-then-editing over a downloadable XLSX
template because:
- The result lives in the operator's Drive automatically — no
  upload step.
- Header names and tab names cannot drift from what the importer
  expects, since both come from the same file in Go.
- Updating the template is a code change, not a file-distribution
  problem.

### Export: per-card folder of report files
`POST /gdrive/export/{cardId}` builds the same report artifacts
that the local download endpoints produce (full report,
public-facing report, judge-consistency report) and uploads them
to a Drive folder named after the card. The response returns the
folder link plus per-file links so the admin UI can show clickable
results.

This goes to Drive rather than email/Slack/etc. because Drive is
already authorised for import; reusing the same OAuth scope
avoids a second connection flow and a second permission grant.

### Authorisation
All `/gdrive/*` routes are `rbac.Admin`-only except
`/gdrive/callback`, which has to be reachable by the browser
during the OAuth redirect and is protected instead by Google's
own state token in the URL.

## Consequences

### Pros
- Operators prepare cards in a tool they already know, in
  parallel with other federation staff editing the same Sheet.
- Idempotent upserts mean "re-import after fixing a typo" is a
  safe default operator habit, not a dangerous one.
- Per-laptop OAuth removes us from the secret-management business
  entirely; no shared credential, no per-org quota.
- One template generator keeps schema drift between docs and code
  impossible.
- Export reuses the report builders, so Drive output and local
  download are byte-identical.

### Cons / Trade-offs
- **No deletes.** Importing a Sheet that has fewer rows than last
  time does not remove the missing entities. An operator who
  removes a fighter from the Sheet must also delete that fighter
  in the app. Acceptable because mid-event removals are rare and
  destructive deletes from a sheet edit would be terrifying.
- **Athlete identity is `name`, not `(name, club)`.** Two athletes
  with the same name in different clubs collide on import; the
  second is matched to the first. The Athletes-tab refactor
  reduced the surface (only one row per name now), but it does
  not solve the genuine ambiguity. A future iteration may add a
  required Athlete ID column.
- **Credentials are per-machine.** Restoring a backup onto a new
  laptop loses the Drive connection; the operator re-authorises.
  This is the same trade-off as backup config and is intentional.
- **Errors in one tab do not block the others.** Each tab's
  `sheetRows` failure is swallowed (`err == nil` guard). An
  operator who renames the `Athletes` tab to `athletes ` (trailing
  space) gets a successful import with zero athletes and may not
  notice. Header and tab name resolution is whitespace- and
  case-insensitive, but a missing tab still falls through silently.
- **No dry-run.** The importer writes as it reads. A bad sheet
  pollutes the DB; the only recovery is the auto-backup restore
  flow.
- **Sheets API quotas.** Google enforces a per-minute read quota
  per project. A federation with many sheets re-importing all at
  once on the same client ID can hit it. Per-laptop client IDs
  partly mitigate, but a long card with many re-imports will
  rate-limit.
- **OAuth localhost redirect ties us to port 8080.** Changing the
  app's listen port also requires reconfiguring the OAuth client
  in Google Cloud Console.

## Alternatives considered

- **CSV upload per entity.** Rejected: loses cross-tab
  relationships, requires the operator to export N files from
  Sheets and upload N times, and the auth flow becomes "the
  operator forwards a CSV via email" in practice.
- **Service account with shared credentials shipped in the
  binary.** Rejected: single point of failure, one revocation
  breaks every federation, and storing a secret in a distributable
  binary is not a posture we want.
- **Direct database import from a federation portal.** Rejected:
  there is no central server, and adding one would invert the
  whole architecture for what is, in practice, a per-event tool.
- **One sheet per entity (separate spreadsheet for athletes,
  officials, etc.).** Rejected: the operator already has too many
  Drive files; one sheet per card with multiple tabs matches their
  mental model better.
- **Strict-fail import (any error rolls back).** Considered. We
  chose forgiving-by-tab because operator sheets are messy in
  practice and "athletes imported but officials tab had a typo"
  is more recoverable than "nothing imported, fix all errors and
  retry." The trade-off is silent partial success; the per-tab
  result counts in `ImportResult` are how the UI surfaces this.
- **Drive Picker UI to select a Sheet instead of pasting an ID.**
  Considered; not done yet. Pasting a sheet ID is uglier but
  works without embedding Google's Picker SDK in the React app.
  Likely future work.

## References
- `internal/gdrive/service.go` — `Import`, `ImportAll`,
  `importBouts`, `CreateTemplate`, `ExportCard`.
- `internal/gdrive/app.go` — HTTP routes, OAuth callback, admin
  RBAC wiring.
- `internal/gdrive/config.go` — `Config`, token persistence,
  `oauthConfig` redirect URL.
- `internal/athletes/usecase.go` — `FindOrCreateByName`,
  `FindOrCreateByNameAndClub`, `FindOrCreateByNameClubProvince`
  (province back-fill).
- `internal/affiliations/usecase.go` — `FindOrCreateByName`,
  `FindOrCreateProvince`, `FindOrCreateNation`.
- `internal/cards/usecase.go` — `FindOrCreateByName(name, date)`.
- `internal/reports/` — report builders reused by the Drive
  export path.
- `frontend/src/pages/` — admin Google Drive tab (connect, list
  sheets, run import, run export).
