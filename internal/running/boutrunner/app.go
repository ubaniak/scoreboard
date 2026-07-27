package boutrunner

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sort"

	"github.com/gorilla/mux"

	"github.com/ubaniak/scoreboard/internal/evaluation/auditlogs"
	"github.com/ubaniak/scoreboard/internal/matchmaking/bouts/entities"
	muxutils "github.com/ubaniak/scoreboard/internal/muxUtils"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
	"github.com/ubaniak/scoreboard/internal/running/events"
	"github.com/ubaniak/scoreboard/internal/running/round"
	roundEntities "github.com/ubaniak/scoreboard/internal/running/round/entities"
	"github.com/ubaniak/scoreboard/internal/running/scores"
	scoreEntities "github.com/ubaniak/scoreboard/internal/running/scores/entities"
)

type App struct {
	useCase      UseCase
	roundUseCase round.UseCase
	scoreUseCase scores.UseCase
	broadcaster  *events.Broadcaster
	audit        auditlogs.UseCase
}

func NewApp(useCase UseCase, roundUseCase round.UseCase, scoreUseCase scores.UseCase, broadcaster *events.Broadcaster, audit auditlogs.UseCase) *App {
	return &App{useCase: useCase, roundUseCase: roundUseCase, scoreUseCase: scoreUseCase, broadcaster: broadcaster, audit: audit}
}

func (a *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	rb.AddRoute("fouls", "/{cardId}/fouls", "GET", a.ListFouls, rbac.Admin)

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

	boutType, err := h.useCase.GetBoutType(cardId, boutId)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	if boutType != entities.BoutTypeScored {
		presenter.WithError(fmt.Errorf("cannot score %s bout", boutType)).Present()
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

	boutType, err := h.useCase.GetBoutType(cardId, boutId)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	if boutType != entities.BoutTypeScored {
		presenter.WithError(fmt.Errorf("cannot score %s bout", boutType)).Present()
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

	boutType, err := h.useCase.GetBoutType(cardId, boutId)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}
	if boutType != entities.BoutTypeScored {
		presenter.WithError(fmt.Errorf("cannot score %s bout", boutType)).Present()
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
