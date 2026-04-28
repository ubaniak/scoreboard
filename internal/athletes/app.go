package athletes

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gorilla/mux"

	"github.com/ubaniak/scoreboard/internal/athletes/entities"
	"github.com/ubaniak/scoreboard/internal/datadir"
	muxutils "github.com/ubaniak/scoreboard/internal/muxUtils"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

type App struct {
	useCase UseCase
}

func NewApp(useCase UseCase) *App {
	return &App{useCase: useCase}
}

func (a *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	sr := rb.AddSubroute("athletes")
	sr.AddRoute("athletes.list", "", http.MethodGet, a.List, rbac.Admin)
	sr.AddRoute("athletes.create", "", http.MethodPost, a.Create, rbac.Admin)
	sr.AddRoute("athletes.import", "/import", http.MethodPost, a.ImportCSV, rbac.Admin)
	sr.AddRoute("athletes.update", "/{id}", http.MethodPut, a.Update, rbac.Admin)
	sr.AddRoute("athletes.delete", "/{id}", http.MethodDelete, a.Delete, rbac.Admin)
	sr.AddRoute("athletes.image", "/{id}/image", http.MethodPost, a.UploadImage, rbac.Admin)
	sr.AddRoute("athletes.image.delete", "/{id}/image", http.MethodDelete, a.RemoveImage, rbac.Admin)
}

type AthleteResponse struct {
	ID                   uint   `json:"id"`
	Name                 string `json:"name"`
	AgeCategory          string `json:"ageCategory,omitempty"`
	Nationality          string `json:"nationality,omitempty"`
	ClubAffiliationID    *uint  `json:"clubAffiliationId,omitempty"`
	ClubName             string `json:"clubName,omitempty"`
	ProvinceAffiliationID *uint  `json:"provinceAffiliationId,omitempty"`
	ProvinceName         string `json:"provinceName,omitempty"`
	ProvinceImageUrl     string `json:"provinceImageUrl,omitempty"`
	NationAffiliationID  *uint  `json:"nationAffiliationId,omitempty"`
	NationName           string `json:"nationName,omitempty"`
	NationImageUrl       string `json:"nationImageUrl,omitempty"`
	ImageUrl             string `json:"imageUrl,omitempty"`
}

func toResponse(a entities.Athlete) AthleteResponse {
	return AthleteResponse{
		ID:                    a.ID,
		Name:                  a.Name,
		AgeCategory:           a.AgeCategory,
		Nationality:           a.Nationality,
		ClubAffiliationID:     a.ClubAffiliationID,
		ClubName:              a.ClubName,
		ProvinceAffiliationID: a.ProvinceAffiliationID,
		ProvinceName:          a.ProvinceName,
		ProvinceImageUrl:      a.ProvinceImageUrl,
		NationAffiliationID:   a.NationAffiliationID,
		NationName:            a.NationName,
		NationImageUrl:        a.NationImageUrl,
		ImageUrl:              a.ImageUrl,
	}
}

type CreateAthleteRequest struct {
	Name                  string `json:"name"`
	AgeCategory           string `json:"ageCategory"`
	Nationality           string `json:"nationality"`
	ClubAffiliationID     *uint  `json:"clubAffiliationId"`
	ProvinceAffiliationID *uint  `json:"provinceAffiliationId"`
	NationAffiliationID   *uint  `json:"nationAffiliationId"`
}

type UpdateAthleteRequest struct {
	Name                  *string `json:"name"`
	AgeCategory           *string `json:"ageCategory"`
	Nationality           *string `json:"nationality"`
	ClubAffiliationID     *uint   `json:"clubAffiliationId"`
	ClearClubAffiliation  bool    `json:"clearClubAffiliation"`
	ProvinceAffiliationID *uint   `json:"provinceAffiliationId"`
	NationAffiliationID   *uint   `json:"nationAffiliationId"`
}

func (a *App) List(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]AthleteResponse](r, w)
	athletes, err := a.useCase.List()
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	resp := make([]AthleteResponse, len(athletes))
	for i, at := range athletes {
		resp[i] = toResponse(at)
	}
	presenter.WithData(resp).Present()
}

func (a *App) Create(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	var req CreateAthleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		presenter.WithError(err).Present()
		return
	}
	err := a.useCase.Create(req.Name, req.AgeCategory, req.Nationality, req.ClubAffiliationID, req.ProvinceAffiliationID, req.NationAffiliationID)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

func (a *App) Update(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	var req UpdateAthleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		presenter.WithError(err).Present()
		return
	}

	toUpdate := &entities.UpdateAthlete{
		Name:        req.Name,
		AgeCategory: req.AgeCategory,
		Nationality: req.Nationality,
	}
	if req.ClearClubAffiliation {
		toUpdate.ClubAffiliationID = new(*uint) // &nil — clears the club
	} else if req.ClubAffiliationID != nil {
		toUpdate.ClubAffiliationID = &req.ClubAffiliationID
	}
	if req.ProvinceAffiliationID != nil {
		toUpdate.ProvinceAffiliationID = &req.ProvinceAffiliationID
	}
	if req.NationAffiliationID != nil {
		toUpdate.NationAffiliationID = &req.NationAffiliationID
	}

	err = a.useCase.Update(id, toUpdate)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

func (a *App) Delete(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	err = a.useCase.Delete(id)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

func (a *App) UploadImage(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		presenter.WithError(errors.New("failed to parse form")).Present()
		return
	}
	file, header, err := r.FormFile("image")
	if err != nil {
		presenter.WithError(errors.New("missing 'image' field")).Present()
		return
	}
	defer file.Close()

	ext := filepath.Ext(header.Filename)
	uploadsDir, err := datadir.UploadsDir()
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	dir := filepath.Join(uploadsDir, "athletes")
	if err := os.MkdirAll(dir, 0755); err != nil {
		presenter.WithError(err).Present()
		return
	}
	dst, err := os.Create(fmt.Sprintf("%s/%d%s", dir, id, ext))
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	defer dst.Close()
	if _, err := io.Copy(dst, file); err != nil {
		presenter.WithError(err).Present()
		return
	}

	url := fmt.Sprintf("/uploads/athletes/%d%s", id, ext)
	presenter.WithError(a.useCase.SetImageUrl(id, url)).Present()
}

func (a *App) RemoveImage(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	presenter.WithError(a.useCase.SetImageUrl(id, "")).Present()
}

// ageCategoryFromDOB derives the boxing age category from a YYYY-MM-DD date of birth.
// Rules: U13=11-12, U15=13-14, U17=15-16, U19=17-18, Elite=19-39, Masters=40+
func ageCategoryFromDOB(dob string) string {
	t, err := time.Parse("2006-01-02", dob)
	if err != nil {
		return ""
	}
	now := time.Now()
	age := now.Year() - t.Year()
	if now.Month() < t.Month() || (now.Month() == t.Month() && now.Day() < t.Day()) {
		age--
	}
	switch {
	case age <= 12:
		return "u13"
	case age <= 14:
		return "u15"
	case age <= 16:
		return "u17"
	case age <= 18:
		return "u19"
	case age <= 39:
		return "elite"
	default:
		return "masters"
	}
}

// ImportCSV accepts a multipart form with a "file" CSV field.
// Required columns: name. Optional: dateOfBirth (YYYY-MM-DD), ageCategory, nationality, clubAffiliationId, provinceAffiliationId, nationAffiliationId
func (a *App) ImportCSV(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)

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

	records, err := csv.NewReader(file).ReadAll()
	if err != nil {
		presenter.WithError(errors.New("invalid CSV: " + err.Error())).Present()
		return
	}
	if len(records) < 2 {
		presenter.WithError(errors.New("CSV must contain a header row and at least one data row")).Present()
		return
	}

	colIndex := map[string]int{}
	for i, col := range records[0] {
		colIndex[col] = i
	}
	if _, ok := colIndex["name"]; !ok {
		presenter.WithError(errors.New("CSV missing required column: name")).Present()
		return
	}

	for _, row := range records[1:] {
		name := row[colIndex["name"]]
		ageCategory := ""
		if i, ok := colIndex["dateOfBirth"]; ok && i < len(row) && row[i] != "" {
			ageCategory = ageCategoryFromDOB(row[i])
		}
		if ageCategory == "" {
			if i, ok := colIndex["ageCategory"]; ok && i < len(row) {
				ageCategory = row[i]
			}
		}
		nationality := ""
		if i, ok := colIndex["nationality"]; ok && i < len(row) {
			nationality = row[i]
		}

		var clubAffiliationID *uint
		if i, ok := colIndex["clubAffiliationId"]; ok && i < len(row) && row[i] != "" {
			if v, err := strconv.ParseUint(row[i], 10, 64); err == nil {
				id := uint(v)
				clubAffiliationID = &id
			}
		}
		var provinceAffiliationID *uint
		if i, ok := colIndex["provinceAffiliationId"]; ok && i < len(row) && row[i] != "" {
			if v, err := strconv.ParseUint(row[i], 10, 64); err == nil {
				id := uint(v)
				provinceAffiliationID = &id
			}
		}
		var nationAffiliationID *uint
		if i, ok := colIndex["nationAffiliationId"]; ok && i < len(row) && row[i] != "" {
			if v, err := strconv.ParseUint(row[i], 10, 64); err == nil {
				id := uint(v)
				nationAffiliationID = &id
			}
		}

		if err := a.useCase.Create(name, ageCategory, nationality, clubAffiliationID, provinceAffiliationID, nationAffiliationID); err != nil {
			presenter.WithError(err).Present()
			return
		}
	}
	presenter.WithStatusCode(http.StatusCreated).Present()
}
