# Upload Template Cleanup — How to Test

## Setup

```bash
./build.sh && ./scoreboard
# or, for hot reload:
# terminal 1: go build -o scoreboard ./cmd && ./scoreboard
# terminal 2: cd frontend && npm run dev
```

Log in as admin.

## 1. Home page has 3 tabs only

- Navigate to **Home**.
- Verify the cards section is shown at the top.
- Verify the Tabs strip below shows exactly: **Athletes**, **Officials**, **Cards**.
- The **Affiliations** tab should be gone.

## 2. Athletes — new template

1. Open **Athletes** tab → click **Import**.
2. Click **Download template**. The downloaded file should be
   `athletes-template.csv` with header:
   `Name,Gender,Age Category,Experience,Club,Province,Nationality`
   and two example rows.
3. Read the hint text. It should mention:
   - Age Category values: U13, U15, U19, Elite, Masters
   - Experience: Open, Novice
   - Gender: Male, Female
   - "affiliations are created automatically"
4. Edit the CSV to add a row, e.g.
   ```
   Alice Smith,Female,U19,Open,New Club Z,Province Z,Country Z
   ```
   where the club/province/nation names do **not** yet exist.
5. Upload it and click **Import**.
6. Verify the new athlete shows up in the Athletes table with the correct Club,
   Province, Nation columns populated.
7. Open the **Cards** section's card creation flow or peek at the affiliations
   API (`GET /api/affiliations`) — `New Club Z`, `Province Z`, `Country Z` should
   now exist as affiliations of type club / province / nation respectively.
8. Re-import the same CSV — no duplicate affiliations should appear (find-or-create).

## 3. Officials — new template

1. Open **Officials** tab → click **Import**.
2. Download template — expect header:
   `Name,Nationality,Year of Birth,Registration Number`
3. Add a row, import. Verify the official appears in the table with the right
   Year of Birth and Registration Number.

## 4. Cards — flat CSV with athlete lookup

Pre-req: import at least the two athletes used in the example template via the
Athletes tab first (e.g. Jane Smith, Maria Garcia, John Doe, Mike Johnson,
Alice Brown, Bob White), with valid age category / experience / gender values.

1. Open a card (or use the Cards header import) → **Import**.
2. Download template. Expect a flat CSV with header:
   `Card Name,Date,Bout Number,Bout Type,Red Athlete,Blue Athlete,Round Length,Glove Size`
3. Upload the example template (after importing the athletes referenced).
4. Verify a card called **Spring Open 2024** is created (dated 2024-04-20),
   with 3 bouts, each correctly linked to the right red/blue athlete.
5. Open one of the bouts and verify Age Category, Experience, and Gender match
   the **red** athlete's values from step 2.

### Error cases

- Import a card CSV referencing an athlete that doesn't exist — expect error
  `red athlete "X" not found — import athletes first`.
- Import a card CSV referencing a red athlete whose age category / experience /
  gender is blank or invalid — expect a clear error mentioning the bad field.

## 5. Regression checks

- The judge / scoreboard / card pages still work normally.
- Athlete add/edit dialogs still show Club / Province / Nation pickers populated
  from the affiliations created by import.
- Officials CRUD still works.

## 6. Automated checks

```bash
go build ./...
go test ./internal/cards/... ./internal/athletes/... ./internal/officials/...
cd frontend && npx tsc --noEmit -p tsconfig.app.json && npm run build
```
All commands should exit 0.
