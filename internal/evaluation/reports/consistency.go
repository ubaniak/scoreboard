package reports

import (
	"encoding/csv"
	"fmt"
	"io"
	"sort"
	"strings"

	boutEntities "github.com/ubaniak/scoreboard/internal/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/scores"
)

type JudgeConsistencyData struct {
	CardName string
	CardDate string
	Report   scores.JudgeConsistencyReport
}

func (uc *useCase) JudgeConsistencyReport(cardId uint) (*JudgeConsistencyData, error) {
	card, err := uc.cards.Get(cardId)
	if err != nil {
		return nil, err
	}
	boutList, err := uc.bouts.List(cardId)
	if err != nil {
		return nil, err
	}

	metas := make([]scores.BoutMeta, 0, len(boutList))
	for _, b := range boutList {
		if b.BoutType != boutEntities.BoutTypeScored {
			continue
		}
		scoreList, err := uc.scores.List(cardId, b.ID)
		if err != nil {
			return nil, err
		}
		var redName, blueName string
		if b.RedAthleteID != nil {
			if a, err := uc.athletes.Get(*b.RedAthleteID); err == nil && a != nil {
				redName = a.Name
			}
		}
		if b.BlueAthleteID != nil {
			if a, err := uc.athletes.Get(*b.BlueAthleteID); err == nil && a != nil {
				blueName = a.Name
			}
		}
		metas = append(metas, scores.BoutMeta{
			BoutID:     b.ID,
			BoutNumber: b.BoutNumber,
			RedName:    redName,
			BlueName:   blueName,
			Winner:     b.Winner,
			Decision:   b.Decision,
			Scores:     scoreList,
		})
	}

	report := scores.BuildReport(metas)
	return &JudgeConsistencyData{
		CardName: card.Name,
		CardDate: card.Date,
		Report:   report,
	}, nil
}

// --- Short report: judge table only ---

func WriteShortConsistencyCSV(w io.Writer, d *JudgeConsistencyData) error {
	cw := csv.NewWriter(w)
	cw.Write([]string{"Card", d.CardName})
	cw.Write([]string{"Card Date", d.CardDate})
	cw.Write(nil)
	cw.Write([]string{
		"Judge", "# Bouts", "Total Red", "Total Blue",
		"Round Agreement %", "Overall Winner Agreement %",
		"Avg Deviation", "Consistency Score", "Positions",
	})
	for _, j := range d.Report.Judges {
		cw.Write([]string{
			j.JudgeName,
			fmt.Sprintf("%d", j.BoutsCount),
			fmt.Sprintf("%d", j.TotalRed),
			fmt.Sprintf("%d", j.TotalBlue),
			fmt.Sprintf("%.1f", j.RoundAgreementPct),
			fmt.Sprintf("%.1f", j.OverallWinnerAgreePct),
			fmt.Sprintf("%.3f", j.AvgDeviation),
			fmt.Sprintf("%.1f", j.ConsistencyScore),
			strings.Join(j.Positions, ", "),
		})
	}
	cw.Flush()
	return cw.Error()
}

func WriteShortConsistencyPDF(w io.Writer, d *JudgeConsistencyData) error {
	pdf := newPDF()
	pdf.AddPage()
	pageHeader(pdf, "Judge Consistency — Short Report", d.CardName, d.CardDate)

	cols := []float64{60, 18, 22, 22, 30, 36, 26, 30, 21}
	hdrs := []string{"Judge", "# Bouts", "Total Red", "Total Blue", "Round Agree %", "Overall Agree %", "Avg Dev", "Score", "Positions"}

	setFont(pdf, "B", smallFont)
	pdf.SetFillColor(220, 220, 220)
	for i, h := range hdrs {
		pdf.CellFormat(cols[i], rowH, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	setFont(pdf, "", smallFont)
	for _, j := range d.Report.Judges {
		pdf.CellFormat(cols[0], rowH, j.JudgeName, "1", 0, "L", false, 0, "")
		pdf.CellFormat(cols[1], rowH, fmt.Sprintf("%d", j.BoutsCount), "1", 0, "C", false, 0, "")
		pdf.CellFormat(cols[2], rowH, fmt.Sprintf("%d", j.TotalRed), "1", 0, "C", false, 0, "")
		pdf.CellFormat(cols[3], rowH, fmt.Sprintf("%d", j.TotalBlue), "1", 0, "C", false, 0, "")
		pdf.CellFormat(cols[4], rowH, fmt.Sprintf("%.1f", j.RoundAgreementPct), "1", 0, "C", false, 0, "")
		pdf.CellFormat(cols[5], rowH, fmt.Sprintf("%.1f", j.OverallWinnerAgreePct), "1", 0, "C", false, 0, "")
		pdf.CellFormat(cols[6], rowH, fmt.Sprintf("%.2f", j.AvgDeviation), "1", 0, "C", false, 0, "")
		pdf.CellFormat(cols[7], rowH, fmt.Sprintf("%.1f", j.ConsistencyScore), "1", 0, "C", false, 0, "")
		pdf.CellFormat(cols[8], rowH, strings.Join(j.Positions, ","), "1", 0, "C", false, 0, "")
		pdf.Ln(-1)
	}
	return pdf.Output(w)
}

// --- Full report: judge table + per-judge bout breakdown ---

func keyOf(name, role string) string {
	if name != "" {
		return name
	}
	return role
}

func boutsForJudge(judgeName string, allBouts []scores.BoutRow) []scores.BoutRow {
	var out []scores.BoutRow
	for _, b := range allBouts {
		match := false
		for _, ow := range b.OverallWinners {
			if keyOf(ow.JudgeName, ow.JudgeRole) == judgeName {
				match = true
				break
			}
		}
		if !match {
			for _, r := range b.Rounds {
				for _, s := range r.Scores {
					if keyOf(s.JudgeName, s.JudgeRole) == judgeName {
						match = true
						break
					}
				}
				if match {
					break
				}
			}
		}
		if match {
			out = append(out, b)
		}
	}
	return out
}

func WriteFullConsistencyCSV(w io.Writer, d *JudgeConsistencyData) error {
	cw := csv.NewWriter(w)
	cw.Write([]string{"Card", d.CardName})
	cw.Write([]string{"Card Date", d.CardDate})
	cw.Write(nil)

	for _, j := range d.Report.Judges {
		cw.Write([]string{"Judge", j.JudgeName})
		cw.Write([]string{"Consistency Score", fmt.Sprintf("%.1f", j.ConsistencyScore)})
		cw.Write([]string{"Round Agreement %", fmt.Sprintf("%.1f", j.RoundAgreementPct)})
		cw.Write([]string{"Overall Winner Agreement %", fmt.Sprintf("%.1f", j.OverallWinnerAgreePct)})
		cw.Write([]string{"Avg Deviation", fmt.Sprintf("%.3f", j.AvgDeviation)})
		cw.Write([]string{"# Bouts", fmt.Sprintf("%d", j.BoutsCount)})
		cw.Write([]string{"Total Red", fmt.Sprintf("%d", j.TotalRed)})
		cw.Write([]string{"Total Blue", fmt.Sprintf("%d", j.TotalBlue)})
		cw.Write([]string{"Positions", strings.Join(j.Positions, ", ")})
		cw.Write(nil)

		for _, b := range boutsForJudge(j.JudgeName, d.Report.Bouts) {
			cw.Write([]string{"Bout #", fmt.Sprintf("%d", b.BoutNumber)})
			cw.Write([]string{"Red", b.RedName})
			cw.Write([]string{"Blue", b.BlueName})
			cw.Write([]string{"Winner", winnerLabel(b.Winner)})
			cw.Write([]string{"Decision", decisionLabel(b.Decision)})

			cw.Write([]string{"Round", "Judge Role", "Judge Name", "Red Score", "Blue Score"})
			rounds := append([]scores.RoundEntry(nil), b.Rounds...)
			sort.Slice(rounds, func(a, b int) bool { return rounds[a].RoundNumber < rounds[b].RoundNumber })
			for _, r := range rounds {
				rs := append([]scores.ScoreEntry(nil), r.Scores...)
				sort.Slice(rs, func(a, b int) bool { return rs[a].JudgeRole < rs[b].JudgeRole })
				for _, s := range rs {
					name := s.JudgeName
					if name == "" {
						name = s.JudgeRole
					}
					cw.Write([]string{
						fmt.Sprintf("%d", r.RoundNumber),
						s.JudgeRole,
						name,
						fmt.Sprintf("%d", s.Red),
						fmt.Sprintf("%d", s.Blue),
					})
				}
			}
			ows := append([]scores.OverallWinnerEntry(nil), b.OverallWinners...)
			sort.Slice(ows, func(a, b int) bool { return ows[a].JudgeRole < ows[b].JudgeRole })
			for _, ow := range ows {
				name := ow.JudgeName
				if name == "" {
					name = ow.JudgeRole
				}
				cw.Write([]string{"Overall Pick", ow.JudgeRole, name, winnerLabel(ow.Winner), ""})
			}
			cw.Write(nil)
		}
		cw.Write(nil)
	}

	cw.Flush()
	return cw.Error()
}

func WriteFullConsistencyPDF(w io.Writer, d *JudgeConsistencyData) error {
	pdf := newPDF()
	pdf.AddPage()
	pageHeader(pdf, "Judge Consistency — Full Report", d.CardName, d.CardDate)

	for ji, j := range d.Report.Judges {
		if ji > 0 {
			pdf.Ln(4)
		}
		if pdf.GetY() > 170 {
			pdf.AddPage()
		}
		sectionLabel(pdf, fmt.Sprintf("%s  —  Score %.1f", j.JudgeName, j.ConsistencyScore))
		metaRowPair(pdf, "Round Agreement", fmt.Sprintf("%.1f%%", j.RoundAgreementPct), "Overall Agreement", fmt.Sprintf("%.1f%%", j.OverallWinnerAgreePct))
		metaRowPair(pdf, "# Bouts", fmt.Sprintf("%d", j.BoutsCount), "Avg Deviation", fmt.Sprintf("%.2f", j.AvgDeviation))
		metaRowPair(pdf, "Total Red", fmt.Sprintf("%d", j.TotalRed), "Total Blue", fmt.Sprintf("%d", j.TotalBlue))
		metaRow(pdf, "Positions", strings.Join(j.Positions, ", "))

		bouts := boutsForJudge(j.JudgeName, d.Report.Bouts)
		for _, b := range bouts {
			if pdf.GetY() > 175 {
				pdf.AddPage()
			}
			pdf.Ln(2)
			sectionLabel(pdf, fmt.Sprintf("Bout %d  —  %s vs %s", b.BoutNumber, defaultStr(b.RedName, "Red"), defaultStr(b.BlueName, "Blue")))
			metaRowPair(pdf, "Winner", winnerLabel(b.Winner), "Decision", decisionLabel(b.Decision))

			rounds := append([]scores.RoundEntry(nil), b.Rounds...)
			sort.Slice(rounds, func(a, b int) bool { return rounds[a].RoundNumber < rounds[b].RoundNumber })
			if len(rounds) == 0 {
				continue
			}

			// One row per judge; columns red/blue per round + overall pick.
			judgesInBout := uniqueJudges(b)
			roundColW := 60.0
			cellW := (contentW - roundColW) / float64(len(rounds)+1)
			redW := cellW * 0.5
			blueW := cellW * 0.5

			setFont(pdf, "B", smallFont)
			pdf.SetFillColor(220, 220, 220)
			pdf.CellFormat(roundColW, rowH, "Judge", "1", 0, "C", true, 0, "")
			for _, r := range rounds {
				pdf.CellFormat(cellW, rowH, fmt.Sprintf("Round %d", r.RoundNumber), "1", 0, "C", true, 0, "")
			}
			pdf.CellFormat(cellW, rowH, "Overall", "1", 0, "C", true, 0, "")
			pdf.Ln(-1)

			setFont(pdf, "", smallFont)
			pdf.CellFormat(roundColW, rowH, "", "1", 0, "C", false, 0, "")
			for range rounds {
				pdf.SetTextColor(192, 57, 43)
				pdf.CellFormat(redW, rowH, "Red", "1", 0, "C", false, 0, "")
				pdf.SetTextColor(41, 128, 185)
				pdf.CellFormat(blueW, rowH, "Blue", "1", 0, "C", false, 0, "")
				pdf.SetTextColor(0, 0, 0)
			}
			pdf.CellFormat(cellW, rowH, "", "1", 0, "C", false, 0, "")
			pdf.Ln(-1)

			for _, judgeKey := range judgesInBout {
				bold := judgeKey == j.JudgeName
				if bold {
					setFont(pdf, "B", smallFont)
				} else {
					setFont(pdf, "", smallFont)
				}
				pdf.CellFormat(roundColW, rowH, judgeKey, "1", 0, "L", false, 0, "")
				for _, r := range rounds {
					redVal, blueVal := "-", "-"
					for _, s := range r.Scores {
						if keyOf(s.JudgeName, s.JudgeRole) == judgeKey {
							redVal = fmt.Sprintf("%d", s.Red)
							blueVal = fmt.Sprintf("%d", s.Blue)
							break
						}
					}
					pdf.SetTextColor(192, 57, 43)
					pdf.CellFormat(redW, rowH, redVal, "1", 0, "C", false, 0, "")
					pdf.SetTextColor(41, 128, 185)
					pdf.CellFormat(blueW, rowH, blueVal, "1", 0, "C", false, 0, "")
					pdf.SetTextColor(0, 0, 0)
				}
				ow := "-"
				for _, e := range b.OverallWinners {
					if keyOf(e.JudgeName, e.JudgeRole) == judgeKey {
						ow = winnerLabel(e.Winner)
						break
					}
				}
				pdf.CellFormat(cellW, rowH, ow, "1", 0, "C", false, 0, "")
				pdf.Ln(-1)
			}
			setFont(pdf, "", smallFont)
		}
	}

	return pdf.Output(w)
}

func uniqueJudges(b scores.BoutRow) []string {
	seen := map[string]bool{}
	var out []string
	for _, r := range b.Rounds {
		for _, s := range r.Scores {
			k := keyOf(s.JudgeName, s.JudgeRole)
			if !seen[k] {
				seen[k] = true
				out = append(out, k)
			}
		}
	}
	for _, ow := range b.OverallWinners {
		k := keyOf(ow.JudgeName, ow.JudgeRole)
		if !seen[k] {
			seen[k] = true
			out = append(out, k)
		}
	}
	sort.Strings(out)
	return out
}

func defaultStr(s, fallback string) string {
	if s == "" {
		return fallback
	}
	return s
}

