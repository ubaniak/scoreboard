package scores_test

import (
	"github.com/ubaniak/scoreboard/internal/scores"
	"github.com/ubaniak/scoreboard/internal/scores/entities"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Consistency", func() {
	mkScore := func(bout, round int, judge string, red, blue int) *entities.Score {
		return &entities.Score{
			BoutNumber:  bout,
			RoundNumber: round,
			JudgeName:   judge,
			Red:         red,
			Blue:        blue,
		}
	}

	findRow := func(rows []scores.JudgeConsistencyRow, name string) *scores.JudgeConsistencyRow {
		for i := range rows {
			if rows[i].JudgeName == name {
				return &rows[i]
			}
		}
		return nil
	}

	It("returns empty slice for no scores", func() {
		Expect(scores.Consistency(nil)).To(BeEmpty())
		Expect(scores.Consistency([]*entities.Score{})).To(BeEmpty())
	})

	It("falls back to JudgeRole when JudgeName empty", func() {
		rows := scores.Consistency([]*entities.Score{
			{BoutNumber: 1, RoundNumber: 1, JudgeRole: "judge1", Red: 10, Blue: 9},
		})
		Expect(rows).To(HaveLen(1))
		Expect(rows[0].JudgeName).To(Equal("judge1"))
	})

	It("sorts rows by AgreementPct descending", func() {
		// 3 judges, 1 round. j1 + j2 pick red (majority), j3 picks blue.
		rows := scores.Consistency([]*entities.Score{
			mkScore(1, 1, "j1", 10, 9),
			mkScore(1, 1, "j2", 10, 9),
			mkScore(1, 1, "j3", 9, 10),
		})
		Expect(rows).To(HaveLen(3))
		Expect(rows[0].AgreementPct).To(BeNumerically(">=", rows[1].AgreementPct))
		Expect(rows[1].AgreementPct).To(BeNumerically(">=", rows[2].AgreementPct))
		Expect(rows[2].JudgeName).To(Equal("j3"))
	})

	DescribeTable("per-judge metrics",
		func(input []*entities.Score, judge string, expected scores.JudgeConsistencyRow) {
			rows := scores.Consistency(input)
			row := findRow(rows, judge)
			Expect(row).NotTo(BeNil())
			Expect(row.TotalRed).To(Equal(expected.TotalRed))
			Expect(row.TotalBlue).To(Equal(expected.TotalBlue))
			Expect(row.AvgDeviation).To(BeNumerically("~", expected.AvgDeviation, 0.0001))
			Expect(row.AgreementPct).To(BeNumerically("~", expected.AgreementPct, 0.0001))
		},
		Entry("single judge single round: zero deviation, 100% agree",
			[]*entities.Score{mkScore(1, 1, "j1", 10, 9)},
			"j1",
			scores.JudgeConsistencyRow{TotalRed: 10, TotalBlue: 9, AvgDeviation: 0, AgreementPct: 100},
		),
		Entry("identical scores: zero deviation, 100% agree",
			[]*entities.Score{
				mkScore(1, 1, "j1", 10, 9),
				mkScore(1, 1, "j2", 10, 9),
				mkScore(1, 1, "j3", 10, 9),
			},
			"j1",
			scores.JudgeConsistencyRow{TotalRed: 10, TotalBlue: 9, AvgDeviation: 0, AgreementPct: 100},
		),
		Entry("dissenting judge: nonzero deviation, 0% agree",
			// mean red = (10+10+9)/3 = 9.6667; blue = (9+9+10)/3 = 9.3333
			// j3 dev = |9-9.6667| + |10-9.3333| = 0.6667 + 0.6667 = 1.3333
			[]*entities.Score{
				mkScore(1, 1, "j1", 10, 9),
				mkScore(1, 1, "j2", 10, 9),
				mkScore(1, 1, "j3", 9, 10),
			},
			"j3",
			scores.JudgeConsistencyRow{TotalRed: 9, TotalBlue: 10, AvgDeviation: 1.3333, AgreementPct: 0},
		),
		Entry("majority judge: small deviation, 100% agree",
			[]*entities.Score{
				mkScore(1, 1, "j1", 10, 9),
				mkScore(1, 1, "j2", 10, 9),
				mkScore(1, 1, "j3", 9, 10),
			},
			"j1",
			// dev = |10-9.6667| + |9-9.3333| = 0.3333 + 0.3333 = 0.6667
			scores.JudgeConsistencyRow{TotalRed: 10, TotalBlue: 9, AvgDeviation: 0.6667, AgreementPct: 100},
		),
		Entry("totals aggregate across rounds",
			[]*entities.Score{
				mkScore(1, 1, "j1", 10, 9),
				mkScore(1, 2, "j1", 9, 10),
				mkScore(2, 1, "j1", 10, 8),
			},
			"j1",
			scores.JudgeConsistencyRow{TotalRed: 29, TotalBlue: 27, AvgDeviation: 0, AgreementPct: 100},
		),
		Entry("draw round: judge picking red disagrees with draw majority",
			// 2 judges tied 10-10 each, j3 picks 10-9. redWins=1, blueWins=0 → majority=red.
			// Wait: j1=10-10 (no winner), j2=10-10 (no winner), j3=10-9 (red).
			// redWins=1, blueWins=0 → majority red. j3 agrees, j1/j2 do not.
			[]*entities.Score{
				mkScore(1, 1, "j1", 10, 10),
				mkScore(1, 1, "j2", 10, 10),
				mkScore(1, 1, "j3", 10, 9),
			},
			"j1",
			// mean red = 30/3 = 10; mean blue = 29/3 = 9.6667
			// j1 dev = |10-10| + |10-9.6667| = 0.3333
			scores.JudgeConsistencyRow{TotalRed: 10, TotalBlue: 10, AvgDeviation: 0.3333, AgreementPct: 0},
		),
		Entry("tie in winners across judges: majority is draw",
			// j1 red, j2 blue → redWins=blueWins=1 → majority=draw. Neither agrees.
			[]*entities.Score{
				mkScore(1, 1, "j1", 10, 9),
				mkScore(1, 1, "j2", 9, 10),
			},
			"j1",
			// mean red 9.5, mean blue 9.5; dev = 0.5 + 0.5 = 1
			scores.JudgeConsistencyRow{TotalRed: 10, TotalBlue: 9, AvgDeviation: 1, AgreementPct: 0},
		),
		Entry("agreement averaged across rounds: 1 of 2",
			// Round 1: j1 agrees with majority red. Round 2: j1 picks blue, majority red → disagrees.
			[]*entities.Score{
				mkScore(1, 1, "j1", 10, 9),
				mkScore(1, 1, "j2", 10, 9),
				mkScore(1, 2, "j1", 9, 10),
				mkScore(1, 2, "j2", 10, 9),
				mkScore(1, 2, "j3", 10, 9),
			},
			"j1",
			scores.JudgeConsistencyRow{TotalRed: 19, TotalBlue: 19, AvgDeviation: 0.6667, AgreementPct: 50},
		),
	)
})
