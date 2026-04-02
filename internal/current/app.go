package current

import (
	"net/http"

	"github.com/ubaniak/scoreboard/internal/current/entities"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

type App struct {
	useCase UseCase
}

func NewApp(useCase UseCase) *App {
	return &App{useCase: useCase}
}

func (h *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	sr := rb.AddSubroute("current")
	sr.AddRoute("current", "", http.MethodGet, h.Current)
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
			ID:          current.Bout.ID,
			BoutNumber:  current.Bout.Number,
			RedCorner:   current.Bout.RedCorner,
			BlueCorner:  current.Bout.BlueCorner,
			Gender:      current.Bout.Gender,
			WeightClass: current.Bout.WeightClass,
			GloveSize:   current.Bout.GloveSize,
			RoundLength: current.Bout.RoundLength,
			AgeCategory: current.Bout.AgeCategory,
			Experience:  current.Bout.Experience,
			Status:      current.Bout.Status,
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

	presenter.WithData(response).Present()
}
