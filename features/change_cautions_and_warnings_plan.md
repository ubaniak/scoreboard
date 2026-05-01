# Change Cautions and Warnings — Plan

## Goal
Replace the foul selection `Select` dropdown in `HandleFouls` with a pill-based picker. Pills are bigger, easier to tap on a touch device, and the available list is alphabetised. Operators can still type in a brand-new foul. Existing add/remove semantics preserved.

## Out of scope
- Backend changes — no new endpoints, no schema changes. Reuses `GET /api/cards/{cardId}/fouls`, `POST /api/cards/{cardId}/bouts/{boutId}/rounds/{roundNumber}/foul` with `action: "add" | "remove"`.
- Keyboard combos and grouping roles in history (mentioned in feature brief, deferred).

## Frontend

### Component — `frontend/src/components/fouls/handle.tsx`
Replace the antd `Select` with:

1. **Pill grid** — `Space wrap` of `Tag.CheckableTag` items, one per available foul.
   - Sort `allFouls` alphabetically via `localeCompare` (memoised on `allFouls`).
   - `checked={false}` — pills are always action triggers, not toggle state. Click adds the foul to the round.
   - Round border (`borderRadius: 999`), comfortable padding so pills are tap targets.
2. **Type-in input** — small antd `Input` below the pill grid.
   - `onPressEnter` calls `addFoul(newFoul)` then clears the field.
   - `addFoul` trims and no-ops on empty.
3. **View / remove panel** — keep existing `ActionMenu` + `DisplayFouls` for the "eye" button. Round fouls are removed there, not from the pill grid.

`addFoul` builds `MutateHandleFoulProps` with `action: "add"` and the current `corner` + `type`, delegating to the parent's `handleFoul`. No new prop shape.

### Caller — `frontend/src/components/bout/CornerControls.tsx`
No change. The two existing `HandleFouls` instances (cautions + warnings per corner) pick up the new UI as-is.

## Build
`./build.sh` then `./scoreboard`. Frontend type-check via `npx tsc --noEmit` from `frontend/`.

## Risks
- A typo in the type-in field becomes a permanent entry in the global `Foul` table (it gets counted on add). Same risk as the prior dropdown's `mode="tags"`. No mitigation in scope; `commonFouls()` seeding covers a fresh DB.
