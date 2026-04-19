package current

import (
	"fmt"
	"net/http"

	"github.com/ubaniak/scoreboard/internal/current/entities"
	"github.com/ubaniak/scoreboard/internal/events"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

type App struct {
	useCase     UseCase
	broadcaster *events.Broadcaster
}

func NewApp(useCase UseCase, broadcaster *events.Broadcaster) *App {
	return &App{useCase: useCase, broadcaster: broadcaster}
}

func (h *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	rb.AddRoute("current", "/current", http.MethodGet, h.Current)
	rb.AddRoute("current.schedule", "/current/schedule", http.MethodGet, h.Schedule)
	rb.AddRoute("current.events", "/current/events", http.MethodGet, h.Events)
}

func (h *App) Current(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[entities.CurrentResponse](r, w)
	current, err := h.useCase.Current()

	if err != nil {
		if current == nil {
			presenter.WithStatusCode(http.StatusNotFound).WithError(err).Present()
			return
		}
	}

	response := entities.CurrentResponse{}
	if current.Card != nil {
		response.Card = &entities.CurrentCardResponse{
			ID:   current.Card.ID,
			Name: current.Card.Name,
		}
	}

	if current.Bout != nil {
		response.Bout = &entities.CurrentBoutResponse{
			ID:                  current.Bout.ID,
			BoutNumber:          current.Bout.Number,
			BoutType:            current.Bout.BoutType,
			RedCorner:           current.Bout.RedCorner,
			BlueCorner:          current.Bout.BlueCorner,
			Gender:              current.Bout.Gender,
			WeightClass:         current.Bout.WeightClass,
			GloveSize:           current.Bout.GloveSize,
			RoundLength:         current.Bout.RoundLength,
			AgeCategory:         current.Bout.AgeCategory,
			Experience:          current.Bout.Experience,
			Status:              current.Bout.Status,
			Decision:            current.Bout.Decision,
			Winner:              current.Bout.Winner,
			RedClubName:         current.Bout.RedClubName,
			BlueClubName:        current.Bout.BlueClubName,
			RedAthleteImageUrl:  current.Bout.RedAthleteImageUrl,
			BlueAthleteImageUrl: current.Bout.BlueAthleteImageUrl,
		}
	}

	if current.NextBout != nil {
		response.NextBout = &entities.CurrentBoutResponse{
			ID:          current.NextBout.ID,
			BoutNumber:  current.NextBout.Number,
			BoutType:    current.NextBout.BoutType,
			RedCorner:   current.NextBout.RedCorner,
			BlueCorner:  current.NextBout.BlueCorner,
			Gender:      current.NextBout.Gender,
			WeightClass: current.NextBout.WeightClass,
			GloveSize:   current.NextBout.GloveSize,
			RoundLength: current.NextBout.RoundLength,
			AgeCategory: current.NextBout.AgeCategory,
			Experience:  current.NextBout.Experience,
			Status:      current.NextBout.Status,
		}
	}

	if current.Round != nil {
		response.Round = &entities.CurrentRoundResponse{
			RoundNumber: current.Round.Number,
			Status:      current.Round.Status,
		}
	}

	if len(current.Scores) > 0 {
		response.Scores = make(map[int][]entities.CurrentScoreResponse)
		for roundNum, roundScores := range current.Scores {
			mapped := make([]entities.CurrentScoreResponse, len(roundScores))
			for i, s := range roundScores {
				mapped[i] = entities.CurrentScoreResponse{Red: s.Red, Blue: s.Blue}
			}
			response.Scores[roundNum] = mapped
		}
	}

	if len(current.Warnings) > 0 {
		response.Warnings = make(map[int]*entities.CurrentWarningsResponse)
		for roundNum, w := range current.Warnings {
			response.Warnings[roundNum] = &entities.CurrentWarningsResponse{Red: w.Red, Blue: w.Blue}
		}
	}

	presenter.WithData(response).Present()
}

func (h *App) Schedule(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[entities.BoutListResponse](r, w)
	result, err := h.useCase.List()
	if err != nil {
		presenter.WithStatusCode(http.StatusInternalServerError).WithError(err).Present()
		return
	}

	response := entities.BoutListResponse{
		Bouts: make([]entities.BoutListItemResponse, 0, len(result.Bouts)),
	}
	if result.Card != nil {
		response.Card = &entities.CurrentCardResponse{
			ID:   result.Card.ID,
			Name: result.Card.Name,
		}
	}
	for _, b := range result.Bouts {
		response.Bouts = append(response.Bouts, entities.BoutListItemResponse{
			ID:                  b.ID,
			BoutNumber:          b.Number,
			BoutType:            b.BoutType,
			RedCorner:           b.RedCorner,
			BlueCorner:          b.BlueCorner,
			Status:              b.Status,
			Winner:              b.Winner,
			Decision:            b.Decision,
			WeightClass:         b.WeightClass,
			GloveSize:           b.GloveSize,
			RoundLength:         b.RoundLength,
			AgeCategory:         b.AgeCategory,
			Experience:          b.Experience,
			RedClubName:         b.RedClubName,
			BlueClubName:        b.BlueClubName,
			RedAthleteImageUrl:  b.RedAthleteImageUrl,
			BlueAthleteImageUrl: b.BlueAthleteImageUrl,
		})
	}

	presenter.WithData(response).Present()
}

func (h *App) Events(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)

	rc := http.NewResponseController(w)

	// Send an initial ping so the client knows the connection is established.
	fmt.Fprintf(w, ": ping\n\n")
	if err := rc.Flush(); err != nil {
		return
	}

	ch := h.broadcaster.Subscribe()
	defer h.broadcaster.Unsubscribe(ch)

	for {
		select {
		case <-r.Context().Done():
			return
		case <-ch:
			fmt.Fprintf(w, "event: update\ndata: {}\n\n")
			if err := rc.Flush(); err != nil {
				return
			}
		}
	}
}
