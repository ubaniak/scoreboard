package bouts

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"

	"github.com/ubaniak/scoreboard/internal/matchmaking/bouts/entities"
	muxutils "github.com/ubaniak/scoreboard/internal/muxUtils"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
	roundEntities "github.com/ubaniak/scoreboard/internal/running/round/entities"
)

// CardQuerier allows bouts to look up card-level settings without importing the cards package.
type CardQuerier interface {
	GetNumberOfJudges(cardId uint) (int, error)
}

// AthleteNameQuerier resolves an athlete name from their ID.
type AthleteNameQuerier interface {
	GetAthleteName(athleteID uint) string
}

// AthleteFinderCreator looks up or creates an athlete by name and optional club name.
type AthleteFinderCreator interface {
	FindOrCreateByName(name, clubName string) (uint, error)
}

type App struct {
	useCase              UseCase
	cardQuerier          CardQuerier
	athletes             AthleteNameQuerier
	athleteFinderCreator AthleteFinderCreator
}

func NewApp(useCase UseCase, cardQuerier CardQuerier, athletes AthleteNameQuerier) *App {
	return &App{useCase: useCase, cardQuerier: cardQuerier, athletes: athletes}
}

func (a *App) resolveNames(bout *entities.Bout) (red, blue string) {
	if a.athletes != nil {
		if bout.RedAthleteID != nil {
			red = a.athletes.GetAthleteName(*bout.RedAthleteID)
		}
		if bout.BlueAthleteID != nil {
			blue = a.athletes.GetAthleteName(*bout.BlueAthleteID)
		}
	}
	return
}

func (a *App) WithAthleteFinderCreator(q AthleteFinderCreator) {
	a.athleteFinderCreator = q
}

func (a *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	rb.AddRoute("bouts.create", "/{cardId}/bouts", "POST", a.Create, rbac.Admin)
	rb.AddRoute("bouts.import", "/{cardId}/bouts/import", "POST", a.ImportCSV, rbac.Admin)
	rb.AddRoute("bouts.master_import", "/{cardId}/bouts/master-import", "POST", a.MasterImportCSV, rbac.Admin)
	rb.AddRoute("bouts.list", "/{cardId}/bouts", "GET", a.List, rbac.Admin)
	rb.AddRoute("bouts.get", "/{cardId}/bouts/{id}", "GET", a.Get, rbac.Admin)
	rb.AddRoute("bouts.update", "/{cardId}/bouts/{id}", "PUT", a.Update, rbac.Admin)
	rb.AddRoute("bouts.delete", "/{cardId}/bouts/{id}", "DELETE", a.Delete, rbac.Admin)
}

func (h *App) Create(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var createReq CreateRequest
	err = json.NewDecoder(r.Body).Decode(&createReq)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	if err = createReq.Validate(); err != nil {
		presenter.WithError(err).Present()
		return
	}

	bout := CreateRequestToEntity(cardId, &createReq)

	if h.cardQuerier != nil {
		if numJudges, qErr := h.cardQuerier.GetNumberOfJudges(cardId); qErr == nil {
			bout.NumberOfJudges = numJudges
		}
	}

	err = h.useCase.Create(cardId, bout)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

func (h *App) List(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]GetBoutResponse](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	bouts, err := h.useCase.List(cardId)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	resp := make([]GetBoutResponse, len(bouts))
	for i, b := range bouts {
		red, blue := h.resolveNames(b)
		resp[i] = *EntityToGetBoutResponse(b, red, blue, []*roundEntities.RoundDetails{}, []string{})
	}

	presenter.WithData(resp).Present()
}

func (h *App) Get(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[*GetBoutResponse](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	b, rounds, comments, err := h.useCase.Get(cardId, id)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	red, blue := h.resolveNames(b)
	resp := EntityToGetBoutResponse(b, red, blue, rounds, comments)

	presenter.WithData(resp).Present()
}

func (h *App) Update(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var req UpdateRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	if err = req.Validate(); err != nil {
		presenter.WithError(err).Present()
		return
	}

	bout := UpdateRequestToEntity(cardId, &req)

	err = h.useCase.Update(cardId, id, bout)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

func (h *App) Delete(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.Delete(cardId, id)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

// ImportCSV accepts a multipart form upload with a "file" field containing a CSV.
// Expected CSV columns (with header row): red,blue,age,experience
// Bout numbers are assigned sequentially starting from 1.
// Optional columns: weightClass (int), gender (male/female) — defaults to 0 and "male".
func (h *App) ImportCSV(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)

	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		presenter.WithError(errors.New("failed to parse multipart form")).Present()
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		presenter.WithError(errors.New("missing 'file' field in form")).Present()
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		presenter.WithError(errors.New("invalid CSV: " + err.Error())).Present()
		return
	}

	if len(records) < 2 {
		presenter.WithError(errors.New("CSV must contain a header row and at least one data row")).Present()
		return
	}

	// Build column index from header
	header := records[0]
	colIndex := make(map[string]int, len(header))
	for i, col := range header {
		colIndex[col] = i
	}

	for _, required := range []string{"age", "experience"} {
		if _, ok := colIndex[required]; !ok {
			presenter.WithError(errors.New("CSV missing required column: " + required)).Present()
			return
		}
	}

	bouts := make([]*entities.Bout, 0, len(records)-1)
	for i, row := range records[1:] {
		ageCategory := entities.AgeCategory(row[colIndex["age"]])
		experience := entities.Experience(row[colIndex["experience"]])

		gender := entities.Gender(entities.Male)
		if idx, ok := colIndex["gender"]; ok && idx < len(row) {
			gender = entities.Gender(row[idx])
		}

		if !ageCategory.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: invalid ageCategory %q", i+1, ageCategory)).Present()
			return
		}
		if !experience.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: invalid experience %q", i+1, experience)).Present()
			return
		}
		if !gender.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: invalid gender %q", i+1, gender)).Present()
			return
		}

		weightClass := 0
		if idx, ok := colIndex["weightClass"]; ok && idx < len(row) {
			if wc, parseErr := strconv.Atoi(row[idx]); parseErr == nil {
				weightClass = wc
			}
		}

		boutType := entities.BoutTypeScored
		if idx, ok := colIndex["boutType"]; ok && idx < len(row) {
			if bt := entities.BoutType(row[idx]); bt.IsValid() {
				boutType = bt
			}
		}

		roundLength := RoundLength(ageCategory, experience)
		gloveSize := GloveSize(weightClass, ageCategory, gender)

		bouts = append(bouts, &entities.Bout{
			CardID:      cardId,
			BoutNumber:  i + 1,
			AgeCategory: ageCategory,
			Experience:  experience,
			Gender:      gender,
			WeightClass: weightClass,
			RoundLength: roundLength,
			GloveSize:   gloveSize,
			BoutType:    boutType,
			Status:      entities.BoutStatusNotStarted,
		})
	}

	if h.cardQuerier != nil {
		if numJudges, qErr := h.cardQuerier.GetNumberOfJudges(cardId); qErr == nil {
			for _, b := range bouts {
				if b.BoutType == entities.BoutTypeScored {
					b.NumberOfJudges = numJudges
				}
			}
		}
	}

	err = h.useCase.CreateBulk(cardId, bouts)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

// MasterImportCSV accepts a CSV with columns:
// boutNumber,boutType,red,redClub,blue,blueClub,ageCategory,gender,experience,roundLength,gloveSize
// Column headers are matched case-insensitively with spaces stripped.
// Athletes are looked up or created by name+club. Bout numbers come from the CSV.
func (h *App) MasterImportCSV(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)

	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		presenter.WithError(errors.New("failed to parse multipart form")).Present()
		return
	}
	file, _, err := r.FormFile("file")
	if err != nil {
		presenter.WithError(errors.New("missing 'file' field in form")).Present()
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		presenter.WithError(errors.New("invalid CSV: " + err.Error())).Present()
		return
	}
	if len(records) < 2 {
		presenter.WithError(errors.New("CSV must contain a header row and at least one data row")).Present()
		return
	}

	// Build a case-insensitive column index (collapse spaces, underscores, and lowercase).
	normalise := func(s string) string {
		s = strings.ToLower(strings.TrimSpace(s))
		s = strings.ReplaceAll(s, " ", "")
		s = strings.ReplaceAll(s, "_", "")
		return s
	}
	colIndex := make(map[string]int, len(records[0]))
	for i, col := range records[0] {
		colIndex[normalise(col)] = i
	}

	col := func(row []string, key string) string {
		if idx, ok := colIndex[key]; ok && idx < len(row) {
			return strings.TrimSpace(row[idx])
		}
		return ""
	}

	for _, required := range []string{"red", "blue", "agecategory", "gender", "experience"} {
		if _, ok := colIndex[required]; !ok {
			presenter.WithError(fmt.Errorf("CSV missing required column: %q", required)).Present()
			return
		}
	}

	mapAgeCategory := func(s string) entities.AgeCategory {
		switch strings.ToLower(s) {
		case "u13":
			return entities.JuniorA
		case "u15":
			return entities.JuniorB
		case "u17":
			return entities.JuniorC
		case "u19":
			return entities.Youth
		case "elite":
			return entities.Elite
		case "masters":
			return entities.Masters
		default:
			return entities.AgeCategory(strings.ToLower(s))
		}
	}

	mapRoundLength := func(s string) entities.RoundLength {
		clean := strings.ToLower(strings.ReplaceAll(s, "min", ""))
		clean = strings.TrimSpace(clean)
		switch clean {
		case "1", "1.0":
			return entities.OneMinute
		case "1.5":
			return entities.OneHalfMinute
		case "2", "2.0":
			return entities.TwoMinutes
		case "3", "3.0":
			return entities.ThreeMinutes
		}
		return 0
	}

	mapGloveSize := func(s string) entities.GloveSize {
		clean := strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(s, " ", ""), "oz", ""))
		switch clean {
		case "10":
			return entities.TenOz
		case "12":
			return entities.TwelveOz
		case "16":
			return entities.SixteenOz
		}
		return entities.GloveSize(strings.ToLower(strings.ReplaceAll(s, " ", "")))
	}

	bouts := make([]*entities.Bout, 0, len(records)-1)
	for i, row := range records[1:] {
		rowNum := i + 2 // 1-based, accounting for header

		ageCategory := mapAgeCategory(col(row, "agecategory"))
		experience := entities.Experience(strings.ToLower(col(row, "experience")))
		gender := entities.Gender(strings.ToLower(col(row, "gender")))

		if !ageCategory.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: invalid ageCategory %q", rowNum, col(row, "agecategory"))).Present()
			return
		}
		if !experience.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: invalid experience %q", rowNum, col(row, "experience"))).Present()
			return
		}
		if !gender.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: invalid gender %q", rowNum, col(row, "gender"))).Present()
			return
		}

		boutNumber := i + 1
		if v := col(row, "boutnumber"); v != "" {
			if n, parseErr := strconv.Atoi(v); parseErr == nil {
				boutNumber = n
			}
		}

		boutType := entities.BoutTypeScored
		if v := col(row, "bouttype"); v != "" {
			if bt := entities.BoutType(strings.ToLower(v)); bt.IsValid() {
				boutType = bt
			}
		}

		roundLength := mapRoundLength(col(row, "roundlength"))
		if roundLength == 0 {
			roundLength = RoundLength(ageCategory, experience)
		}

		weightClass := 0
		gloveSize := mapGloveSize(col(row, "glovesize"))
		if gloveSize == "" {
			gloveSize = GloveSize(weightClass, ageCategory, gender)
		}

		bout := &entities.Bout{
			CardID:      cardId,
			BoutNumber:  boutNumber,
			AgeCategory: ageCategory,
			Experience:  experience,
			Gender:      gender,
			WeightClass: weightClass,
			RoundLength: roundLength,
			GloveSize:   gloveSize,
			BoutType:    boutType,
			Status:      entities.BoutStatusNotStarted,
		}

		if h.athleteFinderCreator != nil {
			redName := col(row, "red")
			blueName := col(row, "blue")
			if redName != "" {
				id, findErr := h.athleteFinderCreator.FindOrCreateByName(redName, col(row, "redclub"))
				if findErr != nil {
					presenter.WithError(fmt.Errorf("row %d: athlete %q: %w", rowNum, redName, findErr)).Present()
					return
				}
				bout.RedAthleteID = &id
			}
			if blueName != "" {
				id, findErr := h.athleteFinderCreator.FindOrCreateByName(blueName, col(row, "blueclub"))
				if findErr != nil {
					presenter.WithError(fmt.Errorf("row %d: athlete %q: %w", rowNum, blueName, findErr)).Present()
					return
				}
				bout.BlueAthleteID = &id
			}
		}

		bouts = append(bouts, bout)
	}

	if h.cardQuerier != nil {
		if numJudges, qErr := h.cardQuerier.GetNumberOfJudges(cardId); qErr == nil {
			for _, b := range bouts {
				if b.BoutType == entities.BoutTypeScored {
					b.NumberOfJudges = numJudges
				}
			}
		}
	}

	err = h.useCase.CreateBulk(cardId, bouts)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}
