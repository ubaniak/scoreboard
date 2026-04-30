package scores

import (
	"net/http"

	"github.com/gorilla/mux"

	boutEntities "github.com/ubaniak/scoreboard/internal/bouts/entities"
	muxutils "github.com/ubaniak/scoreboard/internal/muxUtils"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

// BoutLister returns the bouts on a card. Kept narrow so this package does not
// depend on the bouts package directly.
type BoutLister interface {
	List(cardId uint) ([]*boutEntities.Bout, error)
}

// AthleteNamer resolves an athlete name from their ID.
type AthleteNamer interface {
	GetAthleteName(athleteID uint) string
}

type App struct {
	scoreUseCase UseCase
	bouts        BoutLister
	athletes     AthleteNamer
}

func NewApp(scoreUseCase UseCase, bouts BoutLister, athletes AthleteNamer) *App {
	return &App{scoreUseCase: scoreUseCase, bouts: bouts, athletes: athletes}
}

func (h *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	sr := rb.AddSubroute("cards")
	sr.AddRoute("scores.judge_consistency", "/{cardId}/judge-consistency", "GET", h.JudgeConsistency, rbac.Admin)
}

func (h *App) JudgeConsistency(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[JudgeConsistencyReport](r, w)
	vars := mux.Vars(r)

	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	bouts, err := h.bouts.List(cardId)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	metas := make([]BoutMeta, 0, len(bouts))
	for _, b := range bouts {
		if b.BoutType != boutEntities.BoutTypeScored {
			continue
		}
		scoreList, err := h.scoreUseCase.List(cardId, b.ID)
		if err != nil {
			presenter.WithError(err).Present()
			return
		}
		var redName, blueName string
		if h.athletes != nil {
			if b.RedAthleteID != nil {
				redName = h.athletes.GetAthleteName(*b.RedAthleteID)
			}
			if b.BlueAthleteID != nil {
				blueName = h.athletes.GetAthleteName(*b.BlueAthleteID)
			}
		}
		metas = append(metas, BoutMeta{
			BoutID:     b.ID,
			BoutNumber: b.BoutNumber,
			RedName:    redName,
			BlueName:   blueName,
			Winner:     b.Winner,
			Decision:   b.Decision,
			Scores:     scoreList,
		})
	}

	report := BuildReport(metas)
	presenter.WithData(report).Present()
}
