package roster

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"

	muxutils "github.com/ubaniak/scoreboard/internal/muxUtils"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
	"github.com/ubaniak/scoreboard/internal/creation/roster/entities"
)

type App struct {
	useCase UseCase
}

func NewApp(useCase UseCase) *App {
	return &App{useCase: useCase}
}

func (a *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	rb.AddRoute("roster.list", "/{cardId}/roster", "GET", a.List, rbac.Admin)
	rb.AddRoute("roster.add", "/{cardId}/roster", "POST", a.Add, rbac.Admin)
	rb.AddRoute("roster.remove", "/{cardId}/roster/{athleteId}", "DELETE", a.Remove, rbac.Admin)
	rb.AddRoute("roster.available", "/{cardId}/roster/{athleteId}/available", "PATCH", a.SetAvailable, rbac.Admin)
}

type RosterEntryResponse struct {
	AthleteID   uint     `json:"athleteId"`
	Name        string   `json:"name"`
	Gender      string   `json:"gender,omitempty"`
	AgeCategory string   `json:"ageCategory,omitempty"`
	Experience  string   `json:"experience,omitempty"`
	WeightClass *float64 `json:"weightClass,omitempty"`
	Available   bool     `json:"available"`
}

func toResponse(e entities.RosterEntry) RosterEntryResponse {
	return RosterEntryResponse{
		AthleteID:   e.AthleteID,
		Name:        e.AthleteName,
		Gender:      e.Gender,
		AgeCategory: e.AgeCategory,
		Experience:  e.Experience,
		WeightClass: e.WeightClass,
		Available:   e.Available,
	}
}

func (a *App) List(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]RosterEntryResponse](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	entries, err := a.useCase.ListForCard(cardId)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	resp := make([]RosterEntryResponse, len(entries))
	for i, e := range entries {
		resp[i] = toResponse(e)
	}
	presenter.WithData(resp).Present()
}

type AddRosterRequest struct {
	AthleteID uint `json:"athleteId"`
}

func (a *App) Add(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	var req AddRosterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		presenter.WithError(err).Present()
		return
	}
	err = a.useCase.Add(cardId, req.AthleteID)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

func (a *App) Remove(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	athleteId, err := muxutils.ParseVars[uint](vars, "athleteId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	err = a.useCase.Remove(cardId, athleteId)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

type SetAvailableRequest struct {
	Available bool `json:"available"`
}

func (a *App) SetAvailable(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	athleteId, err := muxutils.ParseVars[uint](vars, "athleteId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	var req SetAvailableRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		presenter.WithError(err).Present()
		return
	}
	err = a.useCase.ToggleAvailable(cardId, athleteId, req.Available)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}
