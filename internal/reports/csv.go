package reports

import (
	"encoding/csv"
	"fmt"
	"io"
	"sort"
	"strings"
)

// WriteFullCSV writes the full report to w.
func WriteFullCSV(w io.Writer, rd *ReportData) error {
	cw := csv.NewWriter(w)
	cw.Write([]string{"Card", rd.CardName, rd.CardDate})
	cw.Write(nil)

	for _, b := range rd.Bouts {
		cw.Write([]string{
			"Bout", fmt.Sprintf("%d", b.BoutNumber),
			"Type", b.BoutType,
			"Weight", fmt.Sprintf("%dkg", b.WeightClass),
			"Gender", b.Gender,
			"AgeCategory", b.AgeCategory,
			"Experience", b.Experience,
			"Gloves", b.GloveSize,
			"RoundLength", fmt.Sprintf("%.1fmin", b.RoundLength),
		})
		cw.Write([]string{"Red", b.RedName, "Club", b.RedClub})
		cw.Write([]string{"Blue", b.BlueName, "Club", b.BlueClub})
		cw.Write([]string{"Referee", b.Referee})
		cw.Write([]string{"Winner", b.Winner, "Decision", b.Decision})

		if len(b.Comments) > 0 {
			cw.Write([]string{"Comments", strings.Join(b.Comments, "; ")})
		}

		// Group scores by judge for a clean table.
		if len(b.Scores) > 0 {
			// Collect unique judges in role order.
			judgeOrder := []string{}
			seen := map[string]bool{}
			for _, s := range b.Scores {
				if !seen[s.JudgeRole] {
					seen[s.JudgeRole] = true
					judgeOrder = append(judgeOrder, s.JudgeRole)
				}
			}
			sort.Strings(judgeOrder)

			// Header row: Judge1 name, Judge2 name, ...
			header := []string{"Round"}
			for _, role := range judgeOrder {
				name := role
				for _, s := range b.Scores {
					if s.JudgeRole == role && s.JudgeName != "" {
						name = s.JudgeName
						break
					}
				}
				header = append(header, name+" Red", name+" Blue")
			}
			cw.Write(header)

			// One row per round.
			rounds := map[int]bool{}
			for _, s := range b.Scores {
				rounds[s.Round] = true
			}
			roundNums := []int{}
			for r := range rounds {
				roundNums = append(roundNums, r)
			}
			sort.Ints(roundNums)

			for _, r := range roundNums {
				row := []string{fmt.Sprintf("Round %d", r)}
				for _, role := range judgeOrder {
					redVal, blueVal := "-", "-"
					for _, s := range b.Scores {
						if s.JudgeRole == role && s.Round == r {
							redVal = fmt.Sprintf("%d", s.Red)
							blueVal = fmt.Sprintf("%d", s.Blue)
							break
						}
					}
					row = append(row, redVal, blueVal)
				}
				cw.Write(row)
			}

			// Overall winner row.
			owRow := []string{"Overall Winner"}
			for _, role := range judgeOrder {
				ow := "-"
				for _, s := range b.Scores {
					if s.JudgeRole == role && s.OverallWinner != "" {
						ow = s.OverallWinner
						break
					}
				}
				owRow = append(owRow, ow, "")
			}
			cw.Write(owRow)
		}

		cw.Write(nil)
	}

	cw.Flush()
	return cw.Error()
}

// WritePublicCSV writes the public (results-only) report.
func WritePublicCSV(w io.Writer, rd *ReportData) error {
	cw := csv.NewWriter(w)
	cw.Write([]string{"Card", rd.CardName, rd.CardDate})
	cw.Write(nil)
	cw.Write([]string{"Bout", "Red Athlete", "Red Affiliation", "Blue Athlete", "Blue Affiliation", "Winner", "Decision"})

	for _, b := range rd.Bouts {
		cw.Write([]string{
			fmt.Sprintf("%d", b.BoutNumber),
			b.RedName, b.RedClub,
			b.BlueName, b.BlueClub,
			b.Winner, b.Decision,
		})
	}

	cw.Flush()
	return cw.Error()
}

// WriteConsistencyCSV writes the judge consistency report.
func WriteConsistencyCSV(w io.Writer, cr *ConsistencyReport) error {
	cw := csv.NewWriter(w)
	cw.Write([]string{"Card", cr.CardName})
	cw.Write(nil)
	cw.Write([]string{"Judge", "Bouts Scored", "Points", "Rating (%)"})

	for _, row := range cr.Rows {
		cw.Write([]string{
			row.JudgeName,
			fmt.Sprintf("%d", row.BoutsScored),
			fmt.Sprintf("%.1f", row.Points),
			fmt.Sprintf("%.1f", row.Rating),
		})
	}

	cw.Flush()
	return cw.Error()
}
