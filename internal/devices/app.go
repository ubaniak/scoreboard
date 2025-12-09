package devices

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

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
	sr := rb.AddSubroute("devices")
	sr.AddRoute("register.judge", "/register/judge{id}", http.MethodGet, h.Register, rbac.Admin)
	sr.AddRoute("healthcheck", "/healthcheck", http.MethodGet, h.TestJudge, rbac.Judge)
	sr.AddRoute("test", "/judge", http.MethodGet, h.TestJudge, rbac.JudgeList...)
	sr.AddRoute("test", "/admin", http.MethodGet, h.TestAdmin, rbac.Admin)
	sr.AddRoute("test", "/sb", http.MethodGet, h.TestScoreboard)
}

func (h *App) Register(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[string](r, w)
	vars := mux.Vars(r)
	idStr := vars["id"]

	parsed, err := strconv.ParseInt(idStr, 10, 0)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	id := int(parsed)

	code, err := h.useCase.RegisterJudge(id)
	presenter.WithError(err).WithData(code).Present()
}

func (h *App) TestJudge(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[string](r, w)

	role, ok := rbac.GetRoleFromCtx(r.Context())
	if !ok {
		presenter.WithError(errors.New("no role")).Present()
	}

	presenter.WithData(fmt.Sprintf("Hello %s", role)).Present()
}

func (h *App) TestAdmin(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[string](r, w)

	role, ok := rbac.GetRoleFromCtx(r.Context())
	if !ok {
		presenter.WithError(errors.New("no role")).Present()
	}

	presenter.WithData(fmt.Sprintf("Hello %s", role)).Present()
}

func (h *App) TestScoreboard(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[string](r, w)

	presenter.WithData("scoreboard").Present()
}
