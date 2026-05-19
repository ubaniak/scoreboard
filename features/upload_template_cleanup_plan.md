# Upload Template Cleanup — Plan

## Goal

Reduce home page to 3 tabs (Athletes, Officials, Cards). Replace existing
upload templates with simpler spec-defined templates. Auto-derive affiliations
(Club, Province, Nationality) when athletes are imported.

## Templates (per spec)

### Athletes CSV

```
Name,Gender,Age Category,Experience,Club,Province,Nationality
```

Key (in import dialog hint):
- Age Category: U13, U15, U19, Elite, Masters
- Experience: Open, Novice
- Gender: Male, Female

Behavior:
- Club, Province, Nationality are NAMES (not IDs).
- Each non-empty value triggers `affiliations.FindOrCreate(name, type)` on the
  backend, with type = club / province / nation respectively.
- Athlete is created with the resolved affiliation IDs.

### Officials CSV

```
Name,Nationality,Year of Birth,Registration Number
```

### Cards CSV

```
Card Name,Date,Bout Number,Bout Type,Red Athlete,Blue Athlete,Round Length,Glove Size
```

- Card Name + Date are repeated per row (one card per file).
- Age Category, Experience, Gender are derived from the Red athlete record
  (athletes must be imported first).
- Sparring bouts (no scores) still allowed.

## Frontend changes

1. `frontend/src/pages/home.tsx`
   - Remove the **Affiliations** tab from the `Tabs` list.
   - Update Athletes import dialog: new template + hint with Key section.
   - Keep `useListAffiliations` (still needed for club/province/nation dropdowns
     on Add/Edit Athlete).
2. `frontend/src/components/officials/importCSV.tsx`
   - Update `TEMPLATE` to spec columns.
   - Update hint.
3. `frontend/src/components/cards/CardImport.tsx`
   - Update `TEMPLATE` to flat CSV (Card Name + Date per row, no sections).
   - Update hint.
4. `frontend/src/components/bouts/masterImportCSV.tsx`
   - Delete (unused).

## Backend changes

1. `internal/athletes/app.go` — `ImportCSV`
   - Accept columns: `name, gender, ageCategory, experience, club, province, nationality`.
   - For each row, call `affiliations.FindOrCreateClub/Province/Nation` to
     resolve names → IDs.
   - Normalise age category strings to lowercase enum values
     (e.g. "U13" → "u13", "Elite" → "elite").
2. `internal/athletes` — wire affiliations usecase
   - New constructor option: `athletes.NewApp` accepts an optional
     `AffiliationResolver` (a narrow interface with the three find-or-create
     methods). Wire from `cmd/main.go`.
3. `internal/cards/import.go` — flat CSV
   - Drop the section-based parser; accept a single flat CSV with header
     `Card Name,Date,Bout Number,Bout Type,Red Athlete,Blue Athlete,Round Length,Glove Size`.
   - Use the first non-empty `Card Name` / `Date` value to FindOrCreate the card.
   - Per bout row: look up Red athlete by name (must exist). If found, derive
     `AgeCategory`, `Experience`, `Gender` from the athlete record.
   - Blue athlete optional. Don't import officials via the cards CSV anymore
     (officials are imported on their own tab).
4. `cmd/main.go`
   - Pass `affiliationUseCase` to `athletes.NewApp` (or a configurable setter,
     mirroring `cardApp.WithImport`).
   - Drop the officials/affiliations dependencies from `cardApp.WithImport`
     since cards no longer create officials. Keep athletes + clubs for backward
     compat with bouts CSV consumers? — No, simplification wins; remove dead
     dependencies.

## Domain interfaces

Add a small resolver interface in `internal/athletes`:

```go
type AffiliationResolver interface {
    FindOrCreateClub(name string) (uint, error)
    FindOrCreateProvince(name string) (uint, error)
    FindOrCreateNation(name string) (uint, error)
}
```

The existing affiliations usecase has these methods (named
`FindOrCreateByName`, `FindOrCreateProvince`, `FindOrCreateNation`). Add a thin
adapter or rename `FindOrCreateByName` → `FindOrCreateClub` for clarity.
Decision: keep adapter in `cmd/main.go` to avoid breaking other call sites.

## Cards import — athlete lookup interface

In `internal/cards/import.go`, change `ImportAthleteCreator` to expose
`GetByName(name string) (*athleteEntities.Athlete, error)` (or extend with an
optional getter). The cards package shouldn't import the athletes package's
entities directly — instead define a struct with the minimal fields needed
(`ID`, `AgeCategory`, `Experience`, `Gender`) inside the cards package.

```go
type ImportAthleteLookup struct {
    ID          uint
    AgeCategory string
    Experience  string
    Gender      string
}

type ImportAthleteFinder interface {
    GetByName(name string) (*ImportAthleteLookup, error)
}
```

Adapter in `cmd/main.go` translates from the athletes entity to this struct.

## Build sequence

1. Backend changes (interfaces → usecases → app → main wiring).
2. Frontend changes (templates + Affiliations tab removal).
3. Run `go build`, `cd frontend && npm run lint`, `go test ./internal/cards/...`,
   `go test ./internal/athletes/...`.
4. Write `features/upload_template_cleanup_how-to-test.md`.
5. Commit on `upload_template_cleanup` branch.

## Risks / open questions

- The bouts CSV `masterImportCSV.tsx` is unused — safe to delete.
- Removing the Affiliations tab hides CRUD for affiliations. Auto-create still
  works on import. If admins ever need to rename / delete affiliations manually
  we'll need to re-expose CRUD — out of scope for now.
- Existing card import tests may break — update fixtures.
