package officials

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"net/http"
	"github.com/gorilla/mux"

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
	rb.AddRoute("official.create", "/{cardId}/officials", "POST", a.Create, rbac.Admin)
	rb.AddRoute("official.import", "/{cardId}/officials/import", "POST", a.ImportCSV, rbac.Admin)
	rb.AddRoute("official.list", "/{cardId}/officials", "GET", a.List, rbac.Admin)
	rb.AddRoute("official.update", "/{cardId}/officials/{id}", "PUT", a.Update, rbac.Admin)
	rb.AddRoute("official.delete", "/{cardId}/officials/{id}", "DELETE", a.Delete, rbac.Admin)
}

type CreateOfficialRequest struct {
	Name string `json:"name"`
}

func (h *App) Create(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var createReq CreateOfficialRequest
	err = json.NewDecoder(r.Body).Decode(&createReq)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.Create(cardId, createReq.Name)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

type ListOfficialResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

func (h *App) List(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]ListOfficialResponse](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	officials, err := h.useCase.Get(cardId)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	response := make([]ListOfficialResponse, len(officials))
	for i, o := range officials {
		response[i] = ListOfficialResponse{
			ID:   o.ID,
			Name: o.Name,
		}
	}

	presenter.WithData(response).Present()
}

type UpdateOfficialRequest struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

func (h *App) Update(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var req UpdateOfficialRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.Update(cardId, id, req.Name)
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
// Expected CSV columns (with header row): name
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

	header := records[0]
	colIndex := make(map[string]int, len(header))
	for i, col := range header {
		colIndex[col] = i
	}

	if _, ok := colIndex["name"]; !ok {
		presenter.WithError(errors.New("CSV missing required column: name")).Present()
		return
	}

	names := make([]string, 0, len(records)-1)
	for _, row := range records[1:] {
		names = append(names, row[colIndex["name"]])
	}

	err = h.useCase.CreateBulk(cardId, names)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}
