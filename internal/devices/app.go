package devices

import (
	"encoding/json"
	"errors"
	"fmt"
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

func (h *App) RegisterRoutes(rb *rbac.RouteBuilder) {
	sr := rb.AddSubroute("devices")
	sr.AddRoute("baseUrl", "/baseurl", http.MethodGet, h.BaseUrl, rbac.Admin)
	sr.AddRoute("judges", "/judges", http.MethodGet, h.Judges, rbac.Admin)
	sr.AddRoute("code", "/code", http.MethodPost, h.Code, rbac.Admin)
	sr.AddRoute("healthCheck", "/healthcheck", http.MethodGet, h.JudgeHealthCheck, rbac.Judge)
}
func (h *App) BaseUrl(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[string](r, w)
	ip := h.useCase.LocalIp()
	presenter.WithData(ip).Present()
}

type JudgesResponse struct {
	Role   string `json:"role"`
	Code   string `json:"code"`
	Status string `json:"status"`
}

func (h *App) Judges(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[[]JudgesResponse](r, w)
	judges, err := h.useCase.Judges()
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	var response = make([]JudgesResponse, len(judges))
	for i, judge := range judges {
		response[i] = JudgesResponse{
			Role:   judge.Role,
			Code:   judge.Code,
			Status: string(judge.Status),
		}
	}

	presenter.WithData(response).Present()
}

type RegisterRequest struct {
	Role Role `json:"role"`
}

func (h *App) Code(w http.ResponseWriter, r *http.Request) {
	presenter := presenters.NewHTTPPresenter[string](r, w)

	var req RegisterRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		presenter.WithError(err).Present()
		return
	}

	if !req.Role.Validate() {
		presenter.WithError(fmt.Errorf("unknown role %s", req.Role)).Present()
	}

	code, err := h.useCase.GenerateCode(req.Role, Limits[req.Role])

	presenter.WithError(err).WithData(code).Present()
}

func (h *App) JudgeHealthCheck(w http.ResponseWriter, r *http.Request) {
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
