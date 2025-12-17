package officials

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

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
	idStr := vars["cardId"]

	parsed, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	cardId := uint(parsed)

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
	idStr := vars["cardId"]

	parsed, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	cardId := uint(parsed)

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
	CardidStr := vars["cardId"]

	parsed, err := strconv.ParseUint(CardidStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	cardId := uint(parsed)

	var req UpdateOfficialRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	idStr := vars["id"]

	parsedId, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	id := uint(parsedId)

	err = h.useCase.Update(cardId, id, req.Name)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

func (h *App) Delete(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardIdStr := vars["cardId"]

	parsed, err := strconv.ParseUint(cardIdStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	cardId := uint(parsed)

	idStr := vars["id"]

	parsedId, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	Id := uint(parsedId)

	err = h.useCase.Delete(cardId, Id)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}
