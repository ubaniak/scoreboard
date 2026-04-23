package reports

import (
	"encoding/csv"
	"fmt"
	"io"
	"sort"
	"strings"
)

var decisionLabels = map[string]string{
	"ud":    "Unanimous Decision",
	"sd":    "Split Decision",
	"md":    "Majority Decision",
	"rsc":   "Referee Stop Contest",
	"rsc-i": "Referee Stop Contest (Injury)",
	"abd":   "Abandon",
	"dq":    "Disqualified",
	"c":     "Cancelled",
	"wo":    "Walk Over",
}

func decisionLabel(code string) string {
	if l, ok := decisionLabels[code]; ok {
		return l
	}
	return code
}

func winnerLabel(w string) string {
	switch w {
	case "red":
		return "Red Corner"
	case "blue":
		return "Blue Corner"
	default:
		return w
	}
}

// WriteFullCSV writes the full report in the same format as the old client-side export.
func WriteFullCSV(w io.Writer, rd *ReportData) error {
	cw := csv.NewWriter(w)

	cw.Write([]string{"Card", rd.CardName})
	cw.Write([]string{"Card Date", rd.CardDate})
	cw.Write(nil)

	for _, b := range rd.Bouts {
		cw.Write([]string{"Bout #", fmt.Sprintf("%d", b.BoutNumber)})
		cw.Write([]string{"Red Corner", b.RedName})
		cw.Write([]string{"Blue Corner", b.BlueName})
		cw.Write([]string{"Age Category", b.AgeCategory})
		cw.Write([]string{"Gender", b.Gender})
		cw.Write([]string{"Experience", b.Experience})
		cw.Write([]string{"Weight Class", fmt.Sprintf("%dkg", b.WeightClass)})
		cw.Write([]string{"Glove Size", b.GloveSize})
		cw.Write([]string{"Round Length (min)", fmt.Sprintf("%.0f", b.RoundLength)})
		cw.Write([]string{"Number of Rounds", fmt.Sprintf("%d", b.NumberOfRounds)})
		cw.Write([]string{"Referee", b.Referee})
		cw.Write([]string{"Status", b.Status})
		cw.Write([]string{"Winner", winnerLabel(b.Winner)})
		cw.Write([]string{"Decision", decisionLabel(b.Decision)})

		if len(b.Comments) > 0 {
			cw.Write([]string{"Comments", strings.Join(b.Comments, " | ")})
		}

		if len(b.Scores) > 0 {
			cw.Write(nil)
			cw.Write([]string{"Round", "Judge Role", "Judge Name", "Red Score", "Blue Score"})

			// Collect and sort rounds
			roundSet := map[int]bool{}
			for _, s := range b.Scores {
				roundSet[s.Round] = true
			}
			var rounds []int
			for r := range roundSet {
				rounds = append(rounds, r)
			}
			sort.Ints(rounds)

			// Collect judge order
			judgeOrder := uniqueRoles(b.Scores)

			for _, r := range rounds {
				for _, role := range judgeOrder {
					for _, s := range b.Scores {
						if s.JudgeRole == role && s.Round == r {
							name := s.JudgeName
							if name == "" {
								name = s.JudgeRole
							}
							cw.Write([]string{
								fmt.Sprintf("%d", r),
								s.JudgeRole,
								name,
								fmt.Sprintf("%d", s.Red),
								fmt.Sprintf("%d", s.Blue),
							})
							break
						}
					}
				}
			}
		}

		cw.Write(nil)
	}

	cw.Flush()
	return cw.Error()
}

// WritePublicCSV writes the public results report matching the old client-side format.
func WritePublicCSV(w io.Writer, rd *ReportData) error {
	cw := csv.NewWriter(w)

	cw.Write([]string{"Card", rd.CardName})
	cw.Write([]string{"Card Date", rd.CardDate})
	cw.Write(nil)
	cw.Write([]string{
		"Bout #", "Red Corner", "Blue Corner", "Age Category", "Gender",
		"Experience", "Weight Class", "Glove Size", "Winner", "Decision",
	})

	for _, b := range rd.Bouts {
		cw.Write([]string{
			fmt.Sprintf("%d", b.BoutNumber),
			b.RedName,
			b.BlueName,
			b.AgeCategory,
			b.Gender,
			b.Experience,
			fmt.Sprintf("%dkg", b.WeightClass),
			b.GloveSize,
			winnerLabel(b.Winner),
			decisionLabel(b.Decision),
		})
	}

	cw.Flush()
	return cw.Error()
}

// WriteConsistencyCSV writes the judge consistency report matching the old client-side format.
func WriteConsistencyCSV(w io.Writer, cr *ConsistencyReport) error {
	cw := csv.NewWriter(w)

	cw.Write([]string{"Card", cr.CardName})
	cw.Write([]string{"Date", cr.CardDate})
	cw.Write(nil)
	cw.Write([]string{"Judge", "Total Red", "Total Blue", "Avg Deviation from Panel", "Agreement with Majority (%)"})

	for _, row := range cr.Rows {
		cw.Write([]string{
			row.JudgeName,
			fmt.Sprintf("%d", row.TotalRed),
			fmt.Sprintf("%d", row.TotalBlue),
			fmt.Sprintf("%.2f", row.AvgDeviation),
			fmt.Sprintf("%.1f", row.AgreementPct),
		})
	}

	cw.Flush()
	return cw.Error()
}
