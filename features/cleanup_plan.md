# Cleanup Plan

## Goal
Replace the legacy "Clubs" tab with a unified "Affiliations" tab (type = club | province | nation, with image upload). Make athletes/officials reference affiliations via dropdowns. Drop free-text Nationality from athletes; add Gender + Experience.

The backend already has an `affiliations` domain with type + image support. The bulk of the work is:
1. Adding athlete `gender` + `experience` fields and removing `nationality`.
2. Replacing the frontend's Clubs tab + athlete/official forms with affiliation-aware UI.

## Backend Changes

### `internal/athletes`
- `entities/entities.go`
  - Remove `Nationality string`
  - Add `Gender string`, `Experience string`
  - Update `UpdateAthlete` accordingly
- `storage/athlete.go`
  - Drop `Nationality` (keep deprecated column comment for migration safety) — actually leave the gorm field deprecated to avoid breaking existing dbs; add `Gender`, `Experience` columns
- `storage/sqlite.go` — propagate new fields on Create/Update/List
- `usecase.go` — `Create` signature swaps `nationality` for `gender, experience`
- `app.go` — `CreateAthleteRequest` / `UpdateAthleteRequest` / `AthleteResponse` use `gender`, `experience` instead of `nationality`. CSV import: drop `nationality`, accept `gender`, `experience`.

### `internal/officials`
- No backend change required (already affiliation-based). Optionally drop Nationality from forms downstream — keep for now (officials still has `nationality` field; task says only province/nation become dropdowns).

### `internal/dump`
- `dbAthlete` — replace `Nationality` with `Gender`, `Experience` fields to keep dump round-trip in sync (keep deprecated cols left for migration). Match athletes table columns post-migration.

## Frontend Changes

### New: `src/api/affiliations.ts`
Single API module:
- `useListAffiliations({ type? })` — GET `/api/affiliations?type=...`
- `useMutateCreateAffiliation` — POST `/api/affiliations` `{name, type}`
- `useMutateUpdateAffiliation`
- `useMutateDeleteAffiliation`
- `useMutateUploadAffiliationImage` — POST `/api/affiliations/:id/image`
- `useMutateRemoveAffiliationImage`
- `useMutateImportAffiliations`

### New: `src/components/affiliations/`
- `AddAffiliation.tsx` — name + type select (Club/Province/Nation)
- `EditAffiliation.tsx`
- `index.tsx` — Tab content: filter-by-type pill selector + table with image avatar, edit, image upload, delete

### `src/pages/home.tsx`
- Replace 3 tabs (Clubs / Athletes / Officials) with: **Affiliations**, **Athletes**, **Officials**, **Settings**, **Google Drive**.
- Affiliations tab uses new component; athletes/officials retain own tabs but new dropdowns.
- Drop `useListClubs` etc usage (replace with affiliation API).

### `src/api/athletes.ts`
- `Athlete` type: remove `nationality`, add `gender`, `experience`.
- `CreateAthleteProps` / `UpdateAthleteProps` swap `nationality` for `gender`, `experience`.

### `src/components/athletes/AddAthlete.tsx` / `EditAthlete.tsx`
- Remove "Nationality" input.
- Replace Province/Nation text inputs with `Select` dropdowns of affiliations filtered by type.
- Add Gender (Segmented male/female) and Experience (Segmented novice/open) fields.
- Submit `clubAffiliationId`, `provinceAffiliationId`, `nationAffiliationId`, `gender`, `experience`.

### `src/components/officials/add.tsx` / `edit.tsx`
- Replace Province/Nation text inputs with affiliation dropdowns (filtered by type).
- Submit `provinceAffiliationId`, `nationAffiliationId` instead of `province`, `nation`.

### `src/api/officials.ts`
- `CreateOfficialProps` / `UpdateOfficialProps`: replace `province`, `nation` with `provinceAffiliationId?`, `nationAffiliationId?`.
- `Official` type (entities/cards.ts): add `provinceAffiliationId`, `nationAffiliationId`, keep `province`, `nation` as read-only resolved names.

### Cleanup
- Delete `src/components/clubs/` (AddClub, EditClub).
- Delete `src/api/clubs.ts` (replaced by affiliations).
- Delete `src/pages/clubs.tsx` if unused (check route).

## Migration Notes
GORM AutoMigrate adds new columns. Old `Nationality` column on athletes left in place (no destructive drop). Existing rows get empty `Gender`/`Experience` until edited.

## Out of Scope
- Officials' standalone `Nationality` field (separate concept, not requested).
- CSV column renames beyond what's strictly needed.
- Reports/scoreboard renderer adjustments — they already read affiliation names off the athlete payload.

## Build Sequence
1. Backend entity + storage + usecase + app for athletes
2. Frontend api/affiliations + api/athletes + api/officials types
3. Frontend components/affiliations
4. Update home.tsx, AddAthlete, EditAthlete, official add/edit
5. Run `./build.sh`
6. Manual smoke test
