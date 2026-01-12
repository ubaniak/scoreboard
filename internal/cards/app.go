package cards

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"github.com/ubaniak/scoreboard/internal/bouts"
	"github.com/ubaniak/scoreboard/internal/cards/entities"
	"github.com/ubaniak/scoreboard/internal/officials"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

type App struct {
	useCase     UseCase
	officialApp *officials.App
	boutsApp    *bouts.App
}

func NewApp(useCase UseCase, officialApp *officials.App, boutsApp *bouts.App) *App {
	return &App{
		useCase:     useCase,
		officialApp: officialApp,
		boutsApp:    boutsApp,
	}
}

func (h *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	sr := rb.AddSubroute("cards")
	sr.AddRoute("list.cards", "/test", "GET", h.Test)
	sr.AddRoute("list.cards", "", "GET", h.List, rbac.Admin)
	sr.AddRoute("create.cards", "", "POST", h.Create, rbac.Admin)
	sr.AddRoute("update.cards", "/{id}", "PUT", h.Update, rbac.Admin)
	sr.AddRoute("delete.cards", "/{id}", "DELETE", h.Delete, rbac.Admin)
	sr.AddRoute("get.card", "/{id}", "GET", h.Get, rbac.Admin)

	h.officialApp.RegisterRoutes(sr)
	h.boutsApp.RegisterRoutes(sr)
}

type CreateCardRequest struct {
	Name string `json:"name"`
	Date string `json:"date"`
}

func (h *App) Test(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[string](r, w)
	presenter.WithData("hello").Present()
}

func (h *App) Create(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)

	var req CreateCardRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	err = h.useCase.Create(req.Name, req.Date)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

type GetCardResponse struct {
	Id             uint   `json:"id"`
	Name           string `json:"name"`
	Date           string `json:"date"`
	Status         string `json:"status"`
	NumberOfJudges int    `json:"numberOfJudges"`
}

func mapCardToResponse(card entities.Card) *GetCardResponse {
	cardResponse := &GetCardResponse{
		Id:             card.ID,
		Name:           card.Name,
		Date:           card.Date,
		Status:         string(card.Status),
		NumberOfJudges: card.NumberOfJudges,
	}

	return cardResponse
}

func (h *App) List(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]*GetCardResponse](r, w)
	cards, err := h.useCase.List()

	var response []*GetCardResponse
	for _, c := range cards {
		response = append(response, mapCardToResponse(c))
	}

	presenter.WithError(err).WithData(response).Present()
}

func (h *App) Get(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[*GetCardResponse](r, w)
	vars := mux.Vars(r)
	idStr := vars["id"]

	parsed, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	id := uint(parsed)

	card, err := h.useCase.Get(id)
	if err != nil {
		//TODO: Handle not found
		presenter.WithError(err).Present()
		return
	}

	response := mapCardToResponse(*card)

	presenter.WithError(err).WithData(response).Present()
}

func (h *App) Update(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	idStr := vars["id"]

	parsed, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	id := uint(parsed)

	var req UpdateCardRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	toUpdate := UpdateCardRequestToEntity(req)

	err = h.useCase.Update(id, toUpdate)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

func (h *App) Delete(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	idStr := vars["id"]

	parsed, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	id := uint(parsed)

	err = h.useCase.Delete(id)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}
