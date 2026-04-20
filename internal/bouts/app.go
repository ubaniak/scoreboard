package bouts

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/gorilla/mux"

	"github.com/ubaniak/scoreboard/internal/auditlogs"
	"github.com/ubaniak/scoreboard/internal/bouts/entities"
	"github.com/ubaniak/scoreboard/internal/events"
	muxutils "github.com/ubaniak/scoreboard/internal/muxUtils"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
	"github.com/ubaniak/scoreboard/internal/round"
	roundEntities "github.com/ubaniak/scoreboard/internal/round/entities"
	"github.com/ubaniak/scoreboard/internal/scores"
	scoreEntities "github.com/ubaniak/scoreboard/internal/scores/entities"
)

// CardQuerier allows bouts to look up card-level settings without importing the cards package.
type CardQuerier interface {
	GetNumberOfJudges(cardId uint) (int, error)
}

// AthleteNameQuerier resolves an athlete name from their ID.
type AthleteNameQuerier interface {
	GetAthleteName(athleteID uint) string
}

// AthleteFinderCreator looks up or creates an athlete by name and optional club name.
type AthleteFinderCreator interface {
	FindOrCreateByName(name, clubName string) (uint, error)
}

type App struct {
	useCase              UseCase
	roundUseCase         round.UseCase
	scoreUseCase         scores.UseCase
	broadcaster          *events.Broadcaster
	cardQuerier          CardQuerier
	athletes             AthleteNameQuerier
	audit                auditlogs.UseCase
	athleteFinderCreator AthleteFinderCreator
}

func NewApp(useCase UseCase, roundUseCase round.UseCase, scoreUseCase scores.UseCase, broadcaster *events.Broadcaster, cardQuerier CardQuerier, athletes AthleteNameQuerier, audit auditlogs.UseCase) *App {
	return &App{useCase: useCase, roundUseCase: roundUseCase, scoreUseCase: scoreUseCase, broadcaster: broadcaster, cardQuerier: cardQuerier, athletes: athletes, audit: audit}
}

func (a *App) resolveNames(bout *entities.Bout) (red, blue string) {
	if a.athletes != nil {
		if bout.RedAthleteID != nil {
			red = a.athletes.GetAthleteName(*bout.RedAthleteID)
		}
		if bout.BlueAthleteID != nil {
			blue = a.athletes.GetAthleteName(*bout.BlueAthleteID)
		}
	}
	return
}

func (a *App) WithAthleteFinderCreator(q AthleteFinderCreator) {
	a.athleteFinderCreator = q
}

func (a *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	rb.AddRoute("fouls", "/{cardId}/fouls", "GET", a.ListFouls, rbac.Admin)

	rb.AddRoute("bouts.create", "/{cardId}/bouts", "POST", a.Create, rbac.Admin)
	rb.AddRoute("bouts.import", "/{cardId}/bouts/import", "POST", a.ImportCSV, rbac.Admin)
	rb.AddRoute("bouts.master_import", "/{cardId}/bouts/master-import", "POST", a.MasterImportCSV, rbac.Admin)
	rb.AddRoute("bouts.list", "/{cardId}/bouts", "GET", a.List, rbac.Admin)
	rb.AddRoute("bouts.get", "/{cardId}/bouts/{id}", "GET", a.Get, rbac.Admin)
	rb.AddRoute("bouts.update", "/{cardId}/bouts/{id}", "PUT", a.Update, rbac.Admin)
	rb.AddRoute("bouts.delete", "/{cardId}/bouts/{id}", "DELETE", a.Delete, rbac.Admin)
	rb.AddRoute("bouts.make_decision", "/{cardId}/bouts/{id}/decision/make", "POST", a.MakeDecision, rbac.Admin)
	rb.AddRoute("bouts.show_decision", "/{cardId}/bouts/{id}/decision/show", "POST", a.ShowDecision, rbac.Admin)
	rb.AddRoute("bouts.complete", "/{cardId}/bouts/{id}/complete", "POST", a.Complete, rbac.Admin)

	rb.AddRoute("bouts.status", "/{cardId}/bouts/{id}/status", "POST", a.UpdateStatus, rbac.Admin)

	rb.AddRoute("rounds.list", "/{cardId}/bouts/{id}/rounds", "GET", a.ListRounds, rbac.Admin)
	rb.AddRoute("rounds.get", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}", "GET", a.GetRound, rbac.Admin)
	rb.AddRoute("rounds.fouls", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/foul", "POST", a.HandleFoul, rbac.Admin)
	rb.AddRoute("rounds.eightcounts", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/eightcount", "POST", a.EightCounts, rbac.Admin)

	rb.AddRoute("rounds.next", "/{cardId}/bouts/{boutId}/rounds/next", "POST", a.NextRoundState, rbac.Admin)

	rb.AddRoute("rounds.score.ready", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/score/ready", "POST", a.ScoreReady, rbac.JudgeList...)
	rb.AddRoute("rounds.score", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/score", "POST", a.Score, rbac.JudgeList...)
	rb.AddRoute("rounds.score.complete", "/{cardId}/bouts/{boutId}/rounds/{roundNumber}/score/complete", "POST", a.ScoreComplete, rbac.JudgeList...)
	rb.AddRoute("bouts.overall_winner", "/{cardId}/bouts/{boutId}/overall-winner", "POST", a.PickOverallWinner, rbac.JudgeList...)

	allowedRoles := append([]string{rbac.Admin}, rbac.JudgeList...)
	rb.AddRoute("scores.list", "/{cardId}/bouts/{boutId}/scores", "GET", a.ListScores, allowedRoles...)
}

func (h *App) Create(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[struct{}](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var createReq CreateRequest
	err = json.NewDecoder(r.Body).Decode(&createReq)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	if err = createReq.Validate(); err != nil {
		presenter.WithError(err).Present()
		return
	}

	bout := CreateRequestToEntity(cardId, &createReq)

	if h.cardQuerier != nil {
		if numJudges, qErr := h.cardQuerier.GetNumberOfJudges(cardId); qErr == nil {
			bout.NumberOfJudges = numJudges
		}
	}

	err = h.useCase.Create(cardId, bout)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

func (h *App) List(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]GetBoutResponse](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	bouts, err := h.useCase.List(cardId)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	resp := make([]GetBoutResponse, len(bouts))
	for i, b := range bouts {
		red, blue := h.resolveNames(b)
		resp[i] = *EntityToGetBoutResponse(b, red, blue, []*roundEntities.RoundDetails{}, []string{})
	}

	presenter.WithData(resp).Present()
}

func (h *App) Get(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[*GetBoutResponse](r, w)
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

	b, rounds, comments, err := h.useCase.Get(cardId, id)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	red, blue := h.resolveNames(b)
	resp := EntityToGetBoutResponse(b, red, blue, rounds, comments)

	presenter.WithData(resp).Present()
}

func (h *App) Update(w http.ResponseWriter, r *http.Request) {
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

	var req UpdateRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	if err = req.Validate(); err != nil {
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

type MakeDecisionRequest struct {
	Decision string `json:"decision"`
	Winner   string `json:"winner"`
	Comment  string `json:"comment"`
}

func (h *App) MakeDecision(w http.ResponseWriter, r *http.Request) {
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

	var req MakeDecisionRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.useCase.MakeDecision(cardId, id, req.Winner, req.Decision, req.Comment)
	if err == nil {
		h.broadcaster.Notify()
	}
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

type UpdateStatusRequest struct {
	Status string `json:"status"`
}

func (h *App) UpdateStatus(w http.ResponseWriter, r *http.Request) {
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

	var req UpdateStatusRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	status := entities.BoutStatus(req.Status)
	if !status.IsValid() {
		presenter.WithError(fmt.Errorf("invalid status %q", req.Status)).Present()
		return
	}

	err = h.useCase.UpdateStatus(cardId, id, status)
	if err == nil {
		h.broadcaster.Notify()
	}
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

type ListRoundResponse struct {
	RoundNumber int    `json:"roundNumber"`
	Status      string `json:"status"`
}

func (h *App) ListRounds(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]ListRoundResponse](r, w)
	vars := mux.Vars(r)
	id, err := muxutils.ParseVars[uint](vars, "id")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	rounds, err := h.roundUseCase.List(id)
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

	fouls, err := h.roundUseCase.ListFouls()
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
		err = h.roundUseCase.AddFoul(roundFoul)
	}
	if req.Action == "remove" {
		err = h.roundUseCase.RemoveFoul(roundFoul)
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

	roundDetails, err := h.roundUseCase.Get(boutId, roundNumber)
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

	err = h.roundUseCase.EightCount(boutId, roundNumber, req.Corner, req.Direction)

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	presenter.Present()
}

func (h *App) NextRoundState(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[int](r, w)
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

	currentRound, err := h.roundUseCase.Next(boutId)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	if h.audit != nil {
		_ = h.audit.Log(r.Context(), auditlogs.LogEntry{
			CardID:       cardId,
			BoutID:       &boutId,
			Action:       "round.advance",
			HumanSummary: "Advance round state",
			Metadata: map[string]any{
				"currentRound": currentRound,
			},
		})
	}

	// Sync bout status based on the round transition
	var boutStatus entities.BoutStatus
	if currentRound <= 0 {
		// All rounds complete
		boutStatus = entities.BoutStatusWaitingForDecision
	} else {
		round, err := h.roundUseCase.Get(boutId, currentRound)
		if err == nil {
			switch round.Status {
			case roundEntities.RoundStatusInProgress:
				boutStatus = entities.BoutStatusInProgress
			case roundEntities.RoundStatusWaitingForResults:
				boutStatus = entities.BoutStatusWaitingForScores
			case roundEntities.RoundStatusScoreComplete:
				boutStatus = entities.BoutStatusScoreComplete
			}
		}
	}
	if boutStatus != "" {
		_ = h.useCase.UpdateStatus(cardId, boutId, boutStatus)
	}

	h.broadcaster.Notify()
	presenter.WithData(currentRound).Present()
}

func (h *App) ShowDecision(w http.ResponseWriter, r *http.Request) {
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

	err = h.useCase.ShowDecision(cardId, id)
	if err == nil {
		h.broadcaster.Notify()
	}
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

func (h *App) Complete(w http.ResponseWriter, r *http.Request) {
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

	err = h.useCase.Complete(cardId, id)
	if err == nil {
		h.broadcaster.Notify()
	}
	presenter.WithError(err).WithStatusCode(http.StatusOK).Present()
}

type ScoreReadyRequest struct {
	Name string `json:"name"`
}

func (h *App) ScoreReady(w http.ResponseWriter, r *http.Request) {
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

	var req ScoreReadyRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		presenter.WithError(err).Present()
		return
	}

	err = h.scoreUseCase.Ready(cardId, boutId, roundNumber, role, req.Name)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	if h.audit != nil {
		name := req.Name
		_ = h.audit.Log(r.Context(), auditlogs.LogEntry{
			CardID:       cardId,
			BoutID:       &boutId,
			RoundNumber:  &roundNumber,
			Action:       "judge.name.set",
			HumanSummary: "Judge set name",
			ActorName:    &name,
			Metadata: map[string]any{
				"judgeRole": role,
			},
		})
	}

	h.broadcaster.Notify()
	presenter.Present()
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

	err = h.scoreUseCase.Score(cardId, boutId, roundNumber, role, req.Red, req.Blue)

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	if h.audit != nil {
		_ = h.audit.Log(r.Context(), auditlogs.LogEntry{
			CardID:       cardId,
			BoutID:       &boutId,
			RoundNumber:  &roundNumber,
			Action:       "judge.score.select",
			HumanSummary: "Judge selected score",
			Metadata: map[string]any{
				"judgeRole": role,
				"red":       req.Red,
				"blue":      req.Blue,
			},
		})
	}

	h.broadcaster.Notify()
	presenter.Present()
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

	err = h.scoreUseCase.Complete(cardId, boutId, roundNumber, role)

	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	if h.audit != nil {
		_ = h.audit.Log(r.Context(), auditlogs.LogEntry{
			CardID:       cardId,
			BoutID:       &boutId,
			RoundNumber:  &roundNumber,
			Action:       "judge.score.submit",
			HumanSummary: "Judge submitted score",
			Metadata: map[string]any{
				"judgeRole": role,
			},
		})
	}

	// Auto-advance round to score_complete when all judges have submitted
	allScores, err := h.scoreUseCase.List(cardId, boutId)
	if err == nil {
		allComplete := true
		roundScoreCount := 0
		for _, s := range allScores {
			if s.RoundNumber != roundNumber {
				continue
			}
			roundScoreCount++
			if s.Status != scoreEntities.ScoreStatusComplete {
				allComplete = false
				break
			}
		}
		if allComplete && roundScoreCount > 0 {
			_ = h.roundUseCase.UpdateStatus(boutId, roundNumber, roundEntities.RoundStatusScoreComplete)
			_ = h.useCase.UpdateStatus(cardId, boutId, entities.BoutStatusScoreComplete)
		}
	}

	h.broadcaster.Notify()
	presenter.Present()
}

type ScoreResponse struct {
	RoundNumber   int     `json:"roundNumber"`
	JudgeRole     string  `json:"judgeRole"`
	JudgeName     *string `json:"judgeName,omitempty"`
	Red           int     `json:"red"`
	Blue          int     `json:"blue"`
	Status        *string `json:"status,omitempty"`
	OverallWinner *string `json:"overallWinner,omitempty"`
}

func scoreToResponse(s *scoreEntities.Score, isAdmin bool) ScoreResponse {
	resp := ScoreResponse{
		RoundNumber: s.RoundNumber,
		JudgeRole:   s.JudgeRole,
		Red:         s.Red,
		Blue:        s.Blue,
	}
	if isAdmin {
		resp.JudgeName = &s.JudgeName
		status := string(s.Status)
		resp.Status = &status
		if s.OverallWinner != "" {
			resp.OverallWinner = &s.OverallWinner
		}
	}
	return resp
}

// ImportCSV accepts a multipart form upload with a "file" field containing a CSV.
// Expected CSV columns (with header row): red,blue,age,experience
// Bout numbers are assigned sequentially starting from 1.
// Optional columns: weightClass (int), gender (male/female) — defaults to 0 and "male".
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

	// Build column index from header
	header := records[0]
	colIndex := make(map[string]int, len(header))
	for i, col := range header {
		colIndex[col] = i
	}

	for _, required := range []string{"age", "experience"} {
		if _, ok := colIndex[required]; !ok {
			presenter.WithError(errors.New("CSV missing required column: " + required)).Present()
			return
		}
	}

	bouts := make([]*entities.Bout, 0, len(records)-1)
	for i, row := range records[1:] {
		ageCategory := entities.AgeCategory(row[colIndex["age"]])
		experience := entities.Experience(row[colIndex["experience"]])

		gender := entities.Gender(entities.Male)
		if idx, ok := colIndex["gender"]; ok && idx < len(row) {
			gender = entities.Gender(row[idx])
		}

		if !ageCategory.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: invalid ageCategory %q", i+1, ageCategory)).Present()
			return
		}
		if !experience.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: invalid experience %q", i+1, experience)).Present()
			return
		}
		if !gender.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: invalid gender %q", i+1, gender)).Present()
			return
		}

		weightClass := 0
		if idx, ok := colIndex["weightClass"]; ok && idx < len(row) {
			if wc, parseErr := strconv.Atoi(row[idx]); parseErr == nil {
				weightClass = wc
			}
		}

		boutType := entities.BoutTypeScored
		if idx, ok := colIndex["boutType"]; ok && idx < len(row) {
			if bt := entities.BoutType(row[idx]); bt.IsValid() {
				boutType = bt
			}
		}

		roundLength := RoundLength(ageCategory, experience)
		gloveSize := GloveSize(weightClass, ageCategory, gender)

		bouts = append(bouts, &entities.Bout{
			CardID:      cardId,
			BoutNumber:  i + 1,
			AgeCategory: ageCategory,
			Experience:  experience,
			Gender:      gender,
			WeightClass: weightClass,
			RoundLength: roundLength,
			GloveSize:   gloveSize,
			BoutType:    boutType,
			Status:      entities.BoutStatusNotStarted,
		})
	}

	if h.cardQuerier != nil {
		if numJudges, qErr := h.cardQuerier.GetNumberOfJudges(cardId); qErr == nil {
			for _, b := range bouts {
				if b.BoutType == entities.BoutTypeScored {
					b.NumberOfJudges = numJudges
				}
			}
		}
	}

	err = h.useCase.CreateBulk(cardId, bouts)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

// MasterImportCSV accepts a CSV with columns:
// boutNumber,boutType,red,redClub,blue,blueClub,ageCategory,gender,experience,roundLength,gloveSize
// Column headers are matched case-insensitively with spaces stripped.
// Athletes are looked up or created by name+club. Bout numbers come from the CSV.
func (h *App) MasterImportCSV(w http.ResponseWriter, r *http.Request) {
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

	// Build a case-insensitive column index (collapse spaces and lowercase).
	normalise := func(s string) string {
		return strings.ToLower(strings.ReplaceAll(strings.TrimSpace(s), " ", ""))
	}
	colIndex := make(map[string]int, len(records[0]))
	for i, col := range records[0] {
		colIndex[normalise(col)] = i
	}

	col := func(row []string, key string) string {
		if idx, ok := colIndex[key]; ok && idx < len(row) {
			return strings.TrimSpace(row[idx])
		}
		return ""
	}

	for _, required := range []string{"red", "blue", "agecategory", "gender", "experience"} {
		if _, ok := colIndex[required]; !ok {
			presenter.WithError(fmt.Errorf("CSV missing required column: %q", required)).Present()
			return
		}
	}

	mapAgeCategory := func(s string) entities.AgeCategory {
		switch strings.ToLower(s) {
		case "u13":
			return entities.JuniorA
		case "u15":
			return entities.JuniorB
		case "u17":
			return entities.JuniorC
		case "u19":
			return entities.Youth
		case "elite":
			return entities.Elite
		case "masters":
			return entities.Masters
		default:
			return entities.AgeCategory(strings.ToLower(s))
		}
	}

	mapRoundLength := func(s string) entities.RoundLength {
		clean := strings.ToLower(strings.ReplaceAll(s, "min", ""))
		clean = strings.TrimSpace(clean)
		switch clean {
		case "1", "1.0":
			return entities.OneMinute
		case "1.5":
			return entities.OneHalfMinute
		case "2", "2.0":
			return entities.TwoMinutes
		case "3", "3.0":
			return entities.ThreeMinutes
		}
		return 0
	}

	mapGloveSize := func(s string) entities.GloveSize {
		clean := strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(s, " ", ""), "oz", ""))
		switch clean {
		case "10":
			return entities.TenOz
		case "12":
			return entities.TwelveOz
		case "16":
			return entities.SixteenOz
		}
		return entities.GloveSize(strings.ToLower(strings.ReplaceAll(s, " ", "")))
	}

	bouts := make([]*entities.Bout, 0, len(records)-1)
	for i, row := range records[1:] {
		rowNum := i + 2 // 1-based, accounting for header

		ageCategory := mapAgeCategory(col(row, "agecategory"))
		experience := entities.Experience(strings.ToLower(col(row, "experience")))
		gender := entities.Gender(strings.ToLower(col(row, "gender")))

		if !ageCategory.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: invalid ageCategory %q", rowNum, col(row, "agecategory"))).Present()
			return
		}
		if !experience.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: invalid experience %q", rowNum, col(row, "experience"))).Present()
			return
		}
		if !gender.IsValid() {
			presenter.WithError(fmt.Errorf("row %d: invalid gender %q", rowNum, col(row, "gender"))).Present()
			return
		}

		boutNumber := i + 1
		if v := col(row, "boutnumber"); v != "" {
			if n, parseErr := strconv.Atoi(v); parseErr == nil {
				boutNumber = n
			}
		}

		boutType := entities.BoutTypeScored
		if v := col(row, "bouttype"); v != "" {
			if bt := entities.BoutType(strings.ToLower(v)); bt.IsValid() {
				boutType = bt
			}
		}

		roundLength := mapRoundLength(col(row, "roundlength"))
		if roundLength == 0 {
			roundLength = RoundLength(ageCategory, experience)
		}

		weightClass := 0
		gloveSize := mapGloveSize(col(row, "glovesize"))
		if gloveSize == "" {
			gloveSize = GloveSize(weightClass, ageCategory, gender)
		}

		bout := &entities.Bout{
			CardID:      cardId,
			BoutNumber:  boutNumber,
			AgeCategory: ageCategory,
			Experience:  experience,
			Gender:      gender,
			WeightClass: weightClass,
			RoundLength: roundLength,
			GloveSize:   gloveSize,
			BoutType:    boutType,
			Status:      entities.BoutStatusNotStarted,
		}

		if h.athleteFinderCreator != nil {
			redName := col(row, "red")
			blueName := col(row, "blue")
			if redName != "" {
				id, findErr := h.athleteFinderCreator.FindOrCreateByName(redName, col(row, "redclub"))
				if findErr != nil {
					presenter.WithError(fmt.Errorf("row %d: athlete %q: %w", rowNum, redName, findErr)).Present()
					return
				}
				bout.RedAthleteID = &id
			}
			if blueName != "" {
				id, findErr := h.athleteFinderCreator.FindOrCreateByName(blueName, col(row, "blueclub"))
				if findErr != nil {
					presenter.WithError(fmt.Errorf("row %d: athlete %q: %w", rowNum, blueName, findErr)).Present()
					return
				}
				bout.BlueAthleteID = &id
			}
		}

		bouts = append(bouts, bout)
	}

	if h.cardQuerier != nil {
		if numJudges, qErr := h.cardQuerier.GetNumberOfJudges(cardId); qErr == nil {
			for _, b := range bouts {
				if b.BoutType == entities.BoutTypeScored {
					b.NumberOfJudges = numJudges
				}
			}
		}
	}

	err = h.useCase.CreateBulk(cardId, bouts)
	presenter.WithError(err).WithStatusCode(http.StatusCreated).Present()
}

type PickOverallWinnerRequest struct {
	Winner string `json:"winner"`
}

func (h *App) PickOverallWinner(w http.ResponseWriter, r *http.Request) {
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

	role, ok := rbac.GetRoleFromCtx(r.Context())
	if !ok {
		presenter.WithError(errors.New("unknown role")).Present()
		return
	}

	var req PickOverallWinnerRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		presenter.WithError(err).Present()
		return
	}
	if req.Winner != "red" && req.Winner != "blue" {
		presenter.WithError(errors.New("winner must be 'red' or 'blue'")).Present()
		return
	}

	err = h.scoreUseCase.SetOverallWinner(cardId, boutId, role, req.Winner)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	if h.audit != nil {
		_ = h.audit.Log(r.Context(), auditlogs.LogEntry{
			CardID:       cardId,
			BoutID:       &boutId,
			Action:       "judge.overall_winner.select",
			HumanSummary: "Judge selected overall winner",
			Metadata: map[string]any{
				"judgeRole": role,
				"winner":    req.Winner,
			},
		})
	}

	h.broadcaster.Notify()
	presenter.Present()
}

func (h *App) ListScores(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[map[int][]ScoreResponse](r, w)
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

	role, _ := rbac.GetRoleFromCtx(r.Context())
	isAdmin := role == rbac.Admin

	scoreList, err := h.scoreUseCase.List(cardId, boutId)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	sort.Slice(scoreList, func(i, j int) bool {
		return scoreList[i].JudgeRole < scoreList[j].JudgeRole
	})

	resp := make(map[int][]ScoreResponse)
	for _, s := range scoreList {
		resp[s.RoundNumber] = append(resp[s.RoundNumber], scoreToResponse(s, isAdmin))
	}

	presenter.WithData(resp).Present()
}
