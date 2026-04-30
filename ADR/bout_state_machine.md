# ADR: Bout State Machine

## Status
Accepted — 2026-04-30

## Context
A bout is the core unit of a tournament card. Its lifecycle spans
admin actions (start, advance round, enter decision, reveal, complete),
judge actions (submit per-round scores, pick overall winner), and
passive observers (the public scoreboard polling `/api/current`).
Multiple actors mutate the same bout from different pages, so the
allowed transitions and the "active" pointer must be explicit rather
than implicit. A bout also owns rounds, which have their own status,
and the two state machines must stay coherent.

## Decision

### Bout statuses
Defined as `BoutStatus` (string enum) in
`internal/bouts/entities/entities.go`. Nine values, ordered by
lifecycle:

```
not_started
  → in_progress
  → waiting_for_scores       (round running, judges still scoring)
  → score_complete           (all judges submitted for the round)
  → waiting_for_decision     (final round done, admin must decide)
  → decision_made            (admin entered winner + decision type)
  → show_decision            (decision revealed to scoreboard/judges)
  → completed
cancelled                    (terminal, off-path)
```

`BoutStatus.IsValid()` gates HTTP input.

### Round statuses
`RoundStatus` (`internal/round/entities/entity.go`) is a smaller
machine that advances independently per round:

```
not_started → ready → in_progress → waiting_for_results
            → score_complete → complete
```

`RoundDetails.Next()` is the single sequencer. Round progression is
driven by `internal/round/stateMachine.go`: pick the active
(non-`not_started`, non-`complete`) round and advance it; if none,
promote the next `not_started` round to `ready`.

### Transitions and triggers
Transitions live in `internal/bouts/usecase.go` and are exposed via
`internal/bouts/app.go`:

- `not_started → in_progress` — `POST /{cardId}/bouts/{id}/status`.
  Requires a referee for scored/developmental bouts; round 1 is
  auto-promoted to `ready` and `onBoutStart` fires.
- `in_progress → waiting_for_scores → score_complete →
  waiting_for_decision` — `POST /{cardId}/bouts/{boutId}/rounds/next`
  drives the round machine and the bout status mirrors it
  (`app.go` ~544–564).
- Judge score submission auto-finalises the round to
  `score_complete` once every seated judge has scored
  (`app.go` ~785–804), which in turn flips bout status.
- `waiting_for_decision → decision_made` — `POST /{id}/decision/make`.
- `decision_made → show_decision` — `POST /{id}/decision/show`.
- `show_decision → completed` — `POST /{id}/complete`.
- `* → cancelled` — admin-only, terminal.

### Guards
- Referee required before a scored or developmental bout may leave
  `not_started`.
- `BoutStatus.IsValid()` rejects unknown statuses at the HTTP edge.
- Decision is only writable in `waiting_for_decision`; reveal is only
  writable in `decision_made`; complete is only writable from
  `show_decision`. Out-of-order calls 4xx.
- Judge scores are visible to other judges and the public scoreboard
  only once the bout reaches `show_decision`
  (`internal/current/usecase.go`).

### "Current" bout selection
`/api/current` is unauthenticated and is what the public scoreboard
and judge pages poll, so it must always return something sensible.
The selection rule (`internal/bouts/storage/sqlite.go` ~110–133) is a
priority ladder:

1. Any bout in an active state (`in_progress`,
   `waiting_for_scores`, `score_complete`, `waiting_for_decision`,
   `decision_made`).
2. Most recently completed bout that has a winner (highest id first).
3. Next `not_started` bout on the card.

`cancelled` bouts and `completed` bouts without a winner are skipped.
`bouts.CurrentRound(boutId)` returns the active round inside the
chosen bout.

### Persistence
Both `Bout.Status` and `Round.Status` are plain non-null string
columns on their GORM models. Transitions are individual `UPDATE`
statements scoped by `card_id` + `id`; there is no separate audit
log table — the round and score rows are the durable record of what
happened.

## Consequences

### Pros
- One source of truth for transitions: `internal/bouts/usecase.go`
  is the only place that mutates `Bout.Status`. Handlers parse,
  usecase enforces.
- The bout machine and round machine are decoupled but synchronised
  at one well-known seam (`NextRoundState`), so neither has to
  understand the other's internals.
- The `/api/current` priority ladder lets the public scoreboard keep
  showing something useful between bouts without admins manually
  pinning state.
- Score visibility is gated by `show_decision`, which means an admin
  can review and correct a decision before the room sees it.

### Cons / Trade-offs
- Nine bout statuses × six round statuses is a lot of surface area;
  invalid combinations are prevented by code paths rather than by a
  declarative table, so a wrong manual `UPDATE` to the DB can
  desynchronise the two machines.
- No transition history. We can reconstruct *what* happened from
  rounds and scores, but not *when* status flipped or *who* flipped
  it. Adequate for current operational needs; would need an audit
  table for dispute resolution.
- `cancelled` is a single terminal sink — we do not distinguish
  "withdrawn", "no-show", "DQ before bell". If that distinction
  matters later it becomes a `CancelReason` field, not new statuses.
- Two-judge or partially-seated panels can reach `score_complete`
  with fewer scores than a full panel; the gating is "every seated
  judge scored", not "N judges scored".

## Alternatives considered

- **Collapse `decision_made` and `show_decision` into one state.**
  Rejected: admins explicitly want a private window to enter and
  sanity-check the decision before the room sees it. Two states make
  that gate trivial.
- **Drive bout status purely from round status (derive, don't store).**
  Rejected: the post-final-round states (`waiting_for_decision`,
  `decision_made`, `show_decision`, `completed`) have no round to
  derive from, and `/api/current` would need to recompute on every
  poll.
- **Declarative transition table** (map of `from → allowed to`).
  Considered. Current imperative checks in `usecase.go` are short
  and readable; a table becomes worthwhile if/when we add an audit
  log or expose transitions to the frontend for UI gating.
- **Cascade card status to bouts.** Partially in place (start card
  triggers downstream effects); we deliberately do *not* mass-cancel
  bouts when a card is closed, because admins occasionally reopen.

## References
- `internal/bouts/entities/entities.go` — `BoutStatus` enum,
  `IsValid`.
- `internal/bouts/usecase.go` — all bout transitions; referee guard;
  `CurrentRound`.
- `internal/bouts/app.go` — HTTP routes for status, rounds/next,
  decision/make, decision/show, complete; round auto-finalise on
  score submit.
- `internal/bouts/storage/sqlite.go` — `SetStatus`, current-bout
  priority ladder.
- `internal/round/entities/entity.go` — `RoundStatus`,
  `RoundDetails.Next`.
- `internal/round/stateMachine.go` — round progression.
- `internal/current/usecase.go` — public state endpoint, score
  visibility gate.
- `frontend/src/pages/bout.tsx`, `frontend/src/pages/card.tsx`,
  `frontend/src/pages/judge.tsx` — UI entry points for transitions.
