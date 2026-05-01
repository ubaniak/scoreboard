# Change Cautions and Warnings — How to Test

## Frontend type-check
```bash
cd frontend && npx tsc --noEmit
```
Must pass clean.

## End-to-end manual test

### Setup
1. `./build.sh && ./scoreboard`
2. Log in as admin.
3. Open (or create) a card with at least one scored bout.
4. Start the bout and start round 1.

### Verify pills
1. On the bout page, look at red and blue corners. Each corner has two foul sections: **caution** and **warning**.
2. Each section shows a row of pill-shaped tags — one per foul returned by `GET /api/cards/{cardId}/fouls`.
3. Pills are alphabetically ordered (case-insensitive). Confirm by reading left-to-right: e.g. `head up`, `headbutts`, `holding and hitting`, `low blow`, `slapping` on a fresh DB.
4. Below the pills there is a small input labelled **Type new foul** and an eye icon button.

### Add via pill (one tap)
1. Click any pill in **red caution**. The pill itself does not visually toggle.
2. Open the eye drawer for **red caution**. The clicked foul appears in the list.
3. Click the same pill again. Open the drawer — the foul appears twice (multiple instances allowed per round).

### Add via type-in
1. In the **Type new foul** input, type `elbow strike` and press Enter.
2. The input clears.
3. Open the eye drawer — `elbow strike` listed.
4. Reload the page. The pill row now includes `elbow strike` in its alphabetical position. (Backend `countFoul` persisted it to the global `Foul` table.)

### Remove
1. Open the eye drawer on a corner with at least one recorded foul.
2. Click **Remove** next to an entry. It disappears from the drawer.
3. The pill row is unaffected (removal does not delete the foul from the global list).

### Edge cases
- Empty input + Enter → no-op (no foul added, no API call). Verify in the network tab.
- Whitespace-only input → no-op (`addFoul` trims).
- Long foul name (~40 chars) typed in → still renders on a wrapped pill row without breaking layout (`Space wrap`).

### Visual / accessibility
- Pills are large enough to tap with a finger on a tablet. The border is visible against the dark background.
- Eye button has `aria-label` `View red caution(s)` / `View blue warning(s)` etc. — verify with browser devtools accessibility inspector.

## Regression
- The bout flow (start round, score, complete round, decision) must still work. Touch nothing else; only the foul widget changed.
- Per-round foul counts in any exported report (`./scoreboard` → exports) match what the drawer shows.
