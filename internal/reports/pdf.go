package reports

import (
	"fmt"
	"io"
	"sort"
	"strings"

	"github.com/go-pdf/fpdf"
)

const (
	pageW      = 210.0
	marginL    = 12.0
	marginR    = 12.0
	contentW   = pageW - marginL - marginR
	headerH    = 7.0
	rowH       = 6.0
	smallFont  = 8.0
	normalFont = 10.0
	titleFont  = 14.0
)

func newPDF() *fpdf.Fpdf {
	pdf := fpdf.New("L", "mm", "A4", "")
	pdf.SetMargins(marginL, 12, marginR)
	pdf.SetAutoPageBreak(true, 14)
	return pdf
}

func setFont(pdf *fpdf.Fpdf, style string, size float64) {
	pdf.SetFont("Helvetica", style, size)
}

func header(pdf *fpdf.Fpdf, title, cardName, date string) {
	setFont(pdf, "B", titleFont)
	pdf.CellFormat(0, 10, title, "", 1, "C", false, 0, "")
	setFont(pdf, "", normalFont)
	pdf.CellFormat(0, 6, cardName+"  |  "+date, "", 1, "C", false, 0, "")
	pdf.Ln(4)
}

func sectionTitle(pdf *fpdf.Fpdf, text string) {
	setFont(pdf, "B", normalFont)
	pdf.SetFillColor(230, 230, 230)
	pdf.CellFormat(0, headerH, text, "1", 1, "L", true, 0, "")
	setFont(pdf, "", smallFont)
}

// WriteFullPDF writes the full report PDF to w.
func WriteFullPDF(w io.Writer, rd *ReportData) error {
	pdf := newPDF()
	pdf.AddPage()
	header(pdf, "Full Report", rd.CardName, rd.CardDate)

	for _, b := range rd.Bouts {
		if pdf.GetY() > 170 {
			pdf.AddPage()
		}

		boutTypeLabel := strings.ToUpper(b.BoutType[:1]) + b.BoutType[1:]
		sectionTitle(pdf, fmt.Sprintf("Bout %d  —  %s  |  %s vs %s", b.BoutNumber, boutTypeLabel, b.RedName, b.BlueName))

		setFont(pdf, "", smallFont)
		col := contentW / 2
		pdf.CellFormat(col, rowH, fmt.Sprintf("Weight: %dkg  Gloves: %s  Rounds: %.1fmin", b.WeightClass, b.GloveSize, b.RoundLength), "", 0, "L", false, 0, "")
		pdf.CellFormat(col, rowH, fmt.Sprintf("Gender: %s  Age: %s  Exp: %s", b.Gender, b.AgeCategory, b.Experience), "", 1, "L", false, 0, "")

		pdf.CellFormat(col, rowH, "Red: "+b.RedName+" ("+b.RedClub+")", "", 0, "L", false, 0, "")
		pdf.CellFormat(col, rowH, "Blue: "+b.BlueName+" ("+b.BlueClub+")", "", 1, "L", false, 0, "")

		pdf.CellFormat(col, rowH, "Referee: "+b.Referee, "", 0, "L", false, 0, "")
		pdf.CellFormat(col, rowH, fmt.Sprintf("Winner: %s  Decision: %s", b.Winner, b.Decision), "", 1, "L", false, 0, "")

		if len(b.Comments) > 0 {
			pdf.CellFormat(0, rowH, "Comments: "+strings.Join(b.Comments, "; "), "", 1, "L", false, 0, "")
		}

		// Scores table
		if len(b.Scores) > 0 {
			judgeOrder := uniqueRoles(b.Scores)
			judgeNames := resolveNames(b.Scores, judgeOrder)
			roundNums := uniqueRounds(b.Scores)

			pdf.Ln(2)
			setFont(pdf, "B", smallFont)
			judgeColW := contentW / float64(len(judgeOrder)+1)
			pdf.CellFormat(judgeColW, rowH, "Round", "1", 0, "C", false, 0, "")
			for _, role := range judgeOrder {
				name := judgeNames[role]
				pdf.CellFormat(judgeColW, rowH, name+" (R/B)", "1", 0, "C", false, 0, "")
			}
			pdf.Ln(-1)

			setFont(pdf, "", smallFont)
			for _, r := range roundNums {
				pdf.CellFormat(judgeColW, rowH, fmt.Sprintf("Round %d", r), "1", 0, "C", false, 0, "")
				for _, role := range judgeOrder {
					red, blue := "-", "-"
					for _, s := range b.Scores {
						if s.JudgeRole == role && s.Round == r {
							red = fmt.Sprintf("%d", s.Red)
							blue = fmt.Sprintf("%d", s.Blue)
							break
						}
					}
					pdf.CellFormat(judgeColW, rowH, red+"/"+blue, "1", 0, "C", false, 0, "")
				}
				pdf.Ln(-1)
			}

			// Overall winner row
			setFont(pdf, "B", smallFont)
			pdf.CellFormat(judgeColW, rowH, "Overall", "1", 0, "C", false, 0, "")
			for _, role := range judgeOrder {
				ow := "-"
				for _, s := range b.Scores {
					if s.JudgeRole == role && s.OverallWinner != "" {
						ow = s.OverallWinner
						break
					}
				}
				pdf.CellFormat(judgeColW, rowH, ow, "1", 0, "C", false, 0, "")
			}
			pdf.Ln(-1)
		}

		pdf.Ln(4)
	}

	return pdf.Output(w)
}

// WritePublicPDF writes the public report PDF.
func WritePublicPDF(w io.Writer, rd *ReportData) error {
	pdf := newPDF()
	pdf.AddPage()
	header(pdf, "Public Results", rd.CardName, rd.CardDate)

	// Table header
	setFont(pdf, "B", smallFont)
	pdf.SetFillColor(220, 220, 220)
	cols := []float64{15, 45, 35, 45, 35, 25, 30}
	hdrs := []string{"Bout", "Red Athlete", "Red Club", "Blue Athlete", "Blue Club", "Winner", "Decision"}
	for i, h := range hdrs {
		pdf.CellFormat(cols[i], rowH, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	setFont(pdf, "", smallFont)
	for _, b := range rd.Bouts {
		pdf.CellFormat(cols[0], rowH, fmt.Sprintf("%d", b.BoutNumber), "1", 0, "C", false, 0, "")
		pdf.CellFormat(cols[1], rowH, b.RedName, "1", 0, "L", false, 0, "")
		pdf.CellFormat(cols[2], rowH, b.RedClub, "1", 0, "L", false, 0, "")
		pdf.CellFormat(cols[3], rowH, b.BlueName, "1", 0, "L", false, 0, "")
		pdf.CellFormat(cols[4], rowH, b.BlueClub, "1", 0, "L", false, 0, "")
		pdf.CellFormat(cols[5], rowH, b.Winner, "1", 0, "C", false, 0, "")
		pdf.CellFormat(cols[6], rowH, b.Decision, "1", 0, "C", false, 0, "")
		pdf.Ln(-1)
	}

	return pdf.Output(w)
}

// WriteConsistencyPDF writes the judge consistency report PDF.
func WriteConsistencyPDF(w io.Writer, cr *ConsistencyReport) error {
	pdf := newPDF()
	pdf.AddPage()
	header(pdf, "Judge Consistency Report", cr.CardName, "")

	setFont(pdf, "B", smallFont)
	pdf.SetFillColor(220, 220, 220)
	cols := []float64{70, 35, 35, 40}
	hdrs := []string{"Judge", "Bouts Scored", "Points", "Rating (%)"}
	for i, h := range hdrs {
		pdf.CellFormat(cols[i], rowH, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	setFont(pdf, "", smallFont)
	for _, row := range cr.Rows {
		pdf.CellFormat(cols[0], rowH, row.JudgeName, "1", 0, "L", false, 0, "")
		pdf.CellFormat(cols[1], rowH, fmt.Sprintf("%d", row.BoutsScored), "1", 0, "C", false, 0, "")
		pdf.CellFormat(cols[2], rowH, fmt.Sprintf("%.1f", row.Points), "1", 0, "C", false, 0, "")
		pdf.CellFormat(cols[3], rowH, fmt.Sprintf("%.1f%%", row.Rating), "1", 0, "C", false, 0, "")
		pdf.Ln(-1)
	}

	return pdf.Output(w)
}

// helpers

func uniqueRoles(scores []BoutScore) []string {
	seen := map[string]bool{}
	var roles []string
	for _, s := range scores {
		if !seen[s.JudgeRole] {
			seen[s.JudgeRole] = true
			roles = append(roles, s.JudgeRole)
		}
	}
	sort.Strings(roles)
	return roles
}

func resolveNames(scores []BoutScore, roles []string) map[string]string {
	names := map[string]string{}
	for _, role := range roles {
		names[role] = role
	}
	for _, s := range scores {
		if s.JudgeName != "" {
			names[s.JudgeRole] = s.JudgeName
		}
	}
	return names
}

func uniqueRounds(scores []BoutScore) []int {
	seen := map[int]bool{}
	for _, s := range scores {
		seen[s.Round] = true
	}
	var rounds []int
	for r := range seen {
		rounds = append(rounds, r)
	}
	sort.Ints(rounds)
	return rounds
}
