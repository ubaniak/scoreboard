package setup

import (
	"net/http"

	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

type App struct {
	useCase UseCase
}

func NewApp(useCase UseCase) *App {
	return &App{useCase: useCase}
}

func (a *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	sr := rb.AddSubroute("setup")
	sr.AddRoute("setup.status", "/status", http.MethodGet, a.Status)
	sr.AddRoute("setup.init", "", http.MethodPost, a.Setup)
}

type StatusResponse struct {
	Required bool `json:"required"`
}

func (a *App) Status(w http.ResponseWriter, r *http.Request) {
	presenters.NewHTTPPresenter[StatusResponse](r, w).
		WithData(StatusResponse{Required: a.useCase.IsSetupRequired()}).
		Present()
}

type SetupResponse struct {
	Code string `json:"code"`
}

func (a *App) Setup(w http.ResponseWriter, r *http.Request) {
	code, err := a.useCase.Setup()
	if err != nil {
		presenters.NewHTTPPresenter[SetupResponse](r, w).
			WithStatusCode(http.StatusConflict).
			WithError(err).
			Present()
		return
	}
	presenters.NewHTTPPresenter[SetupResponse](r, w).
		WithData(SetupResponse{Code: code}).
		Present()
}
