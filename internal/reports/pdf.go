package reports

import (
	"fmt"
	"io"
	"sort"
	"strings"

	"github.com/go-pdf/fpdf"
)

const (
	pageW      = 297.0
	marginL    = 16.0
	marginR    = 16.0
	contentW   = pageW - marginL - marginR
	headerH    = 7.0
	rowH       = 6.0
	smallFont  = 8.5
	normalFont = 10.0
	titleFont  = 15.0
)

func newPDF() *fpdf.Fpdf {
	pdf := fpdf.New("L", "mm", "A4", "")
	pdf.SetMargins(marginL, 14, marginR)
	pdf.SetAutoPageBreak(true, 16)
	return pdf
}

func setFont(pdf *fpdf.Fpdf, style string, size float64) {
	pdf.SetFont("Helvetica", style, size)
}

func pageHeader(pdf *fpdf.Fpdf, title, cardName, date string) {
	setFont(pdf, "B", titleFont)
	pdf.CellFormat(0, 10, title, "", 1, "C", false, 0, "")
	setFont(pdf, "", normalFont)
	sub := cardName
	if date != "" {
		sub += "  |  " + date
	}
	pdf.CellFormat(0, 6, sub, "", 1, "C", false, 0, "")
	pdf.Ln(5)
}

func metaRow(pdf *fpdf.Fpdf, label, value string) {
	col := contentW / 2
	setFont(pdf, "", smallFont)
	pdf.SetTextColor(100, 100, 100)
	pdf.CellFormat(col*0.35, rowH, label, "", 0, "L", false, 0, "")
	pdf.SetTextColor(0, 0, 0)
	setFont(pdf, "B", smallFont)
	pdf.CellFormat(col*0.65, rowH, value, "", 1, "L", false, 0, "")
	pdf.SetTextColor(0, 0, 0)
}

func metaRowPair(pdf *fpdf.Fpdf, label1, val1, label2, val2 string) {
	col := contentW / 2
	setFont(pdf, "", smallFont)
	pdf.SetTextColor(100, 100, 100)
	pdf.CellFormat(col*0.35, rowH, label1, "", 0, "L", false, 0, "")
	pdf.SetTextColor(0, 0, 0)
	setFont(pdf, "B", smallFont)
	pdf.CellFormat(col*0.65, rowH, val1, "", 0, "L", false, 0, "")
	pdf.SetTextColor(100, 100, 100)
	setFont(pdf, "", smallFont)
	pdf.CellFormat(col*0.35, rowH, label2, "", 0, "L", false, 0, "")
	pdf.SetTextColor(0, 0, 0)
	setFont(pdf, "B", smallFont)
	pdf.CellFormat(col*0.65, rowH, val2, "", 1, "L", false, 0, "")
	pdf.SetTextColor(0, 0, 0)
}

func sectionLabel(pdf *fpdf.Fpdf, text string) {
	pdf.Ln(3)
	setFont(pdf, "B", smallFont)
	pdf.SetFillColor(230, 230, 230)
	pdf.CellFormat(0, headerH, "  "+text, "1", 1, "L", true, 0, "")
	pdf.SetFillColor(255, 255, 255)
	setFont(pdf, "", smallFont)
}

// WriteFullPDF writes the full report PDF matching the old client-side layout.
func WriteFullPDF(w io.Writer, rd *ReportData) error {
	pdf := newPDF()
	pdf.AddPage()
	pageHeader(pdf, "Full Report", rd.CardName, rd.CardDate)

	for _, b := range rd.Bouts {
		if pdf.GetY() > 170 {
			pdf.AddPage()
		}

		boutTypeLabel := b.BoutType
		if len(boutTypeLabel) > 0 {
			boutTypeLabel = strings.ToUpper(boutTypeLabel[:1]) + boutTypeLabel[1:]
		}

		sectionLabel(pdf, fmt.Sprintf("Bout %d  —  %s", b.BoutNumber, boutTypeLabel))

		// Bout details in two-column meta layout
		metaRowPair(pdf, "Red Corner", b.RedName, "Blue Corner", b.BlueName)
		metaRowPair(pdf, "Age Category", b.AgeCategory, "Gender", b.Gender)
		metaRowPair(pdf, "Experience", b.Experience, "Weight Class", fmt.Sprintf("%dkg", b.WeightClass))
		metaRowPair(pdf, "Glove Size", b.GloveSize, "Round Length", fmt.Sprintf("%.0f min", b.RoundLength))
		if b.Referee != "" {
			metaRow(pdf, "Referee", b.Referee)
		}

		// Result
		pdf.Ln(2)
		sectionLabel(pdf, "Result")
		winnerVal := winnerLabel(b.Winner)
		decVal := decisionLabel(b.Decision)
		metaRowPair(pdf, "Winner", winnerVal, "Decision", decVal)

		// Judge Scores table
		if len(b.Scores) > 0 {
			pdf.Ln(2)
			sectionLabel(pdf, "Judge Scores")

			judgeOrder := uniqueRoles(b.Scores)
			judgeNames := resolveNames(b.Scores, judgeOrder)
			roundNums := uniqueRounds(b.Scores)

			// Column widths: Round col + one pair per judge
			roundColW := 20.0
			judgeColW := (contentW - roundColW) / float64(len(judgeOrder))
			redW := judgeColW * 0.5
			blueW := judgeColW * 0.5

			// Header
			setFont(pdf, "B", smallFont)
			pdf.SetFillColor(220, 220, 220)
			pdf.CellFormat(roundColW, rowH, "Round", "1", 0, "C", true, 0, "")
			for _, role := range judgeOrder {
				name := judgeNames[role]
				pdf.CellFormat(judgeColW, rowH, name, "1", 0, "C", true, 0, "")
			}
			pdf.Ln(-1)

			// Sub-header: Red / Blue per judge
			setFont(pdf, "", smallFont)
			pdf.CellFormat(roundColW, rowH, "", "1", 0, "C", false, 0, "")
			for range judgeOrder {
				pdf.SetTextColor(192, 57, 43)
				pdf.CellFormat(redW, rowH, "Red", "1", 0, "C", false, 0, "")
				pdf.SetTextColor(41, 128, 185)
				pdf.CellFormat(blueW, rowH, "Blue", "1", 0, "C", false, 0, "")
				pdf.SetTextColor(0, 0, 0)
			}
			pdf.Ln(-1)

			// Score rows
			for _, r := range roundNums {
				setFont(pdf, "", smallFont)
				pdf.CellFormat(roundColW, rowH, fmt.Sprintf("Round %d", r), "1", 0, "C", false, 0, "")
				for _, role := range judgeOrder {
					redVal, blueVal := "-", "-"
					for _, s := range b.Scores {
						if s.JudgeRole == role && s.Round == r {
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
				pdf.Ln(-1)
			}

			// Overall winner row
			setFont(pdf, "B", smallFont)
			pdf.CellFormat(roundColW, rowH, "Overall", "1", 0, "C", false, 0, "")
			for _, role := range judgeOrder {
				ow := "-"
				for _, s := range b.Scores {
					if s.JudgeRole == role && s.OverallWinner != "" {
						ow = winnerLabel(s.OverallWinner)
						break
					}
				}
				pdf.CellFormat(judgeColW, rowH, ow, "1", 0, "C", false, 0, "")
			}
			pdf.Ln(-1)
		}

		// Comments
		if len(b.Comments) > 0 {
			pdf.Ln(2)
			sectionLabel(pdf, "Comments")
			setFont(pdf, "", smallFont)
			for _, c := range b.Comments {
				pdf.CellFormat(0, rowH, "• "+c, "", 1, "L", false, 0, "")
			}
		}

		pdf.Ln(5)
	}

	return pdf.Output(w)
}

// WritePublicPDF writes the public results PDF matching the old client-side layout.
func WritePublicPDF(w io.Writer, rd *ReportData) error {
	pdf := newPDF()
	pdf.AddPage()
	pageHeader(pdf, "Public Results", rd.CardName, rd.CardDate)

	setFont(pdf, "B", smallFont)
	pdf.SetFillColor(220, 220, 220)
	cols := []float64{14, 50, 36, 50, 36, 28, 51}
	hdrs := []string{"Bout #", "Red Corner", "Age Cat.", "Blue Corner", "Gender / Exp.", "Winner", "Decision"}
	for i, h := range hdrs {
		pdf.CellFormat(cols[i], rowH, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	setFont(pdf, "", smallFont)
	for _, b := range rd.Bouts {
		pdf.CellFormat(cols[0], rowH, fmt.Sprintf("%d", b.BoutNumber), "1", 0, "C", false, 0, "")
		pdf.SetTextColor(192, 57, 43)
		pdf.CellFormat(cols[1], rowH, b.RedName, "1", 0, "L", false, 0, "")
		pdf.SetTextColor(0, 0, 0)
		pdf.CellFormat(cols[2], rowH, b.AgeCategory, "1", 0, "C", false, 0, "")
		pdf.SetTextColor(41, 128, 185)
		pdf.CellFormat(cols[3], rowH, b.BlueName, "1", 0, "L", false, 0, "")
		pdf.SetTextColor(0, 0, 0)
		pdf.CellFormat(cols[4], rowH, b.Gender+" / "+b.Experience, "1", 0, "C", false, 0, "")

		winner := winnerLabel(b.Winner)
		if b.Winner == "red" {
			pdf.SetTextColor(192, 57, 43)
		} else if b.Winner == "blue" {
			pdf.SetTextColor(41, 128, 185)
		}
		pdf.CellFormat(cols[5], rowH, winner, "1", 0, "C", false, 0, "")
		pdf.SetTextColor(0, 0, 0)
		pdf.CellFormat(cols[6], rowH, decisionLabel(b.Decision), "1", 0, "C", false, 0, "")
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
