# ADR: Pill-Based Foul Selection

## Status
Accepted — 2026-05-01

## Context
The original foul picker on the bout page was an antd `Select` (`mode="tags"`) inside `HandleFouls`. To record a foul the operator opened the dropdown, scrolled the list, picked an item, then clicked a separate `+` button. Three problems:

1. **Too small for touch** — the dropdown trigger was a 220px-wide combo box. Officials use this on tablets at ringside.
2. **Order was usage-based** — the backend `ListFouls()` returns fouls sorted by their global `count`, so the dropdown reorders itself silently as the day progresses. Operators reach for muscle memory and the option moved.
3. **Two-step add** — pick + click `+`. Easy to mis-tap mid-round.

The original feature brief (`features/change_cautions_and_warnings.md`) asked: bigger pills.

## Decision

### Pills as one-tap actions, not toggles
Each available foul renders as a `Tag.CheckableTag` with `checked={false}` permanently. Click → immediately fires `handleFoul({ action: "add", ... })`. The pill is an action, not a state. Reasoning:

- A round can hold the same foul more than once (e.g. two low blows). Toggle semantics would either suppress the second add or require unfamiliar long-press affordances.
- Removal is intentionally separated into the `EyeOutlined` `ActionMenu` so ringside operators don't toggle a foul off the round by mis-tapping a pill.

### Alphabetical ordering, fixed
Sort once via `localeCompare`, memoised on `allFouls`. The order no longer depends on usage counts. Predictability beats frequency-weighted ranking when the operator is glancing while watching the bout.

### Type-in stays
A small `Input` under the pills supports `onPressEnter` to add a brand-new foul. Mirrors the prior `mode="tags"` capability. The new entry both records the foul on the round and (via the existing `countFoul` path on the backend) makes it appear as a pill on subsequent renders for the rest of the card.

### Reuse existing endpoints
No backend change. `GET /api/cards/{cardId}/fouls` provides `allFouls`. The same `POST .../foul` with `action` add/remove handles every interaction. Removal continues to flow through `DisplayFouls` inside the `ActionMenu` drawer.

## Consequences

### Pros
- One tap to add. Halves the gestures needed during a fast round.
- Stable order — operators learn pill positions across bouts.
- Zero backend churn. Strictly a presentation change.

### Cons / Trade-offs
- Pills consume more vertical space than a dropdown when the global foul list grows. Mitigated by `Space wrap` and an implicit cap from real-world boxing fouls (~5–10 entries).
- Mis-tapping a pill records an unintended foul. Removal is one extra step (open the eye drawer, click `Remove`). Considered acceptable: under-recording and over-recording are both reversible, and the explicit drawer interaction is the safer default for destructive edits.
- Free-text entries from the type-in still propagate into the global `Foul` table on first add. Same behaviour as the prior `Select mode="tags"` — not regressed, not improved.

## Alternatives considered

- **Toggle pills (one tap to add, one tap to remove).** Rejected: incompatible with same-foul-multiple-times in a round; risks accidental removal.
- **Sort pills by usage count, descending.** Rejected: produces the same instability complaint that motivated the change.
- **Two-row pill layout (cautions on top, warnings below) shared across both corners.** Out of scope; the current per-corner layout in `CornerControls` is unchanged so corner colour still anchors the operator's eye.

## References
- `frontend/src/components/fouls/handle.tsx` — pill UI.
- `frontend/src/components/fouls/display.tsx` — removal list inside `ActionMenu`.
- `frontend/src/api/bouts.ts` — `useGetFouls`, `useMutateHandleFoul`.
- `internal/round/storage/sqlite.go` — `ListFouls`, `countFoul`, `commonFouls` seeding.
- `features/change_cautions_and_warnings.md` — original brief.
- `features/change_cautions_and_warnings_plan.md` — implementation plan.
