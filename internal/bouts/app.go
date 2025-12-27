package bouts

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"github.com/ubaniak/scoreboard/internal/bouts/entities"
	muxutils "github.com/ubaniak/scoreboard/internal/muxUtils"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
	roundEntities "github.com/ubaniak/scoreboard/internal/round/entities"
)

type App struct {
	useCase UseCase
}

func NewApp(useCase UseCase) *App {
	return &App{useCase: useCase}
}

func (a *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	// TODO: move to own package
	rb.AddRoute("fouls", "/{cardId}/fouls", "GET", a.ListFouls, rbac.Admin)

	rb.AddRoute("bouts.create", "/{cardId}/bouts", "POST", a.Create, rbac.Admin)
	rb.AddRoute("bouts.list", "/{cardId}/bouts", "GET", a.List, rbac.Admin)
	rb.AddRoute("bouts.get", "/{cardId}/bouts/{id}", "GET", a.Get, rbac.Admin)
	rb.AddRoute("bouts.update", "/{cardId}/bouts/{id}", "PUT", a.Update, rbac.Admin)
	rb.AddRoute("bouts.delete", "/{cardId}/bouts/{id}", "DELETE", a.Delete, rbac.Admin)

	rb.AddRoute("bouts.start", "/{cardId}/bouts/{id}/status", "POST", a.UpdateStatus, rbac.Admin)

	rb.AddRoute("rounds.list", "/{cardId}/bouts/{id}/rounds", "GET", a.ListRounds, rbac.Admin)
	rb.AddRoute("rounds.get", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}", "GET", a.GetRound, rbac.Admin)
	rb.AddRoute("rounds.fouls", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/foul", "POST", a.AddFoul, rbac.Admin)
	rb.AddRoute("rounds.eightcounts", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/eightcount", "POST", a.EightCounts, rbac.Admin)

	rb.AddRoute("rounds.start", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/start", "POST", a.StartRound, rbac.Admin)
	rb.AddRoute("rounds.request_scores", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/score", "POST", a.ScoreRound, rbac.Admin)
	rb.AddRoute("rounds.end", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/end", "POST", a.EndRound, rbac.Admin)
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

func (h *App) List(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]GetBoutResponse](r, w)
	vars := mux.Vars(r)
	idStr := vars["cardId"]

	parsed, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	cardId := uint(parsed)

	bouts, err := h.useCase.List(cardId)
	if err != nil {
		presenter.WithError(err).Present()
	}

	resp := make([]GetBoutResponse, len(bouts))
	for i, b := range bouts {
		resp[i] = *EntityToGetBoutResponse(b)
	}

	presenter.WithData(resp).Present()
}

func (h *App) Get(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[*GetBoutResponse](r, w)
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
	id := uint(parsedId)

	b, err := h.useCase.Get(cardId, id)
	if err != nil {
		presenter.WithError(err).Present()
	}
	resp := EntityToGetBoutResponse(b)

	presenter.WithData(resp).Present()
}

func (h *App) Update(w http.ResponseWriter, r *http.Request) {
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
	id := uint(parsedId)

	var req UpdateRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	bout := UpdateRequestToEntity(cardId, &req)

	err = h.useCase.Update(cardId, id, bout)
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
	id := uint(parsedId)

	err = h.useCase.Delete(cardId, id)
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

type UpdateStatusRequest struct {
	Status string `json:"status"`
}

func (h *App) UpdateStatus(w http.ResponseWriter, r *http.Request) {
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
	id := uint(parsedId)

	var req UpdateStatusRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.UpdateStatus(cardId, id, entities.BoutStatus(req.Status))
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

type ListRoundResponse struct {
	RoundNumber int    `json:"roundNumber"`
	Status      string `json:"status"`
}

func (h *App) ListRounds(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]ListRoundResponse](r, w)
	vars := mux.Vars(r)

	idStr := vars["id"]

	parsedId, err := strconv.ParseUint(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	id := uint(parsedId)

	rounds, err := h.useCase.ListRounds(id)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	resp := make([]ListRoundResponse, len(rounds))
	for i, r := range rounds {
		resp[i] = ListRoundResponse{
			RoundNumber: r.RoundNumber,
			Status:      string(r.Status),
		}
	}

	presenter.WithData(resp).Present()
}

func (h *App) ListFouls(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]string](r, w)

	fouls, err := h.useCase.Fouls()
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.WithData(fouls).Present()
}

type AddFoulRequest struct {
	Corner string `json:"corner"`
	Type   string `json:"type"`
	Foul   string `json:"foul"`
}

func (h *App) AddFoul(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)

	boutId, err := muxutils.ParseVars[uint](vars, "boutId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	roundNumber, err := muxutils.ParseVars[int](vars, "roundNumber")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var req AddFoulRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.AddFoul(&roundEntities.RoundFoul{
		BoutID:      boutId,
		RoundNumber: roundNumber,
		Corner:      roundEntities.Corner(req.Corner),
		Type:        roundEntities.FoulType(req.Type),
		Foul:        req.Foul,
	})

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.Present()
}

type GetRoundResponse struct {
	BoutID      uint                  `json:"boutId"`
	RoundNumber int                   `json:"roundNumber"`
	Status      string                `json:"status"`
	Red         CornerDetailsResponse `json:"red"`
	Blue        CornerDetailsResponse `json:"blue"`
}

type CornerDetailsResponse struct {
	Warnings    []string `json:"warnings"`
	Cautions    []string `json:"cautions"`
	EightCounts int      `json:"eightCounts"`
}

func (h *App) GetRound(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[*GetRoundResponse](r, w)
	vars := mux.Vars(r)

	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	boutId, err := muxutils.ParseVars[uint](vars, "boutId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	roundNumber, err := muxutils.ParseVars[int](vars, "roundNumber")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	roundDetails, err := h.useCase.GetRound(cardId, boutId, roundNumber)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	resp := &GetRoundResponse{
		BoutID:      boutId,
		RoundNumber: roundNumber,
		Status:      string(roundDetails.Status),
		Red: CornerDetailsResponse{
			Warnings:    roundDetails.Red.Warnings,
			Cautions:    roundDetails.Red.Cautions,
			EightCounts: roundDetails.Red.EightCounts,
		},
		Blue: CornerDetailsResponse{
			Warnings:    roundDetails.Blue.Warnings,
			Cautions:    roundDetails.Blue.Cautions,
			EightCounts: roundDetails.Blue.EightCounts,
		},
	}

	presenter.WithData(resp).Present()
}

type EightCountRequest struct {
	Corner    string `json:"corner"`
	Direction string `json:"direction"`
}

func (h *App) EightCounts(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)

	boutId, err := muxutils.ParseVars[uint](vars, "boutId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	roundNumber, err := muxutils.ParseVars[int](vars, "roundNumber")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var req EightCountRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.EightCount(boutId, roundNumber, req.Corner, req.Direction)

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.Present()
}

func (h *App) StartRound(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)

	boutId, err := muxutils.ParseVars[uint](vars, "boutId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	roundNumber, err := muxutils.ParseVars[int](vars, "roundNumber")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.StartRound(boutId, roundNumber)

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.Present()
}

func (h *App) ScoreRound(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)

	boutId, err := muxutils.ParseVars[uint](vars, "boutId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	roundNumber, err := muxutils.ParseVars[int](vars, "roundNumber")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.ScoreRound(boutId, roundNumber)

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.Present()
}

func (h *App) EndRound(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	boutId, err := muxutils.ParseVars[uint](vars, "boutId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	roundNumber, err := muxutils.ParseVars[int](vars, "roundNumber")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.EndRound(cardId, boutId, roundNumber)

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.Present()
}
