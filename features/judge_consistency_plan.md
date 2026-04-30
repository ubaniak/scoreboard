# Judge Consistency — Plan

## Goal
Per-card report aggregating each judge's scoring consistency relative to the rest of the panel. New tab on the Card page lists judges; clicking a row opens an actionMenu drawer with per-bout breakdown.

## Backend

### Domain logic — `internal/scores/consistency.go`
Existing `Consistency(scores)` already returns per-judge `TotalRed`, `TotalBlue`, `AvgDeviation`, `AgreementPct` based on round-level majority. Extend.

Add a richer report constructor:

```go
type JudgeConsistencyReport struct {
    Judges []JudgeRow `json:"judges"`
    Bouts  []BoutRow  `json:"bouts"`
}

type JudgeRow struct {
    JudgeName             string   `json:"judgeName"`
    Positions             []string `json:"positions"`             // judge1..judge5
    BoutsCount            int      `json:"boutsCount"`
    TotalRed              int      `json:"totalRed"`
    TotalBlue             int      `json:"totalBlue"`
    ConsistencyScore      float64  `json:"consistencyScore"`      // 0..100, weighted blend of round-agree + overall-winner agree, lower deviation = higher
    RoundAgreementPct     float64  `json:"roundAgreementPct"`
    OverallWinnerAgreePct float64  `json:"overallWinnerAgreePct"`
    AvgDeviation          float64  `json:"avgDeviation"`
}

type BoutRow struct {
    BoutNumber  int            `json:"boutNumber"`
    RedName     string         `json:"redName"`
    BlueName    string         `json:"blueName"`
    Winner      string         `json:"winner"`
    Decision    string         `json:"decision"`
    Rounds      []RoundEntry   `json:"rounds"`
    OverallWinners []OverallWinnerEntry `json:"overallWinners"`
}

type RoundEntry struct {
    RoundNumber int           `json:"roundNumber"`
    Scores      []ScoreEntry  `json:"scores"`
}
type ScoreEntry struct{ JudgeName, JudgeRole string; Red, Blue int }
type OverallWinnerEntry struct{ JudgeName, JudgeRole, Winner string }
```

`ConsistencyScore` formula:
- `roundAgree` = % rounds judge picked same winner as panel majority
- `overallAgree` = % bouts judge picked same overall winner as panel majority
- `devPenalty` = clamp(avgDeviation, 0, 5) / 5 × 100
- `score = 0.5 × roundAgree + 0.4 × overallAgree + 0.1 × (100 - devPenalty)`

Sort rows by `ConsistencyScore` desc.

### HTTP — `internal/scores/app.go` (new)
New `App` with one route registered under cards subroute:

`GET /api/cards/{cardId}/judge-consistency` → admin only → returns `JudgeConsistencyReport`.

Implementation: fetch all bouts for the card via `bouts.UseCase`; for each bout call `scoreUseCase.List(cardId, boutId)` and resolve athlete names via the existing athlete-name querier; build the report.

Wire up:
- `cmd/main.go`: build `scores.NewApp(...)` after bouts; pass it to `cards.NewApp` (or have it register itself in cards `RegisterRoutes`).
- `internal/cards/app.go`: accept optional consistency app and register its routes inside cards subroute.

### Tests
Existing `consistency_test.go` continues to validate the per-round metrics. Add a small ginkgo test for the report builder covering: positions aggregation, overall-winner agreement, sort order.

## Frontend

### API hook — `frontend/src/api/score.ts`
Add `useGetJudgeConsistency({ token, cardId })` hitting `/api/cards/{cardId}/judge-consistency`.

### Component — `frontend/src/components/cards/JudgeConsistency.tsx` (new)
- Receives `cardId` + `token`.
- Renders an antd `Table` with columns: Judge Name, # Bouts, Total Red, Total Blue, Overall Winner Agree %, Consistency Score, Positions.
- Each row uses `ActionMenu` with the `override` trigger to make the row clickable. Drawer body shows judge's per-bout breakdown:
  - Bout Number, Red, Blue
  - All judges' scores grouped by round (table per bout)
  - Winner, Decision

### Card page tabs — `frontend/src/pages/card.tsx`
Wrap existing content (NextBout + BoutsIndex) plus new JudgeConsistency in antd `Tabs`:
- "Bouts" — current content
- "Judge Consistency" — new component

## Build
`./build.sh` then `./scoreboard`.

## Out of scope
- Public/judge-facing access (admin only).
- Editing, exporting.
