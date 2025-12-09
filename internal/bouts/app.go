package bouts

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
	rb.AddRoute("bouts.create", "/{cardId}/bouts", "POST", a.Create, rbac.Admin)
	rb.AddRoute("bouts.list", "/{cardId}/bouts", "GET", a.Get, rbac.Admin)
	rb.AddRoute("bouts.update", "/{cardId}/bouts", "PUT", a.Update, rbac.Admin)
	rb.AddRoute("bouts.delete", "/{cardId}/bouts/{id}", "DELETE", a.Delete, rbac.Admin)
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

	var createReq CreateRequest
	err = json.NewDecoder(r.Body).Decode(&createReq)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	bout := CreateRequestToEntity(cardId, &createReq)

	err = h.useCase.Create(cardId, bout)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

func (h *App) Get(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]GetResponse](r, w)
	vars := mux.Vars(r)
	idStr := vars["cardId"]

	parsed, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	cardId := uint(parsed)

	bouts, err := h.useCase.Get(cardId)
	if err != nil {
		presenter.WithError(err).Present()
	}

	resp := make([]GetResponse, len(bouts))
	for i, b := range bouts {
		resp[i] = *EntityToGetBoutResponse(b)
	}

	presenter.WithData(resp).Present()
}

func (h *App) Update(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	idStr := vars["cardId"]

	parsed, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	cardId := uint(parsed)

	var req UpdateRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	bout := UpdateRequestToEntity(cardId, &req)

	err = h.useCase.Update(cardId, bout)
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
