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
	sr.AddRoute("create.cards", "", "POST", h.CreateCard, rbac.Admin)
	sr.AddRoute("list.cards", "", "GET", h.GetCards, rbac.Admin)
	sr.AddRoute("get.card", "/{id}", "GET", h.GetCards, rbac.Admin)

	h.officialApp.RegisterRoutes(sr)
	h.boutsApp.RegisterRoutes(sr)
}

type CreateCardRequest struct {
	Name string `json:"name"`
	Date string `json:"date"`
}

func (h *App) CreateCard(w http.ResponseWriter, r *http.Request) {
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

type GetCardsResponse struct {
	Id   uint   `json:"id"`
	Name string `json:"name"`
	Date string `json:"date"`
}

func mapCardToResponse(card entities.Card) *GetCardsResponse {
	cardResponse := &GetCardsResponse{
		Id:   card.ID,
		Name: card.Name,
		Date: card.Date,
	}

	return cardResponse
}

func (h *App) GetCards(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]*GetCardsResponse](r, w)
	cards, err := h.useCase.Get()

	var response []*GetCardsResponse
	for _, c := range cards {
		response = append(response, mapCardToResponse(c))
	}

	presenter.WithError(err).WithData(response).Present()
}

type SettingsResponse struct {
	NumberOfJudges int `json:"numberOfJudges"`
}

type GetCardResponse struct {
	Id       uint             `json:"id"`
	Name     string           `json:"name"`
	Date     string           `json:"date"`
	Settings SettingsResponse `json:"settings"`
}

func (h *App) GetById(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[*GetCardResponse](r, w)
	vars := mux.Vars(r)
	idStr := vars["id"]

	parsed, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	id := uint(parsed)

	card, err := h.useCase.GetById(id)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	response := &GetCardResponse{
		Id:   card.ID,
		Name: card.Name,
		Date: card.Date,
		Settings: SettingsResponse{
			NumberOfJudges: card.Settings.NumberOfJudges,
		},
	}

	presenter.WithError(err).WithData(response).Present()
}

func (h *App) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	idStr := vars["id"]

	parsed, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	id := uint(parsed)

	var req SettingsResponse
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	settings := &entities.Settings{
		NumberOfJudges: req.NumberOfJudges,
	}

	err = h.useCase.UpdateSettings(id, settings)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}
