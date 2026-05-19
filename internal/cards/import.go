package cards

import (
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

// ImportAthleteInfo carries the minimal athlete fields needed to populate bout
// metadata (age category, experience, gender) at import time.
type ImportAthleteInfo struct {
	ID          uint
	AgeCategory string
	Experience  string
	Gender      string
}

// ImportAthleteLookup looks up an athlete by name to derive bout metadata.
type ImportAthleteLookup interface {
	FindFirstByName(name string) (*ImportAthleteInfo, error)
}

type ImportBoutCreator interface {
	CreateBulk(cardId uint, bouts []*boutEntities.Bout) error
	GetNumberOfJudges(cardId uint) (int, error)
}

// ImportCSV handles POST /cards/import.
//
// The CSV is flat — every data row carries the card name + date plus one bout:
//
//	Card Name,Date,Bout Number,Bout Type,Red Athlete,Blue Athlete,Round Length,Glove Size
//
// Athletes must already exist (use the Athletes tab to import them first).
// Age Category, Experience, and Gender are derived from the Red athlete record.
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

	rows, err := csv.NewReader(file).ReadAll()
	if err != nil {
		presenter.WithError(fmt.Errorf("invalid CSV: %w", err)).Present()
		return
	}
	if len(rows) < 2 {
		presenter.WithError(errors.New("CSV must contain a header row and at least one bout")).Present()
		return
	}

	hdr := normaliseHeader(rows[0])
	if _, ok := hdr["redathlete"]; !ok {
		presenter.WithError(errors.New("CSV missing required column: Red Athlete")).Present()
		return
	}

	// Resolve card from the first row with non-empty Card Name.
	cardName, cardDate := "", ""
	for _, row := range rows[1:] {
		if v := colVal(row, hdr, "cardname"); v != "" && cardName == "" {
			cardName = v
		}
		if v := colVal(row, hdr, "date"); v != "" && cardDate == "" {
			cardDate = v
		}
		if cardName != "" && cardDate != "" {
			break
		}
	}
	if cardName == "" {
		presenter.WithError(errors.New("CSV missing card name (add a Card Name column)")).Present()
		return
	}

	cardId, err := h.useCase.FindOrCreateByName(cardName, cardDate)
	if err != nil {
		presenter.WithError(fmt.Errorf("card: %w", err)).Present()
		return
	}

	if h.importBouts == nil || h.importAthletes == nil || h.importAthleteLookup == nil {
		presenter.WithError(errors.New("card import not configured")).Present()
		return
	}

	bouts := make([]*boutEntities.Bout, 0, len(rows)-1)
	for i, row := range rows[1:] {
		rowNum := i + 2

		redName := colVal(row, hdr, "redathlete")
		blueName := colVal(row, hdr, "blueathlete")
		if redName == "" {
			continue
		}

		red, err := h.importAthleteLookup.FindFirstByName(redName)
		if err != nil {
			presenter.WithError(fmt.Errorf("row %d red athlete %q: %w", rowNum, redName, err)).Present()
			return
		}
		if red == nil {
			presenter.WithError(fmt.Errorf("row %d: red athlete %q not found — import athletes first", rowNum, redName)).Present()
			return
		}

		ageCategory := boutEntities.AgeCategory(strings.ToLower(red.AgeCategory))
		experience := boutEntities.Experience(strings.ToLower(red.Experience))
		gender := boutEntities.Gender(strings.ToLower(red.Gender))
		if !ageCategory.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: red athlete %q has invalid ageCategory %q", rowNum, redName, red.AgeCategory)).Present()
			return
		}
		if !experience.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: red athlete %q has invalid experience %q", rowNum, redName, red.Experience)).Present()
			return
		}
		if !gender.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: red athlete %q has invalid gender %q", rowNum, redName, red.Gender)).Present()
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
			CardID:        cardId,
			BoutNumber:    boutNumber,
			AgeCategory:   ageCategory,
			Experience:    experience,
			Gender:        gender,
			RoundLength:   roundLength,
			GloveSize:     gloveSize,
			BoutType:      boutType,
			Status:        boutEntities.BoutStatusNotStarted,
			RedAthleteID:  &red.ID,
		}

		if blueName != "" {
			blue, err := h.importAthleteLookup.FindFirstByName(blueName)
			if err != nil {
				presenter.WithError(fmt.Errorf("row %d blue athlete %q: %w", rowNum, blueName, err)).Present()
				return
			}
			if blue == nil {
				presenter.WithError(fmt.Errorf("row %d: blue athlete %q not found — import athletes first", rowNum, blueName)).Present()
				return
			}
			bout.BlueAthleteID = &blue.ID
		}

		bouts = append(bouts, bout)
	}

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

// normaliseHeader builds a lowercase column index with spaces and underscores
// stripped, so "Age Category", "age_category", and "agecategory" all map to
// the same key "agecategory".
func normaliseHeader(header []string) map[string]int {
	m := make(map[string]int, len(header))
	for i, h := range header {
		key := strings.ToLower(strings.TrimSpace(h))
		key = strings.ReplaceAll(key, " ", "")
		key = strings.ReplaceAll(key, "_", "")
		m[key] = i
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

func mapRoundLength(s string) boutEntities.RoundLength {
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

func mapGloveSize(s string) boutEntities.GloveSize {
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
