# ADR: Judge Score Consistency

## Status
Accepted — 2026-04-30

## Context
Tournament organisers want a per-card view of how each judge scored
relative to the rest of the panel. The same human can sit in multiple
judge seats across a card (judge1 today, judge3 tomorrow), so identity
must follow the human, not the seat. Output drives both an in-app
review tab and exportable / Drive-uploadable reports.

## Decision

### Identity: judge name, scoped per card
Aggregation key is `JudgeName` (set when the judge logs in via
`scores.Ready`). When the name is empty we fall back to `JudgeRole`
(`judge1`..`judge5`) so partially-scored cards still produce output.
The report is computed per card; bouts on different cards are never
mixed.

### Inputs
For every scored bout on the card:
- per-round, per-judge `Red` / `Blue` scores
- each judge's overall winner pick
- the admin-recorded `Winner` and `Decision`

### Per-round metrics
Within one (bout, round):
- Panel mean Red and Blue across judges who scored that round.
- Per-judge **deviation** = `|judge.Red − meanRed| + |judge.Blue − meanBlue|`.
- Panel **majority winner** = corner with the most judge picks
  (`red`, `blue`, or `draw` on a tie).
- A judge **agrees** with the round if their corner pick equals the
  panel majority. Draws count as agreement only when the judge also
  scored a draw.

### Per-bout overall winner agreement
Each judge's overall pick is compared to the bout's panel majority of
overall picks. Ties produce no majority and no agreement points are
awarded for that bout.

### Composite score
Per judge:

```
roundAgree    = roundsAgreed / roundsTotal × 100
overallAgree  = boutsAgreed / boutsWithOverallPick × 100
devPenalty    = clamp(avgDeviation, 0, 5) / 5 × 100
devScore      = 100 − devPenalty

ConsistencyScore = 0.5 × roundAgree
                 + 0.4 × overallAgree
                 + 0.1 × devScore
```

Rationale for weights:
- Round agreement is the strongest signal (many samples per bout) → 0.5.
- Overall winner is the headline call but only one sample per bout → 0.4.
- Raw deviation differentiates judges who disagree by 1 point from
  those who disagree by many; small weight (0.1) so a single outlier
  round doesn't dominate.
- Deviation is clamped at 5 to avoid one wildly miscarded round
  zeroing an otherwise consistent judge.

Rows are sorted by `ConsistencyScore` descending.

### Positions
A judge's `Positions` field collects every `JudgeRole` they sat in
across the card. This makes it possible to spot the same person
spanning multiple seats and to validate that a name change wasn't
caused by a seat reassignment.

### Per-bout breakdown
The full report attaches every scored bout to every judge that
appeared in it, so reviewers can see the raw round scores and overall
picks side-by-side. The drawer in the UI and the "full" CSV/PDF
exports both consume this same shape.

## Consequences

### Pros
- Single source of truth: `scores.BuildReport` builds the data; HTTP
  handlers, the UI, and the export writers all consume it unchanged.
- Cards with partial scoring still produce a useful (if smaller)
  report — fallback to `JudgeRole` keeps unnamed entries grouped.
- The composite score is auditable: each component is reported
  separately so reviewers can see why a judge ranks where they do.

### Cons / Trade-offs
- Two-judge bouts can produce ambiguous "majorities" and either inflate
  or zero an agreement metric. The deviation component partially
  cushions this but it is a known weakness of small panels.
- Renaming a judge mid-card splits their stats across two rows. We
  accept this rather than retroactively rewriting historic scores.
- Weights (`0.5 / 0.4 / 0.1`) are heuristic. They live in
  `internal/scores/report.go` and can be tuned without changing data
  shapes.

## Alternatives considered

- **Score by JudgeRole only.** Rejected: punishes/rewards a seat, not a
  human. Misses cross-bout consistency for a judge who moves seats.
- **Pure deviation-based score** (skip winner agreement). Rejected:
  doesn't capture decisiveness — a judge who consistently scores 10/10
  draws would look perfect.
- **Weighted by panel size.** Considered for future work; current
  formula treats every round equally regardless of judge count.

## References
- `internal/scores/report.go` — `BuildReport`, weights.
- `internal/scores/consistency.go` — original per-round metric
  preserved for tests and ad-hoc use.
- `internal/reports/consistency.go` — short/full CSV + PDF writers.
- `features/judge_consistency.md` — original feature brief.
- `features/judge_consistency_plan.md` — implementation plan.
