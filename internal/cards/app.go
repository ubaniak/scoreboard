package cards

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"github.com/ubaniak/scoreboard/internal/cards/entities"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

type App struct {
	useCase UseCase
}

func NewApp(useCase UseCase) *App {
	return &App{useCase: useCase}
}

// func (h *App) RegisterRoutes(router *mux.Router) {
// 	router.HandleFunc("/cards", h.CreateCard).Methods("POST")
// 	router.HandleFunc("/cards", h.GetCards).Methods("GET")
// 	router.HandleFunc("/cards/{id}", h.GetById).Methods("GET")

// 	router.HandleFunc("/cards/{id}/settings", h.UpdateSettings).Methods("PUT")

// 	router.HandleFunc("/cards/{id}/officials", h.AddOfficial).Methods("POST")
// 	router.HandleFunc("/cards/{id}/officials", h.UpdateOfficial).Methods("PUT")
// 	router.HandleFunc("/cards/{id}/officials", h.GetOfficials).Methods("GET")
// 	router.HandleFunc("/cards/{id}/officials/{officialId}", h.DeleteOfficial).Methods("DELETE")
// }

func (h *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	rb.AddRoute("create.cards", "/cards", "POST", h.CreateCard, rbac.Admin)
	rb.AddRoute("list.cards", "/cards", "GET", h.GetCards, rbac.Admin)
	rb.AddRoute("get.card", "/cards/{id}", "GET", h.GetCards, rbac.Admin)
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

type AddOfficialRequest struct {
	Name string `json:"name"`
}

func (h *App) AddOfficial(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	idStr := vars["id"]

	parsed, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	cardId := uint(parsed)

	var req AddOfficialRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.AddOfficial(cardId, req.Name)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

type GetOfficialsResponse struct {
	Id   uint   `json:"id"`
	Name string `json:"name"`
}

func (h *App) GetOfficials(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]GetOfficialsResponse](r, w)
	vars := mux.Vars(r)
	idStr := vars["id"]

	parsed, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	cardId := uint(parsed)

	officials, err := h.useCase.GetOfficials(cardId)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var response []GetOfficialsResponse
	for _, o := range officials {
		response = append(response, GetOfficialsResponse{
			Id:   o.ID,
			Name: o.Name,
		})
	}

	presenter.WithError(err).WithData(response).Present()
}

func (h *App) DeleteOfficial(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	idStr := vars["id"]
	officialIdStr := vars["officialId"]

	parsedCardId, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid Card ID", http.StatusBadRequest)
		return
	}
	cardId := uint(parsedCardId)

	parsedOfficialId, err := strconv.ParseUint(officialIdStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid Official ID", http.StatusBadRequest)
		return
	}
	officialId := uint(parsedOfficialId)

	err = h.useCase.DeleteOfficial(cardId, officialId)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

type UpdateOfficialRequest struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func (h *App) UpdateOfficial(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	idStr := vars["id"]

	parsed, err := strconv.ParseUint(idStr, 10, 0)
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

	officialIdParsed, err := strconv.ParseUint(req.ID, 10, 0)
	if err != nil {
		http.Error(w, "Invalid Official ID", http.StatusBadRequest)
		return
	}
	officialId := uint(officialIdParsed)

	err = h.useCase.UpdateOfficial(cardId, officialId, req.Name)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.WithStatusCode(http.StatusOK).Present()
}
