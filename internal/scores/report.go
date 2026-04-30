package scores

import (
	"math"
	"sort"

	"github.com/ubaniak/scoreboard/internal/scores/entities"
)

type JudgeConsistencyReport struct {
	Judges []JudgeRow `json:"judges"`
	Bouts  []BoutRow  `json:"bouts"`
}

type JudgeRow struct {
	JudgeName             string   `json:"judgeName"`
	Positions             []string `json:"positions"`
	BoutsCount            int      `json:"boutsCount"`
	TotalRed              int      `json:"totalRed"`
	TotalBlue             int      `json:"totalBlue"`
	ConsistencyScore      float64  `json:"consistencyScore"`
	RoundAgreementPct     float64  `json:"roundAgreementPct"`
	OverallWinnerAgreePct float64  `json:"overallWinnerAgreePct"`
	AvgDeviation          float64  `json:"avgDeviation"`
}

type BoutRow struct {
	BoutNumber     int                  `json:"boutNumber"`
	BoutID         uint                 `json:"boutId"`
	RedName        string               `json:"redName"`
	BlueName       string               `json:"blueName"`
	Winner         string               `json:"winner"`
	Decision       string               `json:"decision"`
	Rounds         []RoundEntry         `json:"rounds"`
	OverallWinners []OverallWinnerEntry `json:"overallWinners"`
}

type RoundEntry struct {
	RoundNumber int          `json:"roundNumber"`
	Scores      []ScoreEntry `json:"scores"`
}

type ScoreEntry struct {
	JudgeName string `json:"judgeName"`
	JudgeRole string `json:"judgeRole"`
	Red       int    `json:"red"`
	Blue      int    `json:"blue"`
}

type OverallWinnerEntry struct {
	JudgeName string `json:"judgeName"`
	JudgeRole string `json:"judgeRole"`
	Winner    string `json:"winner"`
}

// BoutMeta is the per-bout context required to build the report.
type BoutMeta struct {
	BoutID     uint
	BoutNumber int
	RedName    string
	BlueName   string
	Winner     string
	Decision   string
	Scores     []*entities.Score
}

func judgeKey(s *entities.Score) string {
	if s.JudgeName != "" {
		return s.JudgeName
	}
	return s.JudgeRole
}

// BuildReport aggregates per-judge metrics + per-bout breakdown.
func BuildReport(bouts []BoutMeta) JudgeConsistencyReport {
	type judgeAcc struct {
		totalRed       int
		totalBlue      int
		deviations     []float64
		roundAgree     int
		roundTotal     int
		overallAgree   int
		overallTotal   int
		positions      map[string]struct{}
		bouts          map[uint]struct{}
	}

	getOrInit := func(m map[string]*judgeAcc, name string) *judgeAcc {
		a, ok := m[name]
		if !ok {
			a = &judgeAcc{positions: map[string]struct{}{}, bouts: map[uint]struct{}{}}
			m[name] = a
		}
		return a
	}

	accs := map[string]*judgeAcc{}
	boutRows := make([]BoutRow, 0, len(bouts))

	for _, b := range bouts {
		// Group scores by round.
		byRound := map[int][]*entities.Score{}
		overallByJudge := map[string]string{}
		for _, s := range b.Scores {
			byRound[s.RoundNumber] = append(byRound[s.RoundNumber], s)
			if s.OverallWinner != "" {
				overallByJudge[judgeKey(s)] = s.OverallWinner
			}
		}

		// Build per-round entries + accumulate round-level deviation/agreement.
		rounds := make([]RoundEntry, 0, len(byRound))
		roundNums := make([]int, 0, len(byRound))
		for rn := range byRound {
			roundNums = append(roundNums, rn)
		}
		sort.Ints(roundNums)

		for _, rn := range roundNums {
			rs := byRound[rn]
			entry := RoundEntry{RoundNumber: rn}
			var sumRed, sumBlue float64
			redWins, blueWins := 0, 0
			for _, s := range rs {
				sumRed += float64(s.Red)
				sumBlue += float64(s.Blue)
				if s.Red > s.Blue {
					redWins++
				} else if s.Blue > s.Red {
					blueWins++
				}
				entry.Scores = append(entry.Scores, ScoreEntry{
					JudgeName: s.JudgeName,
					JudgeRole: s.JudgeRole,
					Red:       s.Red,
					Blue:      s.Blue,
				})
			}
			rounds = append(rounds, entry)

			n := float64(len(rs))
			if n == 0 {
				continue
			}
			meanRed := sumRed / n
			meanBlue := sumBlue / n
			var majority string
			switch {
			case redWins > blueWins:
				majority = "red"
			case blueWins > redWins:
				majority = "blue"
			default:
				majority = "draw"
			}

			for _, s := range rs {
				name := judgeKey(s)
				a := getOrInit(accs, name)
				a.totalRed += s.Red
				a.totalBlue += s.Blue
				a.deviations = append(a.deviations, math.Abs(float64(s.Red)-meanRed)+math.Abs(float64(s.Blue)-meanBlue))
				a.roundTotal++
				if s.JudgeRole != "" {
					a.positions[s.JudgeRole] = struct{}{}
				}
				a.bouts[b.BoutID] = struct{}{}

				var jw string
				switch {
				case s.Red > s.Blue:
					jw = "red"
				case s.Blue > s.Red:
					jw = "blue"
				default:
					jw = "draw"
				}
				if jw == majority {
					a.roundAgree++
				}
			}
		}

		// Overall winner agreement: panel majority across judges' picks.
		owEntries := make([]OverallWinnerEntry, 0, len(b.Scores))
		seenOW := map[string]bool{}
		redOW, blueOW := 0, 0
		for _, s := range b.Scores {
			key := judgeKey(s)
			if seenOW[key] {
				continue
			}
			seenOW[key] = true
			if s.OverallWinner != "" {
				owEntries = append(owEntries, OverallWinnerEntry{
					JudgeName: s.JudgeName,
					JudgeRole: s.JudgeRole,
					Winner:    s.OverallWinner,
				})
				switch s.OverallWinner {
				case "red":
					redOW++
				case "blue":
					blueOW++
				}
			}
		}
		var owMajority string
		switch {
		case redOW > blueOW:
			owMajority = "red"
		case blueOW > redOW:
			owMajority = "blue"
		}

		for judge, pick := range overallByJudge {
			a := getOrInit(accs, judge)
			a.overallTotal++
			if owMajority != "" && pick == owMajority {
				a.overallAgree++
			}
		}

		boutRows = append(boutRows, BoutRow{
			BoutNumber:     b.BoutNumber,
			BoutID:         b.BoutID,
			RedName:        b.RedName,
			BlueName:       b.BlueName,
			Winner:         b.Winner,
			Decision:       b.Decision,
			Rounds:         rounds,
			OverallWinners: owEntries,
		})
	}

	rows := make([]JudgeRow, 0, len(accs))
	for name, a := range accs {
		avgDev := 0.0
		if len(a.deviations) > 0 {
			sum := 0.0
			for _, d := range a.deviations {
				sum += d
			}
			avgDev = sum / float64(len(a.deviations))
		}
		roundAgree := 0.0
		if a.roundTotal > 0 {
			roundAgree = float64(a.roundAgree) / float64(a.roundTotal) * 100
		}
		owAgree := 0.0
		if a.overallTotal > 0 {
			owAgree = float64(a.overallAgree) / float64(a.overallTotal) * 100
		}
		devPenalty := avgDev
		if devPenalty > 5 {
			devPenalty = 5
		}
		devScore := 100 - (devPenalty/5)*100
		score := 0.5*roundAgree + 0.4*owAgree + 0.1*devScore

		positions := make([]string, 0, len(a.positions))
		for p := range a.positions {
			positions = append(positions, p)
		}
		sort.Strings(positions)

		rows = append(rows, JudgeRow{
			JudgeName:             name,
			Positions:             positions,
			BoutsCount:            len(a.bouts),
			TotalRed:              a.totalRed,
			TotalBlue:             a.totalBlue,
			ConsistencyScore:      score,
			RoundAgreementPct:     roundAgree,
			OverallWinnerAgreePct: owAgree,
			AvgDeviation:          avgDev,
		})
	}

	sort.Slice(rows, func(i, j int) bool {
		return rows[i].ConsistencyScore > rows[j].ConsistencyScore
	})
	sort.Slice(boutRows, func(i, j int) bool {
		return boutRows[i].BoutNumber < boutRows[j].BoutNumber
	})

	return JudgeConsistencyReport{Judges: rows, Bouts: boutRows}
}
