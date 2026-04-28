# How to Test: cleanup

## Setup
1. `./build.sh`
2. `./scoreboard` — opens browser at http://localhost:8080
3. Log in as admin (default admin/admin or whatever your setup uses).

## 1. Affiliations tab
On the Home page, the tabs row should show: **Affiliations**, **Athletes**, **Officials**, **Settings**, **Google Drive**. The legacy "Clubs" tab is gone.

- Click **Affiliations**.
- Use the segmented filter (All / Clubs / Provinces / Nations) — verify it filters the table.
- Click **Add** → form has Name + Type dropdown (Club/Province/Nation). Add one of each:
  - Club: "City Boxing Club"
  - Province: "Ontario"
  - Nation: "Canada"
- Each appears in the table with the matching Type tag.
- Click the picture icon → upload an image. Avatar updates.
- Click edit → rename + change type. Persists after reload.
- Click delete → confirm → row gone.
- Click **Import** → drop a CSV `name,type\nFoo,club\nBar,province` → rows appear.

## 2. Athletes tab
- Click **Add**.
- Verify the form contains: Name, Date of Birth, Age Category, **Gender** (Male/Female), **Experience** (Novice/Open), Club dropdown, Province dropdown, Nation dropdown.
- Verify there is **no Nationality field**.
- Club/Province/Nation dropdowns are populated from the affiliations created in step 1, with type filtering (Province dropdown only shows provinces, etc.).
- Submit a new athlete with all fields set.
- Athlete appears in the table with columns: Name | Age Category | Gender | Experience | Club | Province | Nation.
- Edit the athlete → form pre-fills with existing affiliation IDs and gender/experience. Change them and save → table updates.
- Search box filters by name/club/province/nation.

## 3. Officials tab
- Click **Add**.
- Verify Province + Nation are now **dropdowns** (not free-text), populated from affiliations.
- Submit a new official with a province + nation selected.
- Table renders the resolved province/nation names.
- Edit official → dropdowns pre-fill correctly.

## 4. Backwards compat
- Existing athletes with no gender/experience still render (those columns are blank).
- Existing officials that previously stored free-text Province/Nation: those records keep their old text in the columns (deprecated DB columns retained); editing them now requires picking from the dropdown and saves the affiliation ID instead.

## 5. Build artifacts
- `./build.sh` completes without errors.
- `cd frontend && npm run lint` passes (no new lint errors introduced).

## Regression checks
- The card → bout → round flows still work end-to-end.
- The public scoreboard at `/scoreboard` and judge views still load and show athlete/official names.
- `/api/current` still returns expected JSON when a card/bout is active.
