package bouts

import (
	"encoding/json"
	"errors"
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
	rb.AddRoute("bouts.end", "/{cardId}/bouts/{id}/end", "POST", a.End, rbac.Admin)

	rb.AddRoute("bouts.status", "/{cardId}/bouts/{id}/status", "POST", a.UpdateStatus, rbac.Admin)

	rb.AddRoute("rounds.list", "/{cardId}/bouts/{id}/rounds", "GET", a.ListRounds, rbac.Admin)
	rb.AddRoute("rounds.get", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}", "GET", a.GetRound, rbac.Admin)
	rb.AddRoute("rounds.fouls", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/foul", "POST", a.HandleFoul, rbac.Admin)
	rb.AddRoute("rounds.eightcounts", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/eightcount", "POST", a.EightCounts, rbac.Admin)

	rb.AddRoute("rounds.next", "/{cardId}/bouts/{boutId}/rounds/next", "POST", a.NextRoundState, rbac.Admin)

	rb.AddRoute("rounds.score", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/score", "POST", a.Score, rbac.JudgeList...)
	rb.AddRoute("rounds.score.complete", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/score/complete", "POST", a.ScoreComplete, rbac.JudgeList...)
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
		resp[i] = *EntityToGetBoutResponse(b, []*roundEntities.RoundDetails{})
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

	b, rounds, err := h.useCase.Get(cardId, id)
	if err != nil {
		presenter.WithError(err).Present()
	}
	resp := EntityToGetBoutResponse(b, rounds)

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

type EndBoutRequest struct {
	Decision string `json:"decision"`
	Winner   string `json:"winner"`
	Comment  string `json:"comment"`
}

func (h *App) End(w http.ResponseWriter, r *http.Request) {
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

	var req EndBoutRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.End(cardId, id, req.Winner, req.Decision, req.Comment)
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

type HandleFoulRequest struct {
	Corner string `json:"corner"`
	Type   string `json:"type"`
	Foul   string `json:"foul"`
	Action string `json:"action"`
}

func (h *App) HandleFoul(w http.ResponseWriter, r *http.Request) {
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

	var req HandleFoulRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	roundFoul := &roundEntities.RoundFoul{
		BoutID:      boutId,
		RoundNumber: roundNumber,
		Corner:      roundEntities.Corner(req.Corner),
		Type:        roundEntities.FoulType(req.Type),
		Foul:        req.Foul,
	}

	if req.Action == "add" {
		err = h.useCase.AddFoul(roundFoul)
	}
	if req.Action == "remove" {
		err = h.useCase.RemoveFoul(roundFoul)
	}

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

func EntityToGetRoundResponse(entity *roundEntities.RoundDetails) *GetRoundResponse {
	return &GetRoundResponse{
		BoutID:      entity.BoutID,
		RoundNumber: entity.RoundNumber,
		Status:      string(entity.Status),
		Red: CornerDetailsResponse{
			Warnings:    entity.Red.Warnings,
			Cautions:    entity.Red.Cautions,
			EightCounts: entity.Red.EightCounts,
		},
		Blue: CornerDetailsResponse{
			Warnings:    entity.Blue.Warnings,
			Cautions:    entity.Blue.Cautions,
			EightCounts: entity.Blue.EightCounts,
		},
	}
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

func (h *App) NextRoundState(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[int](r, w)
	vars := mux.Vars(r)

	boutId, err := muxutils.ParseVars[uint](vars, "boutId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	currentRound, err := h.useCase.NextRoundState(boutId)

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.WithData(currentRound).Present()
}

type ScoreRequest struct {
	Red  int `json:"red"`
	Blue int `json:"blue"`
}

func (h *App) Score(w http.ResponseWriter, r *http.Request) {
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

	role, ok := rbac.GetRoleFromCtx(r.Context())
	if !ok {
		presenter.WithError(errors.New("unknown role")).Present()
		return
	}

	var req ScoreRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.Score(cardId, boutId, roundNumber, role, req.Red, req.Blue)

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.Present()
}

type CompleteScoreRequest struct {
	JudgeNumber int `json:"judgeNumber"`
}

func (h *App) ScoreComplete(w http.ResponseWriter, r *http.Request) {
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

	role, ok := rbac.GetRoleFromCtx(r.Context())
	if !ok {
		presenter.WithError(errors.New("unknown role")).Present()
		return
	}

	var req CompleteScoreRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.CompleteScore(cardId, boutId, roundNumber, role)

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.Present()
}
