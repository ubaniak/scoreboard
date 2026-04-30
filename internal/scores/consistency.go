package scores

import (
	"math"
	"sort"

	"github.com/ubaniak/scoreboard/internal/scores/entities"
)

type JudgeConsistencyRow struct {
	JudgeName    string
	TotalRed     int
	TotalBlue    int
	AvgDeviation float64
	AgreementPct float64
}

// Consistency computes per-judge consistency metrics across the supplied scores.
// Scores are grouped by (bout, round); means and majority winners are derived
// per group and aggregated per judge.
func Consistency(scores []*entities.Score) []JudgeConsistencyRow {
	type judgeStat struct {
		totalRed   int
		totalBlue  int
		deviations []float64
		agreed     int
		total      int
	}

	type roundKey struct {
		bout  int
		round int
	}

	byRound := map[roundKey][]*entities.Score{}
	for _, s := range scores {
		k := roundKey{bout: s.BoutNumber, round: s.RoundNumber}
		byRound[k] = append(byRound[k], s)
	}

	stats := map[string]*judgeStat{}

	for _, roundScores := range byRound {
		if len(roundScores) == 0 {
			continue
		}

		var sumRed, sumBlue float64
		for _, s := range roundScores {
			sumRed += float64(s.Red)
			sumBlue += float64(s.Blue)
		}
		n := float64(len(roundScores))
		meanRed := sumRed / n
		meanBlue := sumBlue / n

		redWins, blueWins := 0, 0
		for _, s := range roundScores {
			if s.Red > s.Blue {
				redWins++
			} else if s.Blue > s.Red {
				blueWins++
			}
		}
		var majority string
		if redWins > blueWins {
			majority = "red"
		} else if blueWins > redWins {
			majority = "blue"
		} else {
			majority = "draw"
		}

		for _, s := range roundScores {
			name := s.JudgeName
			if name == "" {
				name = s.JudgeRole
			}
			if _, ok := stats[name]; !ok {
				stats[name] = &judgeStat{}
			}
			st := stats[name]
			st.totalRed += s.Red
			st.totalBlue += s.Blue
			dev := math.Abs(float64(s.Red)-meanRed) + math.Abs(float64(s.Blue)-meanBlue)
			st.deviations = append(st.deviations, dev)
			st.total++

			var judgeWinner string
			if s.Red > s.Blue {
				judgeWinner = "red"
			} else if s.Blue > s.Red {
				judgeWinner = "blue"
			} else {
				judgeWinner = "draw"
			}
			if judgeWinner == majority {
				st.agreed++
			}
		}
	}

	rows := make([]JudgeConsistencyRow, 0, len(stats))
	for name, st := range stats {
		avgDev := 0.0
		if len(st.deviations) > 0 {
			sum := 0.0
			for _, d := range st.deviations {
				sum += d
			}
			avgDev = sum / float64(len(st.deviations))
		}
		agreePct := 0.0
		if st.total > 0 {
			agreePct = float64(st.agreed) / float64(st.total) * 100
		}
		rows = append(rows, JudgeConsistencyRow{
			JudgeName:    name,
			TotalRed:     st.totalRed,
			TotalBlue:    st.totalBlue,
			AvgDeviation: avgDev,
			AgreementPct: agreePct,
		})
	}
	sort.Slice(rows, func(i, j int) bool {
		return rows[i].AgreementPct > rows[j].AgreementPct
	})

	return rows
}
