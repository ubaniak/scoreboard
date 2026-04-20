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
	ID               uint   `json:"id"`
	Name             string `json:"name"`
	DateOfBirth      string `json:"dateOfBirth,omitempty"`
	Nationality      string `json:"nationality,omitempty"`
	ClubID           *uint  `json:"clubId,omitempty"`
	ClubName         string `json:"clubName,omitempty"`
	ProvinceName     string `json:"provinceName,omitempty"`
	ProvinceImageUrl string `json:"provinceImageUrl,omitempty"`
	NationName       string `json:"nationName,omitempty"`
	NationImageUrl   string `json:"nationImageUrl,omitempty"`
	ImageUrl         string `json:"imageUrl,omitempty"`
}

func toResponse(a entities.Athlete) AthleteResponse {
	return AthleteResponse{
		ID:               a.ID,
		Name:             a.Name,
		DateOfBirth:      a.DateOfBirth,
		Nationality:      a.Nationality,
		ClubID:           a.ClubID,
		ClubName:         a.ClubName,
		ProvinceName:     a.ProvinceName,
		ProvinceImageUrl: a.ProvinceImageUrl,
		NationName:       a.NationName,
		NationImageUrl:   a.NationImageUrl,
		ImageUrl:         a.ImageUrl,
	}
}

type CreateAthleteRequest struct {
	Name             string `json:"name"`
	DateOfBirth      string `json:"dateOfBirth"`
	Nationality      string `json:"nationality"`
	ClubID           *uint  `json:"clubId"`
	ProvinceName     string `json:"provinceName,omitempty"`
	ProvinceImageUrl string `json:"provinceImageUrl,omitempty"`
	NationName       string `json:"nationName,omitempty"`
	NationImageUrl   string `json:"nationImageUrl,omitempty"`
}

type UpdateAthleteRequest struct {
	Name             *string `json:"name"`
	DateOfBirth      *string `json:"dateOfBirth"`
	Nationality      *string `json:"nationality"`
	ClubID           *uint   `json:"clubId"`
	ClearClub        bool    `json:"clearClub"`
	ProvinceName     *string `json:"provinceName"`
	ProvinceImageUrl *string `json:"provinceImageUrl"`
	NationName       *string `json:"nationName"`
	NationImageUrl   *string `json:"nationImageUrl"`
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
	err := a.useCase.Create(req.Name, req.DateOfBirth, req.Nationality, req.ClubID, req.ProvinceName, req.ProvinceImageUrl, req.NationName, req.NationImageUrl)
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
		Name:             req.Name,
		DateOfBirth:      req.DateOfBirth,
		Nationality:      req.Nationality,
		ProvinceName:     req.ProvinceName,
		ProvinceImageUrl: req.ProvinceImageUrl,
		NationName:       req.NationName,
		NationImageUrl:   req.NationImageUrl,
	}
	if req.ClearClub {
		toUpdate.ClubID = new(*uint) // &nil — clears the club
	} else if req.ClubID != nil {
		toUpdate.ClubID = &req.ClubID
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
// Required columns: name. Optional: dateOfBirth, nationality, clubId, provinceName, provinceImageUrl, nationName, nationImageUrl
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
		dob := ""
		if i, ok := colIndex["dateOfBirth"]; ok && i < len(row) {
			dob = row[i]
		}
		nationality := ""
		if i, ok := colIndex["nationality"]; ok && i < len(row) {
			nationality = row[i]
		}
		provinceName := ""
		if i, ok := colIndex["provinceName"]; ok && i < len(row) {
			provinceName = row[i]
		}
		provinceImageUrl := ""
		if i, ok := colIndex["provinceImageUrl"]; ok && i < len(row) {
			provinceImageUrl = row[i]
		}
		nationName := ""
		if i, ok := colIndex["nationName"]; ok && i < len(row) {
			nationName = row[i]
		}
		nationImageUrl := ""
		if i, ok := colIndex["nationImageUrl"]; ok && i < len(row) {
			nationImageUrl = row[i]
		}
		var clubID *uint
		if i, ok := colIndex["clubId"]; ok && i < len(row) && row[i] != "" {
			if v, err := strconv.ParseUint(row[i], 10, 64); err == nil {
				id := uint(v)
				clubID = &id
			}
		}
		if err := a.useCase.Create(name, dob, nationality, clubID, provinceName, provinceImageUrl, nationName, nationImageUrl); err != nil {
			presenter.WithError(err).Present()
			return
		}
	}
	presenter.WithStatusCode(http.StatusCreated).Present()
}
