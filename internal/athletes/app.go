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
	"strings"

	"github.com/gorilla/mux"

	"github.com/ubaniak/scoreboard/internal/athletes/entities"
	"github.com/ubaniak/scoreboard/internal/datadir"
	muxutils "github.com/ubaniak/scoreboard/internal/muxUtils"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

// AffiliationResolver looks up or creates an affiliation by name.
type AffiliationResolver interface {
	FindOrCreateClub(name string) (uint, error)
	FindOrCreateProvince(name string) (uint, error)
	FindOrCreateNation(name string) (uint, error)
}

type App struct {
	useCase      UseCase
	affiliations AffiliationResolver
}

func NewApp(useCase UseCase) *App {
	return &App{useCase: useCase}
}

func (a *App) WithAffiliationResolver(r AffiliationResolver) *App {
	a.affiliations = r
	return a
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
	ID                    uint   `json:"id"`
	Name                  string `json:"name"`
	AgeCategory           string `json:"ageCategory,omitempty"`
	Gender                string `json:"gender,omitempty"`
	Experience            string `json:"experience,omitempty"`
	ClubAffiliationID     *uint  `json:"clubAffiliationId,omitempty"`
	ClubName              string `json:"clubName,omitempty"`
	ClubImageUrl          string `json:"clubImageUrl,omitempty"`
	ProvinceAffiliationID *uint  `json:"provinceAffiliationId,omitempty"`
	ProvinceName          string `json:"provinceName,omitempty"`
	ProvinceImageUrl      string `json:"provinceImageUrl,omitempty"`
	NationAffiliationID   *uint  `json:"nationAffiliationId,omitempty"`
	NationName            string `json:"nationName,omitempty"`
	NationImageUrl        string `json:"nationImageUrl,omitempty"`
	ImageUrl              string `json:"imageUrl,omitempty"`
}

func toResponse(a entities.Athlete) AthleteResponse {
	return AthleteResponse{
		ID:                    a.ID,
		Name:                  a.Name,
		AgeCategory:           a.AgeCategory,
		Gender:                a.Gender,
		Experience:            a.Experience,
		ClubAffiliationID:     a.ClubAffiliationID,
		ClubName:              a.ClubName,
		ClubImageUrl:          a.ClubImageUrl,
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
	Gender                string `json:"gender"`
	Experience            string `json:"experience"`
	ClubAffiliationID     *uint  `json:"clubAffiliationId"`
	ProvinceAffiliationID *uint  `json:"provinceAffiliationId"`
	NationAffiliationID   *uint  `json:"nationAffiliationId"`
}

type UpdateAthleteRequest struct {
	Name                  *string `json:"name"`
	AgeCategory           *string `json:"ageCategory"`
	Gender                *string `json:"gender"`
	Experience            *string `json:"experience"`
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
	err := a.useCase.Create(req.Name, req.AgeCategory, req.Gender, req.Experience, req.ClubAffiliationID, req.ProvinceAffiliationID, req.NationAffiliationID)
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
		Gender:      req.Gender,
		Experience:  req.Experience,
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

// ImportCSV accepts a multipart form with a "file" CSV field.
// Header (case-insensitive, spaces/underscores ignored):
//   Name, Gender, Age Category, Experience, Club, Province, Nationality
// Club, Province, Nationality are names — affiliations are created if missing.
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

	hdr := make(map[string]int, len(records[0]))
	for i, col := range records[0] {
		key := strings.ToLower(strings.TrimSpace(col))
		key = strings.ReplaceAll(key, " ", "")
		key = strings.ReplaceAll(key, "_", "")
		hdr[key] = i
	}
	col := func(row []string, key string) string {
		if i, ok := hdr[key]; ok && i < len(row) {
			return strings.TrimSpace(row[i])
		}
		return ""
	}
	if _, ok := hdr["name"]; !ok {
		presenter.WithError(errors.New("CSV missing required column: Name")).Present()
		return
	}

	for rowIdx, row := range records[1:] {
		name := col(row, "name")
		if name == "" {
			presenter.WithError(fmt.Errorf("row %d: missing Name", rowIdx+2)).Present()
			return
		}
		gender := strings.ToLower(col(row, "gender"))
		ageCategory := strings.ToLower(col(row, "agecategory"))
		experience := strings.ToLower(col(row, "experience"))

		var clubID, provinceID, nationID *uint
		if a.affiliations != nil {
			if v := col(row, "club"); v != "" {
				id, err := a.affiliations.FindOrCreateClub(v)
				if err != nil {
					presenter.WithError(fmt.Errorf("row %d club %q: %w", rowIdx+2, v, err)).Present()
					return
				}
				clubID = &id
			}
			if v := col(row, "province"); v != "" {
				id, err := a.affiliations.FindOrCreateProvince(v)
				if err != nil {
					presenter.WithError(fmt.Errorf("row %d province %q: %w", rowIdx+2, v, err)).Present()
					return
				}
				provinceID = &id
			}
			if v := col(row, "nationality"); v != "" {
				id, err := a.affiliations.FindOrCreateNation(v)
				if err != nil {
					presenter.WithError(fmt.Errorf("row %d nationality %q: %w", rowIdx+2, v, err)).Present()
					return
				}
				nationID = &id
			}
		}

		if err := a.useCase.Create(name, ageCategory, gender, experience, clubID, provinceID, nationID); err != nil {
			presenter.WithError(err).Present()
			return
		}
	}
	presenter.WithStatusCode(http.StatusCreated).Present()
}
