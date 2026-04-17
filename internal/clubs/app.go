package clubs

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

	"github.com/ubaniak/scoreboard/internal/clubs/entities"
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
	sr := rb.AddSubroute("clubs")
	sr.AddRoute("clubs.list", "", http.MethodGet, a.List, rbac.Admin)
	sr.AddRoute("clubs.create", "", http.MethodPost, a.Create, rbac.Admin)
	sr.AddRoute("clubs.import", "/import", http.MethodPost, a.ImportCSV, rbac.Admin)
	sr.AddRoute("clubs.update", "/{id}", http.MethodPut, a.Update, rbac.Admin)
	sr.AddRoute("clubs.delete", "/{id}", http.MethodDelete, a.Delete, rbac.Admin)
	sr.AddRoute("clubs.image", "/{id}/image", http.MethodPost, a.UploadImage, rbac.Admin)
	sr.AddRoute("clubs.image.delete", "/{id}/image", http.MethodDelete, a.RemoveImage, rbac.Admin)
}

type ClubResponse struct {
	ID       uint   `json:"id"`
	Name     string `json:"name"`
	Location string `json:"location,omitempty"`
	ImageUrl string `json:"imageUrl,omitempty"`
}

func toResponse(c entities.Club) ClubResponse {
	return ClubResponse{ID: c.ID, Name: c.Name, Location: c.Location, ImageUrl: c.ImageUrl}
}

type CreateClubRequest struct {
	Name     string `json:"name"`
	Location string `json:"location"`
}

type UpdateClubRequest struct {
	Name     *string `json:"name"`
	Location *string `json:"location"`
}

func (a *App) List(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]ClubResponse](r, w)
	clubs, err := a.useCase.List()
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	resp := make([]ClubResponse, len(clubs))
	for i, c := range clubs {
		resp[i] = toResponse(c)
	}
	presenter.WithData(resp).Present()
}

func (a *App) Create(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	var req CreateClubRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		presenter.WithError(err).Present()
		return
	}
	err := a.useCase.Create(req.Name, req.Location)
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
	var req UpdateClubRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		presenter.WithError(err).Present()
		return
	}
	err = a.useCase.Update(id, &entities.UpdateClub{Name: req.Name, Location: req.Location})
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
	dir := "./uploads/clubs"
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

	url := fmt.Sprintf("/uploads/clubs/%d%s", id, ext)
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
// Required columns: name. Optional: location
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
		location := ""
		if i, ok := colIndex["location"]; ok && i < len(row) {
			location = row[i]
		}
		if err := a.useCase.Create(name, location); err != nil {
			presenter.WithError(err).Present()
			return
		}
	}
	presenter.WithStatusCode(http.StatusCreated).Present()
}
