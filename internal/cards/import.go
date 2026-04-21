package cards

import (
	"bufio"
	"encoding/csv"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	boutEntities "github.com/ubaniak/scoreboard/internal/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/presenters"
)

// Narrow interfaces for card import orchestration.

type ImportOfficialCreator interface {
	FindOrCreate(name, nationality string, yearOfBirth int, registrationNumber string) error
}

type ImportClubCreator interface {
	FindOrCreateByName(name string) (uint, error)
}

type ImportAthleteCreator interface {
	FindOrCreateByNameAndClub(name string, clubID *uint) (uint, error)
}

type ImportBoutCreator interface {
	CreateBulk(cardId uint, bouts []*boutEntities.Bout) error
	GetNumberOfJudges(cardId uint) (int, error)
}

// ImportCSV handles POST /cards/import
// The CSV has three sections separated by blank lines:
//
//	Name: <card name>
//	Date: <YYYY-MM-DD>
//
//	Officials:
//	Name,Nationality,Year of Birth,Registration Number
//
//	Bouts:
//	Bout Number,Bout Type,Red Athlete,Red Club,Blue Athlete,Blue Club,Age Category,Experience,Gender,Round Length,Glove Size
func (h *App) ImportCSV(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		presenter.WithError(errors.New("failed to parse multipart form")).Present()
		return
	}
	file, _, err := r.FormFile("file")
	if err != nil {
		presenter.WithError(errors.New("missing 'file' field")).Present()
		return
	}
	defer file.Close()

	// Read all lines for section-based parsing.
	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		presenter.WithError(fmt.Errorf("reading file: %w", err)).Present()
		return
	}

	// ── Parse card details ───────────────────────────────────────────────────
	cardName, cardDate := "", ""
	for _, line := range lines {
		if after, ok := strings.CutPrefix(line, "Name:"); ok {
			cardName = strings.TrimSpace(after)
		}
		if after, ok := strings.CutPrefix(line, "Date:"); ok {
			cardDate = strings.TrimSpace(after)
		}
	}
	if cardName == "" {
		presenter.WithError(errors.New("CSV missing Name: field")).Present()
		return
	}

	cardId, err := h.useCase.FindOrCreateByName(cardName, cardDate)
	if err != nil {
		presenter.WithError(fmt.Errorf("card: %w", err)).Present()
		return
	}

	// ── Split into sections ──────────────────────────────────────────────────
	officialLines, boutLines := splitSections(lines)

	// ── Process officials ────────────────────────────────────────────────────
	if h.importOfficials != nil && len(officialLines) > 0 {
		rdr := csv.NewReader(strings.NewReader(strings.Join(officialLines, "\n")))
		rows, err := rdr.ReadAll()
		if err != nil {
			presenter.WithError(fmt.Errorf("officials CSV: %w", err)).Present()
			return
		}
		if len(rows) > 1 {
			hdr := normaliseHeader(rows[0])
			for i, row := range rows[1:] {
				name := colVal(row, hdr, "name")
				if name == "" {
					presenter.WithError(fmt.Errorf("officials row %d: missing name", i+2)).Present()
					return
				}
				nationality := colVal(row, hdr, "nationality")
				regNum := colVal(row, hdr, "registrationnumber")
				yob := 0
				if v := colVal(row, hdr, "yearofbirth"); v != "" {
					yob, _ = strconv.Atoi(v)
				}
				if err := h.importOfficials.FindOrCreate(name, nationality, yob, regNum); err != nil {
					presenter.WithError(fmt.Errorf("official %q: %w", name, err)).Present()
					return
				}
			}
		}
	}

	// ── Process bouts ────────────────────────────────────────────────────────
	if h.importBouts == nil || len(boutLines) == 0 {
		presenter.WithError(nil).WithStatusCode(http.StatusCreated).Present()
		return
	}

	rdr := csv.NewReader(strings.NewReader(strings.Join(boutLines, "\n")))
	rows, err := rdr.ReadAll()
	if err != nil {
		presenter.WithError(fmt.Errorf("bouts CSV: %w", err)).Present()
		return
	}
	if len(rows) < 2 {
		presenter.WithError(nil).WithStatusCode(http.StatusCreated).Present()
		return
	}

	hdr := normaliseHeader(rows[0])

	mapAgeCategory := func(s string) boutEntities.AgeCategory {
		switch strings.ToLower(s) {
		case "u13":
			return boutEntities.JuniorA
		case "u15":
			return boutEntities.JuniorB
		case "u17":
			return boutEntities.JuniorC
		case "u19":
			return boutEntities.Youth
		case "elite":
			return boutEntities.Elite
		case "masters":
			return boutEntities.Masters
		default:
			return boutEntities.AgeCategory(strings.ToLower(s))
		}
	}

	mapRoundLength := func(s string) boutEntities.RoundLength {
		clean := strings.TrimSpace(strings.ToLower(strings.ReplaceAll(s, "min", "")))
		switch clean {
		case "1", "1.0":
			return boutEntities.OneMinute
		case "1.5":
			return boutEntities.OneHalfMinute
		case "2", "2.0":
			return boutEntities.TwoMinutes
		case "3", "3.0":
			return boutEntities.ThreeMinutes
		}
		return 0
	}

	mapGloveSize := func(s string) boutEntities.GloveSize {
		clean := strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(s, " ", ""), "oz", ""))
		switch clean {
		case "10":
			return boutEntities.TenOz
		case "12":
			return boutEntities.TwelveOz
		case "16":
			return boutEntities.SixteenOz
		}
		return boutEntities.GloveSize(strings.ToLower(strings.ReplaceAll(s, " ", "")))
	}

	bouts := make([]*boutEntities.Bout, 0, len(rows)-1)
	for i, row := range rows[1:] {
		rowNum := i + 2
		ageCategory := mapAgeCategory(colVal(row, hdr, "agecategory"))
		experience := boutEntities.Experience(strings.ToLower(colVal(row, hdr, "experience")))
		gender := boutEntities.Gender(strings.ToLower(colVal(row, hdr, "gender")))

		if !ageCategory.IsValid() {
			presenter.WithError(fmt.Errorf("bouts row %d: invalid ageCategory %q", rowNum, colVal(row, hdr, "agecategory"))).Present()
			return
		}
		if !experience.IsValid() {
			presenter.WithError(fmt.Errorf("bouts row %d: invalid experience %q", rowNum, colVal(row, hdr, "experience"))).Present()
			return
		}
		if !gender.IsValid() {
			presenter.WithError(fmt.Errorf("bouts row %d: invalid gender %q", rowNum, colVal(row, hdr, "gender"))).Present()
			return
		}

		boutNumber := i + 1
		if v := colVal(row, hdr, "boutnumber"); v != "" {
			if n, _ := strconv.Atoi(v); n > 0 {
				boutNumber = n
			}
		}

		boutType := boutEntities.BoutTypeScored
		if v := colVal(row, hdr, "bouttype"); v != "" {
			if bt := boutEntities.BoutType(strings.ToLower(v)); bt.IsValid() {
				boutType = bt
			}
		}

		roundLength := mapRoundLength(colVal(row, hdr, "roundlength"))
		if roundLength == 0 {
			roundLength = roundLengthDefault(ageCategory, experience)
		}

		gloveSize := mapGloveSize(colVal(row, hdr, "glovesize"))
		if gloveSize == "" {
			gloveSize = boutEntities.TenOz
		}

		bout := &boutEntities.Bout{
			CardID:      cardId,
			BoutNumber:  boutNumber,
			AgeCategory: ageCategory,
			Experience:  experience,
			Gender:      gender,
			RoundLength: roundLength,
			GloveSize:   gloveSize,
			BoutType:    boutType,
			Status:      boutEntities.BoutStatusNotStarted,
		}

		if h.importAthletes != nil && h.importClubs != nil {
			redName := colVal(row, hdr, "redathlete")
			blueName := colVal(row, hdr, "blueathlete")
			redClub := colVal(row, hdr, "redclub")
			blueClub := colVal(row, hdr, "blueclub")

			if redName != "" {
				var clubID *uint
				if redClub != "" {
					id, err := h.importClubs.FindOrCreateByName(redClub)
					if err != nil {
						presenter.WithError(fmt.Errorf("bouts row %d: red club: %w", rowNum, err)).Present()
						return
					}
					clubID = &id
				}
				id, err := h.importAthletes.FindOrCreateByNameAndClub(redName, clubID)
				if err != nil {
					presenter.WithError(fmt.Errorf("bouts row %d: red athlete: %w", rowNum, err)).Present()
					return
				}
				bout.RedAthleteID = &id
			}

			if blueName != "" {
				var clubID *uint
				if blueClub != "" {
					id, err := h.importClubs.FindOrCreateByName(blueClub)
					if err != nil {
						presenter.WithError(fmt.Errorf("bouts row %d: blue club: %w", rowNum, err)).Present()
						return
					}
					clubID = &id
				}
				id, err := h.importAthletes.FindOrCreateByNameAndClub(blueName, clubID)
				if err != nil {
					presenter.WithError(fmt.Errorf("bouts row %d: blue athlete: %w", rowNum, err)).Present()
					return
				}
				bout.BlueAthleteID = &id
			}
		}

		bouts = append(bouts, bout)
	}

	// Apply card-level judge count.
	if numJudges, err := h.importBouts.GetNumberOfJudges(cardId); err == nil {
		for _, b := range bouts {
			if b.BoutType == boutEntities.BoutTypeScored {
				b.NumberOfJudges = numJudges
			}
		}
	}

	if err := h.importBouts.CreateBulk(cardId, bouts); err != nil {
		presenter.WithError(err).Present()
		return
	}
	presenter.WithError(nil).WithStatusCode(http.StatusCreated).Present()
}

// splitSections returns the CSV row lines for the Officials and Bouts sections.
func splitSections(lines []string) (officials, bouts []string) {
	const (
		secNone      = 0
		secOfficials = 1
		secBouts     = 2
	)
	sec := secNone
	for _, line := range lines {
		norm := strings.ToLower(strings.TrimSpace(line))
		if norm == "officials:" {
			sec = secOfficials
			continue
		}
		if norm == "bouts:" {
			sec = secBouts
			continue
		}
		if strings.TrimSpace(line) == "" {
			continue
		}
		switch sec {
		case secOfficials:
			officials = append(officials, line)
		case secBouts:
			bouts = append(bouts, line)
		}
	}
	return
}

// normaliseHeader builds a lowercase-no-spaces column index from a header row.
func normaliseHeader(header []string) map[string]int {
	m := make(map[string]int, len(header))
	for i, h := range header {
		m[strings.ToLower(strings.ReplaceAll(strings.TrimSpace(h), " ", ""))] = i
	}
	return m
}

// colVal returns the trimmed value for a column key (normalised) from a row.
func colVal(row []string, hdr map[string]int, key string) string {
	if idx, ok := hdr[key]; ok && idx < len(row) {
		return strings.TrimSpace(row[idx])
	}
	return ""
}

// roundLengthDefault mirrors the logic from the bouts package without importing it.
func roundLengthDefault(age boutEntities.AgeCategory, exp boutEntities.Experience) boutEntities.RoundLength {
	if age == boutEntities.JuniorA {
		return boutEntities.OneMinute
	}
	if age == boutEntities.JuniorB || age == boutEntities.Masters {
		return boutEntities.OneHalfMinute
	}
	if exp == boutEntities.Open {
		return boutEntities.ThreeMinutes
	}
	return boutEntities.TwoMinutes
}
