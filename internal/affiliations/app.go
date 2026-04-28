package affiliations

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gorilla/mux"

	"github.com/ubaniak/scoreboard/internal/affiliations/entities"
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
	sr := rb.AddSubroute("affiliations")
	sr.AddRoute("affiliations.list", "", http.MethodGet, a.List, rbac.Admin)
	sr.AddRoute("affiliations.create", "", http.MethodPost, a.Create, rbac.Admin)
	sr.AddRoute("affiliations.import", "/import", http.MethodPost, a.ImportCSV, rbac.Admin)
	sr.AddRoute("affiliations.update", "/{id}", http.MethodPut, a.Update, rbac.Admin)
	sr.AddRoute("affiliations.delete", "/{id}", http.MethodDelete, a.Delete, rbac.Admin)
	sr.AddRoute("affiliations.image", "/{id}/image", http.MethodPost, a.UploadImage, rbac.Admin)
	sr.AddRoute("affiliations.image.delete", "/{id}/image", http.MethodDelete, a.RemoveImage, rbac.Admin)
}

type AffiliationResponse struct {
	ID       uint   `json:"id"`
	Name     string `json:"name"`
	Type     string `json:"type"`
	ImageUrl string `json:"imageUrl,omitempty"`
}

func toResponse(a entities.Affiliation) AffiliationResponse {
	return AffiliationResponse{ID: a.ID, Name: a.Name, Type: string(a.Type), ImageUrl: a.ImageUrl}
}

type CreateAffiliationRequest struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type UpdateAffiliationRequest struct {
	Name *string `json:"name"`
	Type *string `json:"type"`
}

func (a *App) List(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]AffiliationResponse](r, w)
	affType := r.URL.Query().Get("type")
	var affiliations []entities.Affiliation
	var err error
	if affType != "" {
		affiliations, err = a.useCase.ListByType(entities.AffiliationType(affType))
	} else {
		affiliations, err = a.useCase.List()
	}
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	resp := make([]AffiliationResponse, len(affiliations))
	for i, aff := range affiliations {
		resp[i] = toResponse(aff)
	}
	presenter.WithData(resp).Present()
}

func (a *App) Create(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	var req CreateAffiliationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		presenter.WithError(err).Present()
		return
	}
	err := a.useCase.Create(req.Name, entities.AffiliationType(req.Type))
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
	var req UpdateAffiliationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		presenter.WithError(err).Present()
		return
	}

	toUpdate := &entities.UpdateAffiliation{Name: req.Name}
	if req.Type != nil {
		t := entities.AffiliationType(*req.Type)
		toUpdate.Type = &t
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
	dir := filepath.Join(uploadsDir, "affiliations")
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

	url := fmt.Sprintf("/uploads/affiliations/%d%s", id, ext)
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
// Required columns: name, type. Optional: none
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
	if _, ok := colIndex["type"]; !ok {
		presenter.WithError(errors.New("CSV missing required column: type")).Present()
		return
	}

	for _, row := range records[1:] {
		name := row[colIndex["name"]]
		affType := row[colIndex["type"]]
		if err := a.useCase.Create(name, entities.AffiliationType(affType)); err != nil {
			presenter.WithError(err).Present()
			return
		}
	}
	presenter.WithStatusCode(http.StatusCreated).Present()
}
