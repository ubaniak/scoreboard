# Judge Consistency — How to Test

## Backend unit tests
```bash
go test ./internal/scores/...
```
Existing per-round consistency tests must still pass. The new `BuildReport` is exercised indirectly via the HTTP path; manual smoke below covers it end-to-end.

## End-to-end manual test

### Setup
1. `./build.sh && ./scoreboard`
2. Open the app, log in as admin.
3. Create (or open) a card. Add at least 3 scored bouts and 5 judges.
4. As each judge (use the device codes from the Card page), submit per-round scores (10/9, 10/9, 9/10 etc.) for every round of every bout.
5. For each bout, every judge picks an overall winner.
6. Make admin decision on each bout so `Winner` and `Decision` are populated.

### Verify the report
1. Navigate to the Card page. Confirm a new tab labelled **Judge Consistency** appears next to **Bouts**.
2. Click it. The table should list one row per judge with columns:
   - Judge, # Bouts, Total Red, Total Blue, Overall Winner Agree, Round Agree, Consistency Score, Positions, Details.
3. Sort by Consistency Score — judges who agreed most with the panel should be on top.
4. Click **View bouts** on a row. A drawer (actionMenu) opens.
5. Drawer shows the title `<judge> — bout breakdown` and a section per bout with:
   - "Bout N: Red vs Blue", `Winner` and `Decision` line.
   - A small table: one row per judge, columns `R1 (Red/Blue)…Rn (Red/Blue)` and `Overall Pick`. The current judge's row is bold.
6. Close the drawer and pick another judge — verify the per-bout breakdown changes.

### Edge cases
- Card with no scored bouts: tab shows an `Empty` placeholder.
- Bout where one judge dissents: their `Round Agree` and `Overall Winner Agree` should be lower than the rest, and they should sit lower in the consistency-score sort.
- Judge who hasn't picked an overall winner yet: they still appear from their round scores, with `Overall Winner Agree` of 0.

### API spot-check (optional)
```bash
curl -H "Authorization: Bearer <admin token>" \
  http://localhost:8080/api/cards/<cardId>/judge-consistency | jq
```
Expect `{ "judges": [...], "bouts": [...] }` with non-empty arrays once scoring is complete.
