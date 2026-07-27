package auditlogs

import (
	"net/http"
	"time"

	"github.com/gorilla/mux"
	muxutils "github.com/ubaniak/scoreboard/internal/muxUtils"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

type App struct {
	uc UseCase
}

func NewApp(uc UseCase) *App {
	return &App{uc: uc}
}

func (a *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	// Admin-only: show audit logs on Card Details page.
	rb.AddRoute("auditlogs.list", "/cards/{cardId}/audit-logs", "GET", a.ListByCard, rbac.Admin)
}

type AuditLogResponse struct {
	ID          uint    `json:"id"`
	CreatedAt   string  `json:"createdAt"`
	CardID      uint    `json:"cardId"`
	BoutID      *uint   `json:"boutId,omitempty"`
	RoundNumber *int    `json:"roundNumber,omitempty"`
	ActorRole   string  `json:"actorRole"`
	ActorName   *string `json:"actorName,omitempty"`
	Action      string  `json:"action"`
	Summary     string  `json:"summary"`
	Metadata    string  `json:"metadata"`
}

func (a *App) ListByCard(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]AuditLogResponse](r, w)
	vars := mux.Vars(r)
	cardId, err := muxutils.ParseVars[uint](vars, "cardId")
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	list, err := a.uc.List(cardId)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	resp := make([]AuditLogResponse, 0, len(list))
	for _, l := range list {
		resp = append(resp, AuditLogResponse{
			ID:          l.ID,
			CreatedAt:   l.CreatedAt.Format(time.RFC3339),
			CardID:      l.CardID,
			BoutID:      l.BoutID,
			RoundNumber: l.RoundNumber,
			ActorRole:   l.ActorRole,
			ActorName:   l.ActorName,
			Action:      l.Action,
			Summary:     l.HumanSummary,
			Metadata:    l.MetadataJSON,
		})
	}

	presenter.WithData(resp).Present()
}

