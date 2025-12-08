package login

import (
	"encoding/json"
	"net/http"

	"github.com/ubaniak/scoreboard/internal/auth"
	"github.com/ubaniak/scoreboard/internal/presenters"
	"github.com/ubaniak/scoreboard/internal/rbac"
)

type App struct {
	useCase auth.UseCase
}

func NewApp(useCase auth.UseCase) *App {
	return &App{useCase: useCase}
}

func (h *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	rb.AddRoute("login", "/login", "POST", h.Login)
	rb.AddRoute("login", "/login", "GET", h.Get)
}

type LoginRequest struct {
	Role string `json:"role"`
	Code string `json:"code"`
}

func (h *App) Get(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[string](r, w)
	presenter.WithData("hi").Present()
}

func (h *App) Login(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[string](r, w)

	var loginRequest LoginRequest
	err := json.NewDecoder(r.Body).Decode(&loginRequest)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	token, err := h.useCase.Login(loginRequest.Role, loginRequest.Code)
	presenter.WithError(err).WithData(token).Present()
}
